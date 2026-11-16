(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const engine = window.anime;
  const intro = document.querySelector("#intro");

  function runIntro() {
    if (reduced.matches || !engine) {
      intro.hidden = true;
      return;
    }
    intro.hidden = false;
    const inputs = new AbortController();
    const dismiss = () => {
      intro.hidden = true;
      inputs.abort();
      window.clearTimeout(timeout);
    };
    document.addEventListener('keydown', dismiss, {signal: inputs.signal});
    document.addEventListener('pointerdown', dismiss, {signal: inputs.signal});
    reduced.addEventListener('change', dismiss, {signal: inputs.signal});
    const timeout = window.setTimeout(dismiss, 1900);
    engine.createTimeline({onComplete: dismiss})
      .add(intro.querySelector('img'), {x: [-16, 0], opacity: [0, 1], duration: 310, ease: 'out(3)'}, 0)
      .add(intro.querySelector('div > span'), {y: [8, 0], opacity: [0, 1], duration: 330, ease: 'out(3)'}, 70)
      .add(intro, {y: ['0%', '-101%'], duration: 470, ease: 'inOut(3)'}, 880);
  }

  function reveal(node) {
    if (engine && !reduced.matches) {
      engine.animate(node, { opacity: [0.75, 1], y: [5, 0], duration: 260, ease: "out(3)" });
    }
  }

  function bindSelector(attribute, selectItem) {
    const buttons = Array.from(document.querySelectorAll("[data-" + attribute + "]"));
    buttons.forEach((button, index) => {
      button.addEventListener("click", () => {
        if (button.getAttribute("aria-pressed") === "true") return;
        buttons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
        selectItem(index, button);
      });
    });
  }

  bindSelector("feature", (_, button) => {
    clearPointer();
    const {feature, art, kicker, alt} = button.dataset;
    const title = button.querySelector("span").textContent;
    const link = document.getElementById("feature-link");
    const image = document.getElementById("feature-art");
    link.href = "#" + feature;
    link.dataset.work = feature;
    link.setAttribute("aria-label", "Open " + title + " case study");
    image.src = "media/" + art + ".webp";
    image.alt = alt;
    document.getElementById("feature-name").textContent = title;
    document.getElementById("feature-kicker").textContent = kicker;
    if (engine && !reduced.matches) {
      engine.animate(image, {opacity: [.75, 1], duration: 240, ease: "out(3)"});
    }
  });

  const levels = [
    ["zero-one", "Sector Zero-One, a monochrome platform level", "The worker begins as a pair of eyes inside a square."],
    ["glitch-metropolis", "Glitch Metropolis with crimson trees and floating platforms", "In Glitch Metropolis the worker has a pixel body. Rescuing characters adds abilities for getting past obstacles."],
    ["fragmented-core", "The Fragmented Core with pink waterfalls and a drawn character", "By The Fragmented Core the worker has a drawn body and a full set of animation poses."]
  ];
  const residents = [
    ["momo", "Momo, a yellow plush creature with pink spots", "Momo worries about having fewer hands than everyone else. Almost nobody here has hands."],
    ["kiki", "Kiki, a turquoise plush resident", "Kiki is the optimist of the park. Everything still lies ahead."],
    ["stella", "Stella, a green serpentine creature", "Stella dreams of becoming an astronaut."],
    ["mia", "Mia, a purple plant with green leaves", "Mia is a plant with a taste for extreme sports."],
    ["roy", "Roy, a red plush resident with a broad snout", "Roy is convinced he is a gloomy pig. The others aren’t so sure."]
  ];

  function bindGallery(attribute, imageId, captionId, items) {
    const image = document.getElementById(imageId);
    const caption = document.getElementById(captionId);
    bindSelector(attribute, (index) => {
      const [file, alt, text] = items[index];
      image.src = "media/" + file + ".webp";
      image.alt = alt;
      caption.textContent = text;
      reveal(image);
    });
  }

  bindGallery("office", "office-art", "office-caption", [
    ["office-01", "The alien moves through the office beneath a long table", "From the intern’s height, a meeting table becomes a hiding place."],
    ["office-23", "The intern faces a guard between two rows of desks", "The Iron Gentleman patrols the open aisle between the desks."],
    ["office-36", "The researcher and the guard cross paths in a bright office", "In the open, the intern can turn invisible to evade pursuit."],
    ["office-48", "A view from behind the alien beside a table and rows of chairs", "Chairs and table legs break the guard’s line of sight."],
    ["office-52", "The alien’s green light falls across the floor of a storeroom", "Among the shelves, an everyday office object can become a research specimen."]
  ]);
  bindGallery("level", "level-art", "level-caption", levels);
  bindGallery("resident", "resident-art", "resident-caption", residents);

  const jamPanel = document.getElementById('cypher');
  const sprite = document.getElementById('jam-sprite');
  const playAnimation = document.getElementById('jam-play');
  function selectSprite() {
    const colour = jamPanel.querySelector('[data-jam-colour][aria-pressed="true"]').dataset.jamColour;
    const cycle = jamPanel.querySelector('[data-jam-cycle][aria-pressed="true"]').dataset.jamCycle;
    sprite.style.backgroundImage = 'url("media/cypher/' + cycle + '-' + colour + '.webp")';
    sprite.style.setProperty('--frames', cycle === 'walk' ? 4 : 2);
    sprite.style.setProperty('--duration', cycle === 'walk' ? '.54s' : '.8s');
    sprite.setAttribute('aria-label', colour + ' agent, ' + cycle + ' cycle');
  }
  bindSelector('jam-colour', selectSprite);
  bindSelector('jam-cycle', selectSprite);
  function setPlaying(playing) {
    sprite.classList.toggle('is-playing', playing);
    playAnimation.textContent = playing ? 'Pause animation' : 'Play animation';
  }
  playAnimation.addEventListener('click', () => setPlaying(!sprite.classList.contains('is-playing')));
  jamPanel.addEventListener('toggle', () => { if (!jamPanel.open) setPlaying(false); });

  function caseAt(hash) {
    const target = document.getElementById(hash.substring(1));
    return target && target.matches("details.case-body") ? target : null;
  }
  function openCase(panel, focus) {
    panel.open = true;
    if (focus) panel.querySelector("summary").focus({ preventScroll: true });
    panel.closest("article").scrollIntoView({ block: "start" });
  }
  document.querySelectorAll(".case-cover, .case-title, .feature-image").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const panel = caseAt(link.hash);
      if (!panel) return;
      event.preventDefault();
      if (location.hash !== link.hash) history.pushState(null, "", link.hash);
      clearPointer();
      openCase(panel, true);
    });
  });
  function restoreCase() {
    const panel = caseAt(location.hash);
    if (panel) openCase(panel, false);
  }
  document.querySelectorAll(".case-body").forEach((panel) => {
    const label = panel.querySelector("summary").firstChild;
    panel.addEventListener("toggle", () => {
      label.nodeValue = panel.open ? "Close case study " : "Read case study ";
      if (!panel.open) {
        panel.querySelector("video")?.pause();
        if (location.hash === "#" + panel.id) history.replaceState(null, "", location.pathname + location.search);
      }
    });
  });
  window.addEventListener("hashchange", restoreCase);
  restoreCase();

  // Omar Essam's project rows switch foreground and background on entry. The
  // following marker identifies the selected game with the student's own artwork.
  const pointer = document.getElementById('project-cursor');
  const markerImage = pointer.querySelector('img');
  const markerLabel = pointer.querySelector('span');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const identities = new Map(Array.from(document.querySelectorAll("[data-feature]"), button => [
    button.dataset.feature, [button.textContent.trim(), button.querySelector("img").getAttribute("src")]
  ]));
  let surface = null;
  let frame = 0;
  let x = 0, y = 0, targetX = 0, targetY = 0;
  let markerWidth = 0, markerHeight = 0;

  function clearPointer() {
    surface = null;
    pointer.hidden = true;
    cancelAnimationFrame(frame);
    frame = 0;
  }

  function follow() {
    const settled = Math.abs(targetX - x) + Math.abs(targetY - y) < 0.6;
    x = settled ? targetX : x + (targetX - x) * 0.32;
    y = settled ? targetY : y + (targetY - y) * 0.32;
    pointer.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    frame = settled ? 0 : requestAnimationFrame(follow);
  }

  function move(event) {
    if (event.pointerType === 'touch' || !finePointer.matches || reduced.matches ||
        !intro.hidden || document.querySelector('dialog[open]')) return;
    const region = event.currentTarget;
    if (region.matches('.project:has(.case-body[open])') && !event.target.closest('.project-lead, summary')) {
      if (surface) clearPointer();
      return;
    }
    const entered = surface !== region;
    if (entered) {
      clearPointer();
      surface = region;
      const [name, asset] = identities.get(region.dataset.work);
      markerImage.src = asset;
      markerLabel.textContent = name;
      pointer.dataset.work = region.dataset.work;
      pointer.hidden = false;
      markerWidth = pointer.offsetWidth;
      markerHeight = pointer.offsetHeight;
    }
    targetX = event.clientX + 18 + markerWidth > document.documentElement.clientWidth
      ? Math.max(4, event.clientX - markerWidth - 14) : event.clientX + 18;
    targetY = event.clientY + 16 + markerHeight > window.innerHeight
      ? Math.max(4, event.clientY - markerHeight - 14) : event.clientY + 16;
    if (entered) { x = targetX; y = targetY; }
    if (!frame) follow();
  }

  document.querySelectorAll('.project, .feature-image').forEach(region => {
    region.addEventListener('pointermove', move, {passive: true});
    region.addEventListener('pointerleave', clearPointer);
    region.addEventListener('pointercancel', clearPointer);
  });
  window.addEventListener('scroll', clearPointer, {passive: true});
  window.addEventListener('blur', clearPointer);
  document.addEventListener('keydown', clearPointer);
  finePointer.addEventListener('change', clearPointer);
  reduced.addEventListener('change', clearPointer);

  runIntro();
})();


(() => {
  const dialog = document.querySelector('#gameplay-film'), video = dialog.querySelector('video');
  document.querySelector('.walkthrough-note').addEventListener('click', () => {
    dialog.showModal(); video.play().catch(() => {});
  });
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => {
    const r = dialog.getBoundingClientRect();
    if (e.target === dialog && (e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => { video.pause(); video.currentTime = 0; });
})();
