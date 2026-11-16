(() => {
  for (const study of document.querySelectorAll('.model-study')) {
  const panel = study.closest('details');
  const stage = study.querySelector('.model-stage');
  const turntable = study.querySelector('.turntable');
  const hint = study.querySelector('.model-tools p');
  const reference = panel.querySelector('#character-reference');
  const tabs = [...panel.querySelectorAll('[data-character],[data-resident]')];
  const characters = {
    alien: {name: 'Alien intern', description: 'The alien’s blue suit and green eyes in YuJie’s colour study'},
    staff: {name: 'Iron Gentleman', description: 'The patrol guard’s bowler hat and black gloves in YuJie’s colour study'}
  };

  const keyFor = b => b.dataset.character || ['momo','kiki','stella','mia','roy'][Number(b.dataset.resident)];
  for (const b of tabs) if (!characters[keyFor(b)]) characters[keyFor(b)] = {name:b.textContent.trim()};
  let character = keyFor(tabs[0]);
  let frame = 0;
  let viewer;
  let library;
  let revision = 0;
  let dragStart;

  function showFrame(value) {
    frame = (value % 24 + 24) % 24;
    turntable.style.backgroundPosition = (frame % 6 * 20) + '% ' + (Math.floor(frame / 6) * 100 / 3) + '%';
  }

  function useTurntable() {
    viewer?.remove();
    viewer = undefined;
    turntable.hidden = false;
    turntable.style.backgroundImage = 'url("media/models/' + character + '-turntable.webp")';
    turntable.setAttribute('aria-label', characters[character].name + ', rotatable model');
    hint.textContent = 'Drag to rotate';
    showFrame(0);
  }

  function loadViewer() {
    if (!library) {
      library = (async () => {
        if (location.protocol === 'file:' || !window.WebGL2RenderingContext) return false;
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2');
        if (!gl) return false;
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        await import('./assets/model-viewer.min.js');
        return true;
      })().catch(() => false);
    }
    return library;
  }

  async function displayCharacter() {
    const request = ++revision;
    useTurntable();
    if (!await loadViewer() || request !== revision || !panel.open) return;
    const model = document.createElement('model-viewer');
    viewer = model;
    model.alt = characters[character].name + ', 3D character model';
    model.setAttribute('camera-controls', '');
    model.setAttribute('disable-pan', '');
    model.setAttribute('touch-action', 'pan-y');
    model.setAttribute('interaction-prompt', 'none');
    model.setAttribute('camera-orbit', '15deg 85deg auto');
    model.setAttribute('shadow-intensity', '0.45');
    model.setAttribute('loading', 'eager');
    model.setAttribute('aria-hidden', 'true');
    model.inert = true;
    model.addEventListener('load', () => {
      if (request !== revision) return;
      model.classList.add('ready');
      model.removeAttribute('aria-hidden');
      model.inert = false;
      if (turntable === document.activeElement) model.focus();
      turntable.hidden = true;
      hint.textContent = 'Drag to orbit · Scroll or pinch to zoom';
    }, {once: true});
    model.addEventListener('error', () => {
      if (request === revision) useTurntable();
    });
    model.src = 'media/models/' + character + '.glb';
    stage.append(model);
  }

  function rotate(direction) {
    if (!viewer?.classList.contains('ready')) {
      showFrame(frame + direction);
      return;
    }
    const orbit = viewer.getCameraOrbit();
    const theta = orbit.theta + direction * Math.PI / 12;
    viewer.setAttribute('camera-orbit', theta + 'rad ' + orbit.phi + 'rad ' + orbit.radius + 'm');
  }

  tabs.forEach(button => button.addEventListener('click', () => {
    if (keyFor(button) === character) return;
    character = keyFor(button);
    tabs.forEach(tab => tab.setAttribute('aria-pressed', String(tab === button)));
    if (reference) reference.src = 'media/' + character + '-reference.webp';
    if (reference) reference.alt = characters[character].description;
    displayCharacter();
  }));

  study.querySelector('[data-orbit="-1"]').addEventListener('click', () => rotate(-1));
  study.querySelector('[data-orbit="1"]').addEventListener('click', () => rotate(1));
  turntable.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    rotate(event.key === 'ArrowLeft' ? -1 : 1);
  });
  turntable.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary) return;
    turntable.setPointerCapture(event.pointerId);
    dragStart = {x: event.clientX, frame};
  });
  turntable.addEventListener('pointermove', event => {
    if (dragStart && turntable.hasPointerCapture(event.pointerId)) {
      showFrame(dragStart.frame + Math.round((dragStart.x - event.clientX) / 12));
    }
  });
  turntable.addEventListener('lostpointercapture', () => { dragStart = undefined; });
  panel.addEventListener('toggle', () => {
    if (panel.open) displayCharacter();
    else {
      revision++;
      viewer?.remove();
      viewer = undefined;
    }
  });
  if (panel.open) displayCharacter();
  }
})();
