/* EasyPDF engine: tools, upload area, search, progress, success and error recovery.
   Needs (loaded before): assets/icons.js, assets/tools.js, assets/config.js */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const base = (typeof API !== 'undefined' ? API : '').replace(/\/$/, '');
  const KEY = typeof API_KEY !== 'undefined' ? API_KEY : '';
  const MAXMB = typeof MAX_MB !== 'undefined' ? MAX_MB : 25;
  const PAGE_TOOL = window.EASYPDF_TOOL || '';
  const svg = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="${(window.ICONS || {})[n] || ''}"/></svg>`;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => n < 1048576 ? Math.max(1, Math.round(n / 1024)) + ' KB' : (n / 1048576).toFixed(1) + ' MB';
  const ext = n => ((String(n).match(/\.([^.]+)$/) || [])[1] || '').toLowerCase();
  const stem = n => String(n).replace(/\.[^.]+$/, '');
  const mmss = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  const PDF = ['pdf'];
  const COARSE = !!(window.matchMedia && matchMedia('(pointer:coarse)').matches);   // phones and tablets: no drag and drop
  const PDFLIB_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
  let libPromise = null;
  const loadPdfLib = () => window.PDFLib ? Promise.resolve() : (libPromise = libPromise || new Promise((res, rej) => { const s = document.createElement('script'); s.src = PDFLIB_URL; s.onload = res; s.onerror = () => { libPromise = null; rej(new Error('lib')); }; document.head.appendChild(s); }));

  /* ---------- what each tool needs ---------- */
  const S = (id, name, label, choices, def) => ({ id, name, label, type: 'select', choices, def });
  const B = {
    p2w: { srv: 'pdf-to-word', ext: PDF, opts: [S('wm', 'mode', 'Conversion mode', [['auto', 'Auto (recommended)'], ['fast', 'Fast (plain text PDFs)'], ['accurate', 'Best layout (slower, keeps design)'], ['images', 'Page pictures (scanned PDFs, not editable)']], 'auto')] },
    w2p: { srv: 'word-to-pdf', ext: ['doc', 'docx', 'odt', 'rtf'] },
    p2j: { srv: 'pdf-to-jpg', ext: PDF, opts: [S('dpi', 'dpi', 'Image quality', [['100', 'Small files (100 dpi)'], ['150', 'Standard (150 dpi)'], ['200', 'Sharp (200 dpi)'], ['300', 'Print quality (300 dpi)']], '150')] },
    x2p: { srv: 'excel-to-pdf', ext: ['xls', 'xlsx', 'ods', 'csv'] },
    s2p: { srv: 'powerpoint-to-pdf', ext: ['ppt', 'pptx', 'odp'] },
    cmp: { srv: 'compress', ext: PDF, opts: [S('lvl', 'level', 'Compression', [['screen', 'Smallest file'], ['ebook', 'Balanced (recommended)'], ['printer', 'Best quality']], 'ebook')] },
    prt: { srv: 'protect', ext: PDF, opts: [{ id: 'pw', name: 'password', label: 'Choose a password', type: 'password', ph: '4 to 64 characters', hint: 'Write it down. We cannot recover a forgotten password.', req: 1 }] },
    unl: { srv: 'unlock', ext: PDF, opts: [{ id: 'upw', name: 'password', label: 'Current password', type: 'password', ph: 'Leave empty if the file opens without one' }] },
    ocr: { srv: 'ocr', ext: PDF, opts: [S('lng', 'lang', 'Language of the text', [['eng', 'English'], ['hin', 'Hindi'], ['eng+hin', 'English and Hindi']], 'eng')] },
    img: { ext: ['jpg', 'jpeg', 'png'], multi: 1 },
    merge: { ext: PDF, multi: 1, min: 2 },
    split: { ext: PDF, opts: [{ id: 'rng', label: 'Pages to keep', type: 'text', ph: 'For example 1-3, 5, 8-10', req: 1 }] },
    rot: { ext: PDF, opts: [S('ang', null, 'Rotate by', [['90', '90° clockwise'], ['180', '180°'], ['270', '90° counter-clockwise']], '90')] },
    scan: { ext: ['jpg', 'jpeg', 'png', 'webp'], multi: 1, cam: 1, opts: [S('look', null, 'Look', [['doc', 'Document (clean, high contrast)'], ['photo', 'Photo (keep colours)']], 'doc'), S('psz', null, 'Page size', [['a4', 'A4 pages'], ['fit', 'Same size as the photo']], 'a4')] },
    p2x: { srv: 'pdf-to-excel', ext: PDF },
    rep: { srv: 'repair', ext: PDF },
    edit: { ext: PDF, editor: 1 },
  };
  const T = (window.TOOLS_META || []).map(m => ({ ...m, ...B[m.id] }));
  const G = window.GROUPS_META || [];
  const byId = Object.fromEntries(T.map(t => [t.id, t]));
  const typesText = t => t.ext.map(e => e.toUpperCase()).join(', ');

  /* ---------- state ---------- */
  let cur = null, files = [], xhr = null, timer = null, cdTimer = null, runId = 0, url = null, homeFiles = [];

  /* ---------- pure helpers (also used by tests) ---------- */
  function parseRanges(s, n) {
    const out = [], seen = new Set();
    String(s).split(',').forEach(p => {
      const m = p.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/); if (!m) return;
      let a = +m[1], b = m[2] ? +m[2] : a; if (a > b) [a, b] = [b, a];
      for (let i = a; i <= Math.min(b, n); i++) if (i >= 1 && !seen.has(i)) { seen.add(i); out.push(i - 1); }
    });
    return out;
  }
  function suggestFor(list) {
    if (!list.length) return [];
    const exts = list.map(f => ext(f.name));
    return T.filter(t => t.ext && exts.every(e => t.ext.includes(e)) && (t.multi || list.length === 1) && list.length >= (t.min || 1))
      .sort((a, b) => (list.length > 1 ? (b.multi ? 1 : 0) - (a.multi ? 1 : 0) : 0) || G.findIndex(g => g.id === a.g) - G.findIndex(g => g.id === b.g));
  }
  function describeError(status, detail, t, list) {
    const f = list && list[0], pdf = t && t.ext && t.ext.includes('pdf');
    const compress = pdf && t.id !== 'cmp' ? { text: 'Compress the PDF first', href: '/compress-pdf/' } : null;
    const d = detail || '';
    if (status === 0) return { title: 'We couldn’t reach the server', msg: 'Check your internet connection. If you are online, the service may be restarting.', hint: 'Wait a minute, then try again.', mode: 'rerun' };
    if (status === 400) {
      if (/password/i.test(d)) return { title: 'That password didn’t work', msg: d, hint: 'Check capital letters and spaces, then try again.', mode: 'edit' };
      return { title: 'We couldn’t use those settings', msg: d || 'Please check your file and options.', hint: 'Adjust your choices and try again.', mode: 'edit' };
    }
    if (status === 401 || status === 403) return { title: 'This site isn’t set up correctly', msg: 'The converter refused the request.', hint: 'Please contact us so we can fix it.', mode: 'none' };
    if (status === 413) return { title: 'This file is too large', msg: d || ((f ? fmt(f.size) + '. ' : '') + 'The limit is ' + MAXMB + ' MB.'), hint: 'Make it smaller, or split it into parts.', links: [compress, { text: 'Extract pages', href: '/split-pdf/' }].filter(Boolean), mode: 'none' };
    if (status === 415) return { title: 'This file type isn’t supported', msg: d || 'Please choose a ' + (t ? typesText(t) : 'supported') + ' file.', mode: 'none' };
    if (status === 422) {
      const scan = /scanned|OCR/i.test(d);
      return { title: 'We couldn’t convert this file', msg: d || 'The file may be damaged or protected.', hint: scan ? 'Make the text selectable first.' : 'Try another copy of the file.', links: scan ? [{ text: 'Open OCR PDF', href: '/ocr-pdf/' }] : (/password|protected/i.test(d) ? [{ text: 'Open Unlock PDF', href: '/unlock-pdf/' }] : []), mode: 'none' };
    }
    if (status === 429) return { title: 'Too many requests', msg: 'You’ve sent a lot of files in a short time.', hint: 'Please wait a minute, then try again.', mode: 'rerun', wait: 60 };
    if (status === 503) return { title: 'The server is busy', msg: d || 'Other files are being converted right now.', hint: 'It usually clears within a minute.', mode: 'rerun', wait: 20 };
    if (status === 504) return { title: 'The conversion took too long', msg: 'This file needs more time than the server allows.', hint: 'Try a smaller file' + (t && t.id === 'p2w' ? ', or choose Fast mode.' : '.'), links: compress ? [compress] : [], mode: 'rerun' };
    return { title: 'Something went wrong on our side', msg: d || 'Error ' + status + '.', hint: 'Please try again in a moment.', mode: 'rerun' };
  }
  function describeLocalError(e, t) {
    const m = (e && e.message) || '';
    if (/encrypt|password/i.test(m)) return { title: 'This PDF is password-protected', msg: 'It has to be unlocked before this tool can use it.', links: [{ text: 'Open Unlock PDF', href: '/unlock-pdf/' }], mode: 'none' };
    if (e && e.userMessage) return { title: e.userMessage, msg: '', hint: 'Fix it and try again.', mode: 'edit' };
    return { title: 'We couldn’t process this file', msg: 'The file may be damaged or not a valid ' + (t ? typesText(t) : '') + ' file.', hint: 'Try a different file.', mode: 'none' };
  }
  window.EasyPDFTest = { parseRanges, suggestFor, describeError, ext, fmt };

  /* ---------- hand a file from the home page to the PDF editor ---------- */
  const handoffDb = () => new Promise((res, rej) => { const r = indexedDB.open('easypdf-handoff', 1); r.onupgradeneeded = () => r.result.createObjectStore('f'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  window.EasyHandoff = {
    put: async f => { const d = await handoffDb(); return new Promise((res, rej) => { const t = d.transaction('f', 'readwrite'); t.objectStore('f').put(f, 'file'); t.oncomplete = () => res(); t.onerror = () => rej(t.error); }); },
    take: async () => { const d = await handoffDb(); return new Promise((res, rej) => { const t = d.transaction('f', 'readwrite'), s = t.objectStore('f'), g = s.get('file'); g.onsuccess = () => { s.delete('file'); res(g.result || null); }; g.onerror = () => rej(g.error); }); },
  };
  async function goEditor(list) {
    const t = byId.edit;
    try { if (list && list.length) await window.EasyHandoff.put(list[0]); } catch (e) { }
    location.href = '/' + t.slug + '/' + (list && list.length ? '#file' : '');
  }

  /* ---------- scanning: clean up phone photos ---------- */
  async function loadBitmap(f) {
    try { return await createImageBitmap(f, { imageOrientation: 'from-image' }); }
    catch (e) { const u = URL.createObjectURL(f); try { const im = new Image(); im.src = u; await im.decode(); return im; } finally { setTimeout(() => URL.revokeObjectURL(u), 5000); } }
  }
  function enhance(ctx, w, h) {                                  // grey, stretch the contrast and whiten the paper
    const img = ctx.getImageData(0, 0, w, h), d = img.data, hist = new Uint32Array(256);
    for (let i = 0; i < d.length; i += 4) { const g = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000 | 0; d[i] = g; hist[g]++; }
    const n = w * h; let lo = 0, hi = 255, acc = 0;
    for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= n * 0.02) { lo = v; break; } }
    acc = 0; for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc >= n * 0.02) { hi = v; break; } }
    if (hi - lo < 30) { lo = 0; hi = 255; }
    const lut = new Uint8ClampedArray(256);
    for (let v = 0; v < 256; v++) { let x = Math.min(1, Math.max(0, (v - lo) / (hi - lo))); x = x * x * (3 - 2 * x); lut[v] = Math.round(255 * Math.min(1, Math.max(0, (x - 0.08) / 0.84))); }
    for (let i = 0; i < d.length; i += 4) { const v = lut[d[i]]; d[i] = d[i + 1] = d[i + 2] = v; }
    ctx.putImageData(img, 0, 0);
  }
  async function scanToPdf(list, look, psz) {
    const { PDFDocument } = PDFLib, out = await PDFDocument.create();
    for (const f of list) {
      const bmp = await loadBitmap(f), bw = bmp.width, bh = bmp.height, k = Math.min(1, 2000 / Math.max(bw, bh));
      const w = Math.round(bw * k), h = Math.round(bh * k), c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d', { willReadFrequently: true }); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(bmp, 0, 0, w, h);
      if (bmp.close) bmp.close();
      if (look === 'doc') enhance(x, w, h);
      const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.82)), im = await out.embedJpg(await blob.arrayBuffer());
      const [pw, ph] = psz === 'a4' ? (w > h ? [842, 595] : [595, 842]) : [w * 0.75, h * 0.75];
      const s = Math.min(pw / w, ph / h), page = out.addPage([pw, ph]);
      page.drawImage(im, { x: (pw - w * s) / 2, y: (ph - h * s) / 2, width: w * s, height: h * s });
    }
    return out;
  }

  /* ---------- workspace ---------- */
  const work = $('work');
  const show = state => {
    if (!work) return;
    work.dataset.state = state;
    const idle = state === 'idle';
    ['drop', 'files', 'opts', 'main'].forEach(id => { if ($(id)) $(id).hidden = !idle; });
    $('fnote').hidden = !idle; if (!idle) $('ferr').hidden = true;
    $('prog').hidden = state !== 'working';
    $('ok').hidden = state !== 'done';
    $('err').hidden = state !== 'error';
  };
  function setProg(stage, pct, note, indeterminate) {
    $('stage').textContent = stage;
    $('pct').textContent = pct == null || indeterminate ? '' : pct + '%';
    $('pnote').textContent = note || '';
    const bar = $('bar'); bar.classList.toggle('ind', !!indeterminate);
    $('barfill').style.width = indeterminate ? '' : (pct || 0) + '%';
    if (indeterminate) bar.removeAttribute('aria-valuenow'); else bar.setAttribute('aria-valuenow', pct || 0);
    bar.setAttribute('aria-label', stage);
  }
  function buildOptions() {
    const box = $('opts'); box.innerHTML = '';
    (cur.opts || []).forEach(o => {
      const w = document.createElement('div');
      let ctl;
      if (o.type === 'select') ctl = `<select id="${o.id}">${o.choices.map(([v, l]) => `<option value="${v}"${v === o.def ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
      else ctl = `<input id="${o.id}" type="${o.type}" placeholder="${esc(o.ph || '')}" autocomplete="${o.type === 'password' ? 'new-password' : 'off'}">`;
      w.innerHTML = `<label for="${o.id}">${esc(o.label)}</label>${ctl}${o.hint ? `<small>${esc(o.hint)}</small>` : ''}`;
      box.appendChild(w);
    });
  }
  function readOptions() { return (cur.opts || []).map(o => [o.name || o.id, $(o.id).value]); }
  function optionError() {
    for (const o of (cur.opts || [])) {
      const v = $(o.id).value.trim();
      if (o.req && !v) return { id: o.id, msg: 'Please fill in “' + o.label + '”.' };
      if (o.id === 'pw' && (v.length < 4 || v.length > 64)) return { id: o.id, msg: 'The password must have 4 to 64 characters.' };
    }
    return null;
  }
  function openTool(id, list, quiet) {
    const t = byId[id]; if (!t || !work) return;
    cancelRun(true);
    cur = t; files = [];
    if (!t.srv) loadPdfLib().catch(() => { });   // browser tools: fetch the PDF library quietly while the visitor picks files
    if (!PAGE_TOOL) document.title = t.name + ' – EasyPDF';
    $('wic').dataset.g = t.g; $('wic').innerHTML = svg(t.ic);
    $('wt').textContent = t.name; $('wd').textContent = t.short; $('gol').textContent = t.cta || 'Convert';
    $('inp').accept = t.ext.map(e => '.' + e).join(',');
    $('inp').multiple = !!t.multi;
    $('dzt').textContent = COARSE ? (t.multi ? 'Upload your files' : 'Upload your file') : (t.multi ? 'Drop your files here' : 'Drop your file here');
    $('dzh').textContent = typesText(t) + ' · up to ' + MAXMB + ' MB' + (t.srv ? '' : ' · stays on your device');
    $('pick').lastChild.textContent = t.multi ? 'Choose files' : 'Choose file';
    buildOptions(); setFerr('');
    if ($('camrow')) $('camrow').hidden = !(t.cam && COARSE);
    work.hidden = false; show('idle'); renderFiles();
    if (list && list.length) addFiles(list);
    if (!quiet) { work.scrollIntoView({ behavior: 'smooth', block: 'start' }); const h = $('wt'); h.tabIndex = -1; setTimeout(() => h.focus({ preventScroll: true }), 300); }
  }
  function setFerr(html) { const e = $('ferr'); e.hidden = !html; e.innerHTML = html || ''; }
  function addFiles(list) {
    if (!cur) return;
    const add = [], bad = [];
    [...list].forEach(f => (cur.ext.includes(ext(f.name)) ? add : bad).push(f));
    let msg = '';
    if (bad.length) msg = '“' + esc(bad[0].name) + '” isn’t supported here. This tool needs ' + typesText(cur) + '.';
    const take = cur.multi ? add : add.slice(0, 1);
    const big = take.find(f => cur.srv && f.size > MAXMB * 1048576);
    if (big) {
      msg = '“' + esc(big.name) + '” is ' + fmt(big.size) + '. The limit is ' + MAXMB + ' MB.' + (cur.ext.includes('pdf') && cur.id !== 'cmp' ? ' <a href="/compress-pdf/">Compress it first</a>.' : '');
      take.splice(take.indexOf(big), 1);
    }
    files = cur.multi ? files.concat(take) : (take.length ? take : files);
    setFerr(msg); renderFiles();
  }
  function renderFiles() {
    const ul = $('files'); ul.innerHTML = '';
    files.forEach((f, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="ico" data-g="${cur.g}" style="width:36px;height:36px;border-radius:10px">${svg('file')}</span><span class="nm" title="${esc(f.name)}">${esc(f.name)}</span><span class="sz">${fmt(f.size)}</span>` +
        (cur.multi && files.length > 1 ? `<button class="ib" data-a="up" data-i="${i}" aria-label="Move ${esc(f.name)} up"${i === 0 ? ' disabled' : ''}>${svg('up')}</button><button class="ib" data-a="down" data-i="${i}" aria-label="Move ${esc(f.name)} down"${i === files.length - 1 ? ' disabled' : ''}>${svg('down')}</button>` : '') +
        `<button class="ib" data-a="rm" data-i="${i}" aria-label="Remove ${esc(f.name)}">${svg('x')}</button>`;
      ul.appendChild(li);
    });
    const need = cur.min || 1, ready = files.length >= need;
    $('go').disabled = !ready;
    $("drop").classList.toggle('small', files.length > 0);
    $('fnote').textContent = !ready && need > 1 ? 'Add at least ' + need + ' files to continue.' : (cur.multi && files.length > 1 ? 'Files are used in the order shown. Use the arrows to change it.' : '');
    $('pick').lastChild.textContent = files.length ? (cur.multi ? 'Add more' : 'Change file') : (cur.multi ? 'Choose files' : 'Choose file');
  }
  function cancelRun(silent) {
    runId++; clearInterval(timer); clearInterval(cdTimer);
    if (xhr) { try { xhr.abort(); } catch (e) { } xhr = null; }
    if (!silent && work) show('idle');
  }
  function finish(blob, name, note) {
    if (url) URL.revokeObjectURL(url);
    url = URL.createObjectURL(blob);
    const dl = $('dl'); dl.href = url; dl.download = name;
    $('okfn').textContent = name + ' · ' + fmt(blob.size);
    $('oknote').textContent = note || '';
    show('done'); dl.focus();
  }
  function fail(info) {
    clearInterval(timer);
    $('errt').textContent = info.title; $('errm').textContent = info.msg || '';
    const links = (info.links || []).map(l => `<a href="${l.href}">${esc(l.text)}</a>`).join(' · ');
    $('errh').innerHTML = esc(info.hint || '') + (links ? (info.hint ? ' ' : '') + links : '');
    const retry = $('retry'); clearInterval(cdTimer);
    retry.hidden = info.mode === 'none'; retry.dataset.mode = info.mode;
    retry.disabled = false; retry.textContent = info.mode === 'edit' ? 'Change and try again' : 'Try again';
    if (info.wait && info.mode === 'rerun') {
      let s = info.wait; retry.disabled = true;
      const tick = () => { retry.textContent = 'Try again in ' + s + 's'; if (s-- <= 0) { clearInterval(cdTimer); retry.disabled = false; retry.textContent = 'Try again'; } };
      tick(); cdTimer = setInterval(tick, 1000);
    }
    show('error'); $('errt').tabIndex = -1; $('errt').focus();
  }

  /* ---------- running a tool ---------- */
  function run() {
    if (!cur || !files.length) return;
    const oe = optionError();
    if (oe) { setFerr(esc(oe.msg)); $(oe.id).focus(); return; }
    setFerr('');
    return cur.srv ? runServer() : runLocal();
  }
  async function runLocal() {
    const t = cur, my = ++runId;
    show('working'); $('cancel').hidden = true; setProg('Getting ready…', null, '', true);
    try { await loadPdfLib(); } catch (e) { return fail({ title: 'A required library didn’t load', msg: 'The PDF tools could not be loaded.', hint: 'Check your internet connection, then try again.', mode: 'rerun' }); }
    if (my !== runId) return;
    setProg('Processing in your browser…', null, 'Your files stay on this device.', true);
    try {
      await new Promise(r => setTimeout(r, 60));
      const { PDFDocument, degrees } = PDFLib, bytes = f => f.arrayBuffer();
      let out, name;
      if (t.id === 'scan') {
        out = await scanToPdf(files, $('look').value, $('psz').value);
        name = files.length === 1 ? stem(files[0].name) + '-scan.pdf' : 'scan.pdf';
      } else if (t.id === 'img') {
        out = await PDFDocument.create();
        for (const f of files) { const b = await bytes(f); const im = ext(f.name) === 'png' ? await out.embedPng(b) : await out.embedJpg(b); out.addPage([im.width, im.height]).drawImage(im, { x: 0, y: 0, width: im.width, height: im.height }); }
        name = files.length === 1 ? stem(files[0].name) + '.pdf' : 'images.pdf';
      } else if (t.id === 'merge') {
        out = await PDFDocument.create();
        for (const f of files) { const d = await PDFDocument.load(await bytes(f)); (await out.copyPages(d, d.getPageIndices())).forEach(p => out.addPage(p)); }
        name = 'merged.pdf';
      } else if (t.id === 'split') {
        const d = await PDFDocument.load(await bytes(files[0])), idx = parseRanges($('rng').value, d.getPageCount());
        if (!idx.length) { const e = new Error('no pages'); e.userMessage = 'No valid pages found. This PDF has ' + d.getPageCount() + ' pages. Try something like 1-3, 5.'; throw e; }
        out = await PDFDocument.create(); (await out.copyPages(d, idx)).forEach(p => out.addPage(p));
        name = stem(files[0].name) + '-pages.pdf';
      } else {
        out = await PDFDocument.load(await bytes(files[0])); const a = +$('ang').value;
        out.getPages().forEach(p => p.setRotation(degrees((p.getRotation().angle + a) % 360)));
        name = stem(files[0].name) + '-rotated.pdf';
      }
      const blob = new Blob([await out.save()], { type: 'application/pdf' });
      if (my !== runId) return;
      finish(blob, name, 'Processed in your browser. Nothing was uploaded.');
    } catch (e) { if (my === runId) fail(describeLocalError(e, t)); }
  }
  function runServer() {
    const t = cur, f = files[0], my = ++runId;
    if (!base) return fail({ title: 'The converter isn’t connected yet', msg: 'This site has no backend address configured.', hint: 'Please contact us.', mode: 'none' });
    const fd = new FormData(); fd.append('file', f); readOptions().forEach(([k, v]) => fd.append(k, v));
    show('working'); $('cancel').hidden = false; setProg('Connecting to server…', null, '', true);
    const wake = setTimeout(() => { if (my === runId) setProg('Waking up the server…', null, 'This can take up to a minute the first time.', true); }, 6000);
    const ac = new AbortController(), wt = setTimeout(() => ac.abort(), 20000);
    fetch(base + '/health', { cache: 'no-store', signal: ac.signal }).catch(() => { }).finally(() => { clearTimeout(wake); clearTimeout(wt); if (my === runId) send(); });
    function send() {
      const x = new XMLHttpRequest(); xhr = x;
      x.open('POST', base + '/api/' + t.srv); x.responseType = 'blob'; if (KEY) x.setRequestHeader('X-API-Key', KEY);
      setProg('Uploading…', 0, '', false);
      x.upload.onprogress = e => { if (my === runId && e.lengthComputable) setProg('Uploading…', Math.round(e.loaded / e.total * 100), '', false); };
      x.upload.onload = () => {
        if (my !== runId) return;
        const t0 = Date.now(), big = f.size > 10 * 1048576;
        const tick = () => setProg('Converting…', null, (big ? 'Large files can take several minutes. Please keep this page open. ' : '') + mmss(Math.round((Date.now() - t0) / 1000)) + ' elapsed', true);
        tick(); timer = setInterval(tick, 1000);
      };
      x.onload = async () => {
        clearInterval(timer); if (my !== runId) return;
        if (x.status === 200) {
          const m = /filename="?([^";]+)"?/.exec(x.getResponseHeader('Content-Disposition') || '');
          const mode = x.getResponseHeader('X-Word-Mode');
          const xm = x.getResponseHeader('X-Excel-Mode'), rm = x.getResponseHeader('X-Repair-Method');
          const notes = { 'text-excel': 'No ruled tables were found, so each line of text was split into columns. Please check the result.', 'reprinted-repair': 'The file could not be rebuilt directly, so it was re-printed into a new PDF. Some links or form fields may be lost.', 'fast-fallback': 'The full-layout converter was too slow or found nothing, so the fast converter was used. Complex designs may look simpler.', 'images-fallback': 'No editable text could be extracted, so each page was placed in the Word file as a picture. For editable text, run OCR PDF first.' };
          finish(x.response, m ? m[1] : stem(f.name) + '-result', notes[mode] || (xm === 'text' ? notes['text-excel'] : '') || (rm === 'reprinted' ? notes['reprinted-repair'] : '') || 'Your original file has been removed from our server.');
        } else {
          let d = ''; try { d = JSON.parse(await x.response.text()).detail || ''; } catch (e) { }
          fail(describeError(x.status, typeof d === 'string' ? d : '', t, files));
        }
      };
      x.onerror = () => { clearInterval(timer); if (my === runId) fail(describeError(0, '', t, files)); };
      x.send(fd);
    }
  }

  /* ---------- drop zones ---------- */
  function wireDrop(box, input, pick, onFiles) {
    if (!box || !input) return;
    pick && pick.addEventListener('click', e => { e.stopPropagation(); input.click(); });
    box.addEventListener('click', e => { if (!e.target.closest('button')) input.click(); });
    box.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === box) { e.preventDefault(); input.click(); } });
    input.addEventListener('change', () => { if (input.files.length) onFiles(input.files); input.value = ''; });
    ['dragenter', 'dragover'].forEach(v => box.addEventListener(v, e => { e.preventDefault(); box.classList.add('on'); }));
    ['dragleave', 'drop'].forEach(v => box.addEventListener(v, e => { e.preventDefault(); box.classList.remove('on'); }));
    box.addEventListener('drop', e => { if (e.dataTransfer && e.dataTransfer.files.length) onFiles(e.dataTransfer.files); });
  }
  ['dragover', 'drop'].forEach(v => window.addEventListener(v, e => e.preventDefault()));
  wireDrop($('drop'), $('inp'), $('pick'), l => cur && addFiles(l));

  if (work) {
    $('files').addEventListener('click', e => {
      const b = e.target.closest('button[data-a]'); if (!b) return;
      const i = +b.dataset.i, a = b.dataset.a;
      if (a === 'rm') files.splice(i, 1);
      if (a === 'up' && i > 0) [files[i - 1], files[i]] = [files[i], files[i - 1]];
      if (a === 'down' && i < files.length - 1) [files[i + 1], files[i]] = [files[i], files[i + 1]];
      renderFiles();
    });
    $('go').addEventListener('click', run);
    if ($('cam')) { $('cam').addEventListener('click', () => $('camin').click()); $('camin').addEventListener('change', () => { if ($('camin').files.length) addFiles($('camin').files); $('camin').value = ''; }); }
    $('cancel').addEventListener('click', () => { cancelRun(); setFerr('Cancelled. Your file was not kept.'); });
    $('again').addEventListener('click', () => { files = []; renderFiles(); setFerr(''); show('idle'); work.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    $('other').addEventListener('click', () => { files = []; renderFiles(); setFerr(''); show('idle'); $('pick').focus(); });
    $('retry').addEventListener('click', () => { clearInterval(cdTimer); if ($('retry').dataset.mode === 'edit') { show('idle'); const f = (cur.opts || [])[0]; if (f) $(f.id).focus(); } else run(); });
    const close = $('wclose'); if (close) close.addEventListener('click', () => { cancelRun(true); work.hidden = true; $('groups').scrollIntoView({ behavior: 'smooth' }); });
  }

  /* ---------- home page: upload first, then choose a tool ---------- */
  const hdrop = $('hdrop');
  function startFiles(list) {
    homeFiles = [...list]; const box = $('suggest'), err = $('herr');
    const tools = suggestFor(homeFiles);
    err.hidden = true;
    if (!tools.length) {
      err.hidden = false; err.innerHTML = 'We can’t use “' + esc(homeFiles[0].name) + '”. EasyPDF works with PDF, Word, Excel, PowerPoint, JPG and PNG files' + (homeFiles.length > 1 ? ', and the files must be of the same kind' : '') + '.';
      box.hidden = true; homeFiles = []; return;
    }
    const label = homeFiles.length === 1 ? '<b>' + esc(homeFiles[0].name) + '</b>' : '<b>' + homeFiles.length + ' files</b>';
    box.innerHTML = `<h2>What would you like to do with ${label}?</h2><div class="row">${tools.map(t => `<button class="card" type="button" data-id="${t.id}" data-g="${t.g}"><span class="ico">${svg(t.ic)}</span><span><b>${esc(t.name)}</b><small>${esc(t.short)}</small></span></button>`).join('')}</div><div class="actions"><button class="btn ghost" type="button" id="hchange">Choose a different file</button></div>`;
    box.hidden = false; box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  if (hdrop) {
    if (COARSE && $('hdt')) $('hdt').textContent = 'Upload your file';
    wireDrop(hdrop, $('hinp'), $('hpick'), startFiles);
    $('suggest').addEventListener('click', e => {
      const c = e.target.closest('.card[data-id]');
      if (c) { const id = c.dataset.id; if (byId[id].editor) return goEditor(homeFiles); openTool(id, homeFiles); }
      if (e.target.closest('#hchange')) { $('suggest').hidden = true; homeFiles = []; $('hinp').click(); }
    });
  }

  /* ---------- home page: search and grouped tool cards ---------- */
  const q = $('q');
  function applySearch() {
    if (!q) return;
    const tokens = q.value.toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    document.querySelectorAll('#groups .card').forEach(c => {
      const t = byId[c.dataset.id], hay = (t.name + ' ' + t.short + ' ' + (t.kw || '') + ' ' + (G.find(g => g.id === t.g) || {}).name).toLowerCase();
      const words = hay.split(/[^a-z0-9]+/);               // match the start of a word, so "word" does not find "password"
      const ok = tokens.every(w => words.some(x => x.startsWith(w))); c.hidden = !ok; if (ok) shown++;
    });
    document.querySelectorAll('#groups .grp').forEach(g => { g.hidden = !g.querySelector('.card:not([hidden])'); });
    $('noresult').hidden = shown > 0; $('qclear').hidden = !q.value;
  }
  if (q) {
    q.addEventListener('input', applySearch);
    q.addEventListener('keydown', e => { if (e.key === 'Enter') { const c = document.querySelector('#groups .card:not([hidden])'); if (c) { if (byId[c.dataset.id].editor) location.href = '/' + byId[c.dataset.id].slug + '/'; else openTool(c.dataset.id, null); } } });
    $('qclear').addEventListener('click', () => { q.value = ''; applySearch(); q.focus(); });
    document.querySelectorAll('.chip[data-q]').forEach(b => b.addEventListener('click', () => { q.value = b.dataset.q; applySearch(); $('groups').scrollIntoView({ behavior: 'smooth' }); }));
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('#groups a.card[data-id]');
    if (a && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0 && work) {
      const t = byId[a.dataset.id];
      if (t.editor) { if (homeFiles.length === 1 && t.ext.includes(ext(homeFiles[0].name))) { e.preventDefault(); goEditor(homeFiles); } return; }
      e.preventDefault();
      const ok = homeFiles.length && homeFiles.every(f => t.ext.includes(ext(f.name))) && (t.multi || homeFiles.length === 1);
      openTool(a.dataset.id, ok ? homeFiles : null);
    }
  });

  /* ---------- start-up ---------- */
  const fromHash = () => { const id = location.hash.slice(1); if (byId[id] && work) openTool(id, null); };
  window.addEventListener('hashchange', fromHash);
  window.addEventListener('load', () => { if (PAGE_TOOL) openTool(PAGE_TOOL, null, true); else fromHash(); });
  window.EasyPDF = {
    open: (id, list) => openTool(id, list),
    useFiles: list => { if (PAGE_TOOL || (cur && !work.hidden)) { if (!cur) openTool(PAGE_TOOL, null, true); addFiles(list); } else if (hdrop) startFiles(list); },
  };
})();
