(() => {
  // Image boards share the same zoom controls as the PDF spreads.
  const imageBoards = {cypher: [3000, 2160]};
  const boards = {
    cypher: ['CYPHER', ['Game jam design board']],
    'the-nonsensians': ['The Nonsensians', ['Cover', 'Inspiration and design goal', 'Game flow and characters', 'Research specimens', 'Character design', 'Level process and gameplay', 'Environment models and playtests']],
    'the-worker': ['The Worker.exe', ['Cover', 'Concept and game flow', 'Character progression', 'Pixel world', 'The Fragmented Core', 'Companion abilities', 'Drafts and iteration']],
    'karma': ['KARMA', ['Cover', 'Folklore research', 'Rules and setup', 'Card anatomy', 'Board iterations', 'Playtests', 'Full card collection']],
    'puffy-park': ['Puffy Park', ['Cover', 'Building the park', 'Park residents', 'Rides and attractions', 'Stalls and balloons', 'Modelling process']],
    'drawing-studies': ['Drawing portfolio', ['Cover', 'Still life', 'Figure and portrait', 'Clay sculpture', 'Line studies']],
    'digital-studies': ['3D modelling portfolio', ['Cover', 'Storefront study', 'Modelling process', 'Computer and character', 'Camera and character', 'Character wireframes']]
  };
  const practice = {
    'practice-2d': [
      ['portrait', 'Portrait study in graphite', 677, 887],
      ['still-life', 'Still life with kettle', 724, 935],
      ['line-study', 'Line study of a carved head', 567, 740]
    ],
    'practice-3d': [
      ['clay-figure', 'Standing figure in clay', 937, 1250],
      ['computer', 'Desktop computer model', 1000, 920],
      ['facade', 'Storefront model', 1050, 734],
      ['camera', 'Camera model', 900, 818]
    ]
  };
  for (const [group, items] of Object.entries(practice)) {
    const title = document.querySelector('#' + group + ' h3').textContent;
    boards[group] = [title, items.map(study => study[1])];
  }
  const reader = document.getElementById('board-reader');
  const within = selector => reader.querySelector(selector);
  const viewport = within('.reader-viewport');
  const sheet = within('.reader-sheet');
  const image = within('#plate-image');
  const canvas = within('#plate-canvas');
  const strip = within('.plate-strip');
  const caption = within('#plate-caption');
  const prev = within('#plate-prev');
  const next = within('#plate-next');
  const zoomIn = within('#zoom-in');
  const zoomOut = within('#zoom-out');
  const fit = within('#zoom-fit');
  const remembered = new Map();
  const zoomLevels = [1, 1.5, 2, 3, 5, 8, 10];
  let key, position = 0, zoom = 0, opener;
  let pdfTask, pdfPage, paintTask, paintVersion = 0, resizeTimer;
  const artworkSource = index => practice[key]
    ? 'media/' + practice[key][index][0] + '.webp'
    : 'media/plates/' + key + '/' + (index + 1) + '.jpg';

  function cancelPaint() {
    paintVersion++;
    if (paintTask) { paintTask.cancel(); paintTask = null; }
  }
  function discardDocument() {
    cancelPaint();
    pdfPage = null;
    if (pdfTask) { pdfTask.destroy().catch(() => {}); pdfTask = null; }
  }
  async function paint() {
    cancelPaint();
    canvas.hidden = true;
    if (!pdfPage || !reader.open) return;
    const version = paintVersion;
    const page = pdfPage;
    const spreads = boards[key][1].length;
    const raw = page.getViewport({scale:1});
    const stripHeight = raw.height / spreads;
    const width = Math.min(3000, Math.ceil(sheet.clientWidth * Math.min(devicePixelRatio || 1, 2)));
    if (!width) return;
    const scale = width / raw.width;
    canvas.width = width;
    canvas.height = Math.round(stripHeight * scale);
    try {
      const task = page.render({
        canvasContext: canvas.getContext('2d', {alpha:false}),
        viewport: page.getViewport({scale}),
        transform: [1, 0, 0, 1, 0, -position * stripHeight * scale],
        background: '#fff'
      });
      paintTask = task;
      await task.promise;
      if (version === paintVersion && reader.open) { canvas.hidden = false; paintTask = null; }
    } catch {
      // The original JPEG embedded in this PDF is already visible below the canvas.
    }
  }
  async function loadPdf(board) {
    // Browsers restrict module and PDF fetches on file://. The original embedded plates also work there.
    if (location.protocol === 'file:') return;
    let loading;
    try {
      const lib = await import('./assets/pdf.min.js');
      if (!reader.open || key !== board) return;
      lib.GlobalWorkerOptions.workerSrc = new URL('assets/pdf.worker.min.js', document.baseURI).href;
      loading = lib.getDocument({url:'media/' + board + '.pdf', isEvalSupported:false, useSystemFonts:false});
      pdfTask = loading;
      const doc = await loading.promise;
      const page = await doc.getPage(1);
      if (pdfTask !== loading || !reader.open) return;
      pdfPage = page;
      paint();
    } catch {
      // Reading remains available if workers or PDF rendering are unavailable.
    }
  }
  function sizeSheet() {
    const [width, height] = practice[key] ? practice[key][position].slice(2) : (imageBoards[key] || [3000, 1080]);
    const available = Math.min(viewport.clientWidth, viewport.clientHeight * width / height);
    sheet.style.aspectRatio = width + '/' + height;
    sheet.style.width = Math.min(3000, Math.round(available * zoomLevels[zoom])) + 'px';
    zoomIn.disabled = zoom === zoomLevels.length - 1 || sheet.clientWidth >= 3000;
    zoomOut.disabled = zoom === 0;
    fit.textContent = zoom === 0 ? 'Fit' : Math.round(100 * sheet.clientWidth / available) + '%';
    fit.title = 'Fit artwork to screen';
    paint();
  }
  function setZoom(value) {
    const size = sheet.clientWidth;
    const fx = size > viewport.clientWidth ? (viewport.scrollLeft + viewport.clientWidth / 2) / size : 0.5;
    const fy = sheet.clientHeight > viewport.clientHeight ? (viewport.scrollTop + viewport.clientHeight/2)/sheet.clientHeight : 0.5;
    zoom = Math.max(0, Math.min(zoomLevels.length - 1, value));
    sizeSheet();
    viewport.scrollLeft = fx * sheet.clientWidth - viewport.clientWidth / 2;
    viewport.scrollTop = fy * sheet.clientHeight - viewport.clientHeight / 2;
  }
  function show(index) {
    const [title, spreads] = boards[key];
    position = Math.max(0, Math.min(spreads.length - 1, index));
    remembered.set(key, position);
    zoom = 0;
    image.src = artworkSource(position);
    image.alt = title + ' — ' + spreads[position];
    caption.textContent = (position + 1) + ' / ' + spreads.length + ' · ' + spreads[position];
    prev.disabled = position === 0;
    next.disabled = position === spreads.length - 1;
    Array.from(strip.children).forEach((button, i) => {
      button.setAttribute('aria-pressed', String(i === position));
    });
    const active = strip.children[position];
    strip.scrollLeft = active.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2;
    viewport.scrollTo(0,0);
    sizeSheet();
  }
  function open(event) {
    opener = event.currentTarget;
    const project = opener.closest('.project');
    if (project) reader.dataset.work = project.dataset.work;
    else delete reader.dataset.work;
    const isPractice = opener.hasAttribute('data-study');
    key = isPractice ? opener.closest('.practice-group').id : opener.dataset.board;
    within('.reader-type').textContent = isPractice ? 'Daily Practice' : 'Portfolio board';
    reader.classList.toggle('study-reader', isPractice);
    const itemType = isPractice ? 'study' : 'spread';
    prev.setAttribute('aria-label', 'Previous ' + itemType);
    next.setAttribute('aria-label', 'Next ' + itemType);
    strip.setAttribute('aria-label', isPractice ? boards[key][0] : 'Board spreads');
    const [title, spreads] = boards[key];
    within('#reader-title').textContent = title;
    strip.replaceChildren(...spreads.map((label, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', (isPractice ? 'Study ' : 'Spread ') + (index + 1) + ', ' + label);
      const thumb = new Image();
      thumb.alt = '';
      thumb.src = isPractice ? 'media/thumbs/study-' + practice[key][index][0] + '.jpg' : 'media/thumbs/' + key + '-' + (index + 1) + '.jpg';
      thumb.width = 160; thumb.height = 58;
      button.append(thumb);
      button.addEventListener('click', () => show(index));
      return button;
    }));
    reader.showModal();
    document.body.classList.add('reading-board');
    show(isPractice ? practice[key].findIndex(study => study[0] === opener.dataset.study) : remembered.get(key) || 0);
    if (!isPractice && !imageBoards[key]) loadPdf(key);
  }
  document.querySelectorAll('[data-board], [data-study]').forEach(button => button.addEventListener('click', open));
  prev.onclick = () => show(position - 1);
  next.onclick = () => show(position + 1);
  zoomIn.onclick = () => setZoom(zoom + 1);
  zoomOut.onclick = () => setZoom(zoom - 1);
  fit.onclick = () => setZoom(0);
  within('#reader-close').onclick = () => reader.close();
  reader.addEventListener('keydown', e => {
    if (zoom > 0 && e.target === viewport) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      show(position + (e.key === 'ArrowRight' ? 1 : -1));
    }
  });
  reader.addEventListener('close', () => {
    clearTimeout(resizeTimer);
    discardDocument();
    document.body.classList.remove('reading-board');
    opener?.focus({preventScroll:true});
  });
  new ResizeObserver(() => {
    if (!reader.open) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(sizeSheet, 80);
  }).observe(viewport);
})();
