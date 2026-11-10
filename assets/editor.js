/* EasyPDF editor: add text, drawings, highlights, covers and pictures to a PDF, in the browser.
   pdf.js (bundled in assets/vendor/pdfjs) shows the pages. pdf-lib writes the finished file.
   Everything is measured in PDF points on the page as it is displayed (origin top-left). */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  if (!$('ed')) return;
  const VENDOR = '/assets/vendor/pdfjs/';
  const PDFLIB_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
  const SIZES = { s: { text: 12, pen: 2 }, m: { text: 18, pen: 4 }, l: { text: 28, pen: 8 } };
  const BLACK = '#111111', YELLOW = '#fcc419';
  const HELP = {
    select: 'Tap an item to select it, then drag it to move it. Drag empty space to scroll.',
    text: 'Tap the page where you want the text, type it, then press Enter.',
    draw: 'Draw or sign with your finger or mouse. Choose Select when you want to scroll.',
    hl: 'Drag across the part of the page you want to highlight.',
    white: 'Drag a box to cover part of the page. This hides it only visually, so don’t use it for secrets.',
    img: 'Choose a picture, then tap the page where it should go.',
  };
  const LATIN = /^[\u0020-\u007e\u00a0-\u00ff\u20ac\u2018\u2019\u201c\u201d\u2013\u2014\u2022\u2026]*$/;
  let pdfjs = null, bytes = null, doc = null, fname = 'document.pdf';
  let order = [], cards = new Map(), pages = new Map(), imgs = new Map(), history = [];
  let tool = 'select', color = BLACK, size = 'm', sel = null, placing = null, drag = null, textBox = null, nid = 0, url = null, busy = false;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = n => Math.round(n * 100) / 100;
  const fmt = n => n < 1048576 ? Math.max(1, Math.round(n / 1024)) + ' KB' : (n / 1048576).toFixed(1) + ' MB';
  const loadLib = () => window.PDFLib ? Promise.resolve() : new Promise((res, rej) => { const s = document.createElement('script'); s.src = PDFLIB_URL; s.onload = res; s.onerror = () => rej(new Error('lib')); document.head.appendChild(s); });
  const help = t => { $('edhelp').textContent = t || HELP[tool]; };
  const err = html => { const e = $('ederr'); e.hidden = !html; e.innerHTML = html || ''; };
  const busyOn = t => { $('edbusyt').textContent = t; $('edbusy').hidden = false; };
  const busyOff = () => { $('edbusy').hidden = true; };
  const snap = () => JSON.stringify(order);
  const push = () => { history.push(snap()); if (history.length > 60) history.shift(); };
  const upd = () => { $('edundo').disabled = !history.length; $('eddel').disabled = !sel; };
  const measure = (() => { const c = document.createElement('canvas').getContext('2d'); return (t, s) => { c.font = s + 'px Helvetica, Arial, sans-serif'; return c.measureText(t).width; }; })();
  const page = src => order.find(p => p.src === src);

  /* ---------- opening a PDF ---------- */
  async function openFile(file) {
    err('');
    if (!/\.pdf$/i.test(file.name)) return err('Please choose a PDF file.');
    if (file.size > 100 * 1048576) return err('This PDF is larger than 100 MB. <a href="/compress-pdf/">Compress it</a> or <a href="/split-pdf/">extract the pages you need</a> first.');
    busyOn('Opening your PDF…'); $('edrop').hidden = true;
    try {
      pdfjs = pdfjs || await import(VENDOR + 'pdf.min.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc = VENDOR + 'pdf.worker.min.mjs';
      bytes = new Uint8Array(await file.arrayBuffer());
      doc = await pdfjs.getDocument({ data: bytes.slice(), standardFontDataUrl: VENDOR + 'standard_fonts/', isEvalSupported: false }).promise;
      fname = file.name; cards.clear(); pages.clear(); imgs.clear(); order = []; history = []; sel = null; placing = null;
      for (let i = 0; i < doc.numPages; i++) { const p = await doc.getPage(i + 1); pages.set(i, { page: p, vp: p.getViewport({ scale: 1 }) }); order.push({ src: i, annots: [] }); }
      order.forEach(p => cards.set(p.src, makeCard(p.src)));
      $('edwork').hidden = false; $('edok').hidden = true; renderList(); setTool('select'); upd();
    } catch (e) {
      $('edrop').hidden = false;
      err(e && e.name === 'PasswordException'
        ? 'This PDF is password-protected. <a href="/unlock-pdf/">Unlock it first</a>, then open it here.'
        : 'We couldn’t open this PDF. It may be damaged. <a href="/repair-pdf/">Try Repair PDF</a>, or choose another file.');
    }
    busyOff();
  }

  /* ---------- page cards ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) renderCanvas(+e.target.dataset.src); }), { rootMargin: '900px 0px' });
  function makeCard(src) {
    const { vp } = pages.get(src), root = document.createElement('article'); root.className = 'pgc';
    root.innerHTML = `<div class="pgh"><strong class="pgn"></strong><span class="sp"></span>
<button class="ib" type="button" data-pa="up" aria-label="Move this page up"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg></button>
<button class="ib" type="button" data-pa="down" aria-label="Move this page down"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
<button class="ib" type="button" data-pa="del" aria-label="Delete this page"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="${(window.ICONS || {}).trash || ''}"/></svg></button></div>
<div class="pgv" data-src="${src}" style="aspect-ratio:${vp.width} / ${vp.height}"><canvas></canvas><svg class="ov t-${tool}" data-src="${src}" viewBox="0 0 ${num(vp.width)} ${num(vp.height)}"></svg></div>`;
    const pgv = root.querySelector('.pgv'); io.observe(pgv);
    return { root, pgv, canvas: root.querySelector('canvas'), svg: root.querySelector('svg.ov'), rendered: false, w: 0 };
  }
  async function renderCanvas(src) {
    const c = cards.get(src); if (!c || c.rendered || !c.pgv.clientWidth) return;
    c.rendered = true; c.w = c.pgv.clientWidth;
    const { page: p, vp } = pages.get(src), dpr = Math.min(window.devicePixelRatio || 1, 2), v = p.getViewport({ scale: c.w / vp.width * dpr });
    c.canvas.width = Math.round(v.width); c.canvas.height = Math.round(v.height);
    try { await p.render({ canvasContext: c.canvas.getContext('2d'), viewport: v }).promise; } catch (e) { c.rendered = false; }
  }
  function renderList() {
    const box = $('edpages'); box.replaceChildren();
    order.forEach((pm, i) => {
      const c = cards.get(pm.src); c.root.querySelector('.pgn').textContent = 'Page ' + (i + 1) + ' of ' + order.length;
      c.root.querySelector('[data-pa=up]').disabled = i === 0; c.root.querySelector('[data-pa=down]').disabled = i === order.length - 1;
      box.appendChild(c.root); paint(pm.src);
    });
  }

  /* ---------- drawing the annotations ---------- */
  function bbox(a) {
    if (a.t === 'text') return { x: a.x, y: a.y, w: Math.max(6, measure(a.text, a.s)), h: a.s * 1.25 };
    if (a.t === 'draw') { const xs = a.pts.map(p => p[0]), ys = a.pts.map(p => p[1]), h = a.w / 2; return { x: Math.min(...xs) - h, y: Math.min(...ys) - h, w: Math.max(...xs) - Math.min(...xs) + a.w, h: Math.max(...ys) - Math.min(...ys) + a.w }; }
    return { x: a.x, y: a.y, w: a.w, h: a.h };
  }
  function shape(a, i) {
    const d = `data-a="${i}"`;
    if (a.t === 'rect') return `<rect ${d} x="${num(a.x)}" y="${num(a.y)}" width="${num(a.w)}" height="${num(a.h)}" fill="${a.k === 'white' ? '#ffffff' : a.c}" fill-opacity="${a.k === 'white' ? 1 : 0.4}"/>`;
    if (a.t === 'draw') { const p = a.pts.map(q => q[0] + ',' + q[1]).join(' '); return `<polyline points="${p}" fill="none" stroke="${a.c}" stroke-width="${a.w}" stroke-linecap="round" stroke-linejoin="round"/><polyline ${d} points="${p}" fill="none" stroke="rgba(0,0,0,0)" stroke-width="${Math.max(a.w, 16)}" stroke-linecap="round" pointer-events="stroke"/>`; }
    if (a.t === 'text') { const b = bbox(a); return `<text x="${num(a.x)}" y="${num(a.y + a.s * 0.82)}" fill="${a.c}" font-size="${a.s}" font-family="Helvetica,Arial,sans-serif" style="white-space:pre">${esc(a.text)}</text><rect ${d} x="${num(b.x)}" y="${num(b.y)}" width="${num(b.w)}" height="${num(b.h)}" fill="rgba(0,0,0,0)"/>`; }
    if (a.t === 'img') { const m = imgs.get(a.id); return `<image ${d} href="${m ? m.data : ''}" x="${num(a.x)}" y="${num(a.y)}" width="${num(a.w)}" height="${num(a.h)}" preserveAspectRatio="none"/>`; }
    return '';
  }
  function paint(src) {
    const pm = page(src), c = cards.get(src); if (!pm || !c) return;
    let h = pm.annots.map(shape).join('');
    if (sel && sel.src === src && pm.annots[sel.i]) {
      const a = pm.annots[sel.i], b = bbox(a), k = (pages.get(src).vp.width / (c.pgv.clientWidth || 600)), hs = 24 * k;
      h += `<rect x="${num(b.x)}" y="${num(b.y)}" width="${num(b.w)}" height="${num(b.h)}" fill="none" stroke="#1c7ed6" stroke-width="${num(2 * k)}" stroke-dasharray="${num(6 * k)} ${num(4 * k)}" pointer-events="none"/>`;
      if (a.t === 'rect' || a.t === 'img') h += `<rect data-h="1" x="${num(b.x + b.w - hs / 2)}" y="${num(b.y + b.h - hs / 2)}" width="${num(hs)}" height="${num(hs)}" rx="${num(hs / 4)}" fill="#1c7ed6" stroke="#fff" stroke-width="${num(2 * k)}"/>`;
    }
    c.svg.innerHTML = h;
    c.svg.setAttribute('class', 'ov t-' + tool + (sel && sel.src === src ? ' has-sel' : ''));
  }
  const paintAll = () => order.forEach(p => paint(p.src));
  function select(src, i) { const old = sel && sel.src; sel = src == null ? null : { src, i }; if (old != null) paint(old); if (src != null) paint(src); upd(); }

  /* ---------- tools ---------- */
  function setTool(t, silent) {
    closeText(true); tool = t; placing = t === 'img' ? placing : null;
    document.querySelectorAll('.tb[data-tool]').forEach(b => { const on = b.dataset.tool === t; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    if (t === 'hl' && color === BLACK) color = YELLOW; else if (t !== 'hl' && color === YELLOW) color = BLACK;
    syncColors(); help(); paintAll();
    if (t === 'img' && !silent) $('edimg').click();
  }
  function syncColors() { document.querySelectorAll('.sw').forEach(b => b.setAttribute('aria-pressed', b.dataset.c === color)); }
  const toPt = (e, svg) => { const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal; return { x: num((e.clientX - r.left) / r.width * vb.width), y: num((e.clientY - r.top) / r.height * vb.height) }; };

  function down(e) {
    const svg = e.target.closest && e.target.closest('svg.ov'); if (!svg || (e.button && e.button > 0)) return;
    const src = +svg.dataset.src, pm = page(src), pt = toPt(e, svg);
    if (placing) { placeImage(src, pt); e.preventDefault(); return; }
    if (tool === 'text') return;
    if (tool === 'draw') drag = { k: 'draw', src, svg, pts: [[pt.x, pt.y]], el: mk(svg, 'polyline', { fill: 'none', stroke: color, 'stroke-width': SIZES[size].pen, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }) };
    else if (tool === 'hl' || tool === 'white') drag = { k: 'rect', src, svg, x0: pt.x, y0: pt.y, el: mk(svg, 'rect', { fill: tool === 'white' ? '#ffffff' : color, 'fill-opacity': tool === 'white' ? 1 : 0.4, stroke: tool === 'white' ? '#999' : 'none', 'stroke-dasharray': '4 3' }) };
    else if (tool === 'select') {
      const hnd = e.target.closest('[data-h]'), a = e.target.closest('[data-a]');
      if (hnd && sel) drag = { k: 'resize', src, svg, snap: snap(), moved: false };
      else if (a) { const i = +a.dataset.a, was = sel && sel.src === src && sel.i === i; select(src, i); drag = { k: 'move', src, svg, last: pt, snap: snap(), moved: false, was, i }; }
      else { select(null); return; }
    }
    if (drag) { try { svg.setPointerCapture(e.pointerId); } catch (x) { } e.preventDefault(); }
  }
  function mk(svg, tag, attrs) { const el = document.createElementNS('http://www.w3.org/2000/svg', tag); Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v)); svg.appendChild(el); return el; }
  function move(e) {
    if (!drag) return; const pt = toPt(e, drag.svg);
    if (drag.k === 'draw') { drag.pts.push([pt.x, pt.y]); drag.el.setAttribute('points', drag.pts.map(p => p.join(',')).join(' ')); }
    else if (drag.k === 'rect') { drag.el.setAttribute('x', Math.min(drag.x0, pt.x)); drag.el.setAttribute('y', Math.min(drag.y0, pt.y)); drag.el.setAttribute('width', Math.abs(pt.x - drag.x0)); drag.el.setAttribute('height', Math.abs(pt.y - drag.y0)); }
    else if (drag.k === 'move') {
      const a = page(drag.src).annots[sel.i], dx = pt.x - drag.last.x, dy = pt.y - drag.last.y; if (!dx && !dy) return;
      if (!drag.moved) { if (Math.abs(dx) + Math.abs(dy) < 1) return; drag.moved = true; }
      if (a.t === 'draw') a.pts = a.pts.map(p => [num(p[0] + dx), num(p[1] + dy)]); else { a.x = num(a.x + dx); a.y = num(a.y + dy); }
      drag.last = pt; paint(drag.src);
    } else if (drag.k === 'resize') {
      const a = page(drag.src).annots[sel.i]; drag.moved = true;
      a.w = num(Math.max(12, pt.x - a.x)); a.h = a.t === 'img' ? num(a.w * (imgs.get(a.id).h / imgs.get(a.id).w)) : num(Math.max(12, pt.y - a.y)); paint(drag.src);
    }
  }
  function up(e) {
    if (!drag) return; const d = drag; drag = null;
    try { d.svg.releasePointerCapture(e.pointerId); } catch (x) { }
    if (d.k === 'draw') { d.el.remove(); if (d.pts.length > 1) { push(); page(d.src).annots.push({ t: 'draw', pts: d.pts, w: SIZES[size].pen, c: color }); paint(d.src); upd(); } }
    else if (d.k === 'rect') {
      const w = +d.el.getAttribute('width'), h = +d.el.getAttribute('height'), x = +d.el.getAttribute('x'), y = +d.el.getAttribute('y'); d.el.remove();
      if (w > 6 && h > 6) { push(); page(d.src).annots.push({ t: 'rect', k: tool === 'white' ? 'white' : 'hl', x, y, w, h, c: tool === 'white' ? '#ffffff' : color }); paint(d.src); upd(); }
    } else if (d.moved) { history.push(d.snap); upd(); }
    else if (d.k === 'move' && d.was) { const a = page(d.src).annots[d.i]; if (a && a.t === 'text') openText(d.src, { x: a.x, y: a.y }, a); }
  }
  function onClick(e) {
    if (tool !== 'text') return; const svg = e.target.closest && e.target.closest('svg.ov'); if (!svg) return;
    openText(+svg.dataset.src, toPt(e, svg), null);
  }

  /* ---------- text ---------- */
  function openText(src, pt, existing) {
    closeText(true);
    const c = cards.get(src), cs = c.pgv.clientWidth / pages.get(src).vp.width, s = existing ? existing.s : SIZES[size].text;
    const inp = document.createElement('input'); inp.type = 'text'; inp.className = 'tin'; inp.value = existing ? existing.text : ''; inp.setAttribute('aria-label', 'Type your text'); inp.autocomplete = 'off';
    inp.style.cssText = `left:${pt.x * cs}px;top:${pt.y * cs}px;font-size:max(16px,${s * cs}px);color:${existing ? existing.c : color}`;
    c.pgv.appendChild(inp); inp.focus(); inp.select();
    textBox = { inp, src, existing, pt, s };
    inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); closeText(true); } else if (ev.key === 'Escape') closeText(false); });
    inp.addEventListener('blur', () => { if (textBox && textBox.inp === inp) closeText(true); });
  }
  function closeText(commit) {
    const tb = textBox; if (!tb) return true;
    const v = tb.inp.value.trim();
    if (commit && v && !LATIN.test(v)) { help('Only Latin letters, numbers and common symbols can be added. Please change the text.'); tb.inp.focus(); return false; }
    textBox = null; tb.inp.remove();
    if (commit && v) {
      push();
      if (tb.existing) tb.existing.text = v; else { page(tb.src).annots.push({ t: 'text', x: tb.pt.x, y: tb.pt.y, s: tb.s, c: color, text: v }); }
      paint(tb.src); upd(); help();
    } else if (commit && tb.existing && !v) { removeSelected(); }
    return true;
  }

  /* ---------- pictures ---------- */
  async function onImage(file) {
    if (!file) return;
    const data = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(file); });
    const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = data; }).catch(() => null);
    if (!im) return help('That picture could not be read. Please choose a PNG or JPG.');
    const k = Math.min(1, 1200 / Math.max(im.naturalWidth, im.naturalHeight)), w = Math.round(im.naturalWidth * k), h = Math.round(im.naturalHeight * k);
    const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h);
    const png = file.type === 'image/png', id = 'i' + (++nid);
    imgs.set(id, { data: c.toDataURL(png ? 'image/png' : 'image/jpeg', 0.88), png, w, h });
    placing = { id }; help('Tap the page where the picture should go.');
  }
  function placeImage(src, pt) {
    const m = imgs.get(placing.id), vpW = pages.get(src).vp.width, w = Math.min(160, vpW * 0.4), h = w * m.h / m.w;
    push(); const a = { t: 'img', id: placing.id, x: num(Math.min(Math.max(0, pt.x - w / 2), vpW - w)), y: num(Math.max(0, pt.y - h / 2)), w: num(w), h: num(h) };
    page(src).annots.push(a); placing = null; setTool('select', true); select(src, page(src).annots.length - 1);
  }

  /* ---------- changing things ---------- */
  function removeSelected() {
    if (!sel) return; push(); const s = sel; page(s.src).annots.splice(s.i, 1); sel = null; paint(s.src); upd();
  }
  function undo() { if (!history.length) return; closeText(false); order = JSON.parse(history.pop()); sel = null; renderList(); upd(); }
  function pageAction(btn) {
    const root = btn.closest('.pgc'), src = +root.querySelector('.pgv').dataset.src, i = order.findIndex(p => p.src === src), a = btn.dataset.pa;
    if (a === 'del') { if (order.length < 2) return help('A PDF needs at least one page.'); push(); order.splice(i, 1); sel = null; renderList(); help('Page removed. Press Undo to bring it back.'); }
    if (a === 'up' && i > 0) { push(); [order[i - 1], order[i]] = [order[i], order[i - 1]]; renderList(); }
    if (a === 'down' && i < order.length - 1) { push(); [order[i + 1], order[i]] = [order[i], order[i + 1]]; renderList(); }
    upd();
  }

  /* ---------- saving ---------- */
  const rgbOf = (L, hex) => { const n = parseInt(hex.slice(1), 16); return L.rgb((n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255); };
  async function build() {
    const L = PDFLib, src = await L.PDFDocument.load(bytes), out = await L.PDFDocument.create(), font = await out.embedFont(L.StandardFonts.Helvetica), emb = new Map();
    let skipped = 0;
    for (const pm of order) {
      const [pg] = await out.copyPages(src, [pm.src]); out.addPage(pg);
      const vp = pages.get(pm.src).vp, rot = ((Math.round(vp.rotation) % 360) + 360) % 360, P = (x, y) => vp.convertToPdfPoint(x, y);
      for (const a of pm.annots) {
        if (a.t === 'rect') { const [x1, y1] = P(a.x, a.y), [x2, y2] = P(a.x + a.w, a.y + a.h); pg.drawRectangle({ x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1), color: a.k === 'white' ? L.rgb(1, 1, 1) : rgbOf(L, a.c), opacity: a.k === 'white' ? 1 : 0.4 }); }
        else if (a.t === 'draw') { for (let i = 1; i < a.pts.length; i++) { const [x1, y1] = P(a.pts[i - 1][0], a.pts[i - 1][1]), [x2, y2] = P(a.pts[i][0], a.pts[i][1]); pg.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: a.w, color: rgbOf(L, a.c), lineCap: L.LineCapStyle.Round }); } }
        else if (a.t === 'text') { const [x, y] = P(a.x, a.y + a.s * 0.82); try { pg.drawText(a.text, { x, y, size: a.s, font, color: rgbOf(L, a.c), rotate: L.degrees(rot) }); } catch (e) { skipped++; } }
        else if (a.t === 'img') {
          const m = imgs.get(a.id); if (!m) continue;
          if (!emb.has(a.id)) { const raw = Uint8Array.from(atob(m.data.split(',')[1]), c => c.charCodeAt(0)); emb.set(a.id, m.png ? await out.embedPng(raw) : await out.embedJpg(raw)); }
          const [x, y] = P(a.x, a.y + a.h); pg.drawImage(emb.get(a.id), { x, y, width: a.w, height: a.h, rotate: L.degrees(rot) });
        }
      }
    }
    return { out, skipped };
  }
  async function download() {
    if (busy) return; closeText(true); busy = true; $('eddl').disabled = true; help('Preparing your PDF…'); $('edok').hidden = true;
    try {
      await loadLib(); const { out, skipped } = await build();
      const blob = new Blob([await out.save()], { type: 'application/pdf' }), n = fname.replace(/\.pdf$/i, '') + '-edited.pdf';
      if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(blob);
      const a = $('eddl2'); a.href = url; a.download = n; $('edokfn').textContent = n + ' · ' + fmt(blob.size);
      $('edoknote').textContent = skipped ? skipped + ' text item(s) could not be added because of unsupported characters.' : 'Edited in your browser. Nothing was uploaded.';
      $('edok').hidden = false; const tmp = document.createElement('a'); tmp.href = url; tmp.download = n; document.body.appendChild(tmp); tmp.click(); tmp.remove();
      help('Done. Your download should start now.'); a.focus();
    } catch (e) { help('Something went wrong while saving. Please try again.'); }
    busy = false; $('eddl').disabled = false;
  }

  /* ---------- wiring ---------- */
  const box = $('edrop'), inp = $('edin');
  box.addEventListener('click', e => { if (!e.target.closest('button')) inp.click(); });
  $('edpick').addEventListener('click', e => { e.stopPropagation(); inp.click(); });
  box.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === box) { e.preventDefault(); inp.click(); } });
  inp.addEventListener('change', () => { if (inp.files[0]) openFile(inp.files[0]); inp.value = ''; });
  ['dragenter', 'dragover'].forEach(v => box.addEventListener(v, e => { e.preventDefault(); box.classList.add('on'); }));
  ['dragleave', 'drop'].forEach(v => box.addEventListener(v, e => { e.preventDefault(); box.classList.remove('on'); }));
  box.addEventListener('drop', e => { const f = e.dataTransfer && e.dataTransfer.files[0]; if (f) openFile(f); });
  if (window.matchMedia && matchMedia('(pointer:coarse)').matches) $('edt').textContent = 'Upload your PDF';
  document.querySelectorAll('.tb[data-tool]').forEach(b => b.addEventListener('click', () => setTool(b.dataset.tool)));
  document.querySelectorAll('.sw').forEach(b => b.addEventListener('click', () => {
    color = b.dataset.c; syncColors();
    if (sel) { const a = page(sel.src).annots[sel.i]; if (a && a.t !== 'img' && !(a.t === 'rect' && a.k === 'white')) { push(); a.c = color; paint(sel.src); upd(); } }
  }));
  $('edsz').addEventListener('change', e => { size = e.target.value; });
  $('edimg').addEventListener('change', e => { onImage(e.target.files[0]); e.target.value = ''; });
  $('edundo').addEventListener('click', undo);
  $('eddel').addEventListener('click', removeSelected);
  $('eddl').addEventListener('click', download);
  $('ednew').addEventListener('click', () => { closeText(false); $('edwork').hidden = true; $('edrop').hidden = false; $('edpages').replaceChildren(); order = []; cards.clear(); err(''); });
  const pgs = $('edpages');
  pgs.addEventListener('pointerdown', down); pgs.addEventListener('pointermove', move); pgs.addEventListener('pointerup', up); pgs.addEventListener('pointercancel', up);
  pgs.addEventListener('click', e => { const b = e.target.closest('[data-pa]'); if (b) pageAction(b); else onClick(e); });
  document.addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input,select,textarea')) return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && sel) { e.preventDefault(); removeSelected(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
    if (e.key === 'Escape') { placing = null; select(null); setTool('select', true); }
  });
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { cards.forEach((c, src) => { if (c.rendered && c.pgv.clientWidth && Math.abs(c.pgv.clientWidth - c.w) / c.w > 0.15) { c.rendered = false; renderCanvas(src); } }); paintAll(); }, 250); });
  window.addEventListener('beforeunload', e => { if (!$('edwork').hidden && history.length) { e.preventDefault(); e.returnValue = ''; } });
  if (location.hash === '#file' && window.EasyHandoff) window.EasyHandoff.take().then(f => { if (f) openFile(f); }).catch(() => { });
  window.EasyEditor = { openFile };
})();
