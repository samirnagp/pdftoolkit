
const $=id=>document.getElementById(id);
const T=[
{id:'img',i:'🖼️',n:'Images to PDF',d:'Combine JPG and PNG images into one PDF.',m:1,acc:'image/jpeg,image/png'},
{id:'merge',i:'🧩',n:'Merge PDF',d:'Join several PDFs into a single file.',m:1,acc:'application/pdf'},
{id:'split',i:'✂️',n:'Extract pages',d:'Pull out pages or ranges, e.g. 1-3,5.',acc:'application/pdf',o:'<input type="text" id="rng" placeholder="Pages e.g. 1-3,5">'},
{id:'rot',i:'🔄',n:'Rotate PDF',d:'Rotate all pages 90°, 180° or 270°.',acc:'application/pdf',o:'<select id="ang"><option>90</option><option>180</option><option>270</option></select>'},
{id:'p2w',srv:'pdf-to-word',i:'📝',n:'PDF to Word',d:'Editable DOCX output.',acc:'application/pdf',o:'<select id="wm"><option value="auto">Auto (recommended)</option><option value="fast">Fast (plain text PDFs)</option><option value="images">Page pictures (for scanned PDFs, not editable)</option><option value="accurate">Best layout (slower, keeps design)</option></select>',x:()=>({mode:$('wm').value})},
{id:'w2p',srv:'word-to-pdf',i:'📄',n:'Word to PDF',d:'DOC/DOCX to PDF.',acc:'.doc,.docx,.odt,.rtf'},
{id:'p2j',srv:'pdf-to-jpg',i:'📷',n:'PDF to JPG',d:'Each page as an image (ZIP).',acc:'application/pdf',o:'<select id="dpi"><option value="100">100 dpi</option><option value="150" selected>150 dpi</option><option value="200">200 dpi</option><option value="300">300 dpi</option></select>',x:()=>({dpi:$('dpi').value})},
{id:'x2p',srv:'excel-to-pdf',i:'📊',n:'Excel to PDF',d:'Spreadsheets to PDF.',acc:'.xls,.xlsx,.ods,.csv'},
{id:'s2p',srv:'powerpoint-to-pdf',i:'📽️',n:'PowerPoint to PDF',d:'Slides to PDF.',acc:'.ppt,.pptx,.odp'},
{id:'cmp',srv:'compress',i:'🗜️',n:'Compress PDF',d:'Reduce file size.',acc:'application/pdf',o:'<select id="lvl"><option value="screen">Smallest file</option><option value="ebook" selected>Balanced</option><option value="printer">Best quality</option></select>',x:()=>({level:$('lvl').value})},
{id:'prt',srv:'protect',i:'🔐',n:'Protect PDF',d:'Add a password (AES-256).',acc:'application/pdf',o:'<input type="password" id="pw" placeholder="Password (4-64 characters)" autocomplete="new-password">',x:()=>({password:$('pw').value})},
{id:'unl',srv:'unlock',i:'🔓',n:'Unlock PDF',d:'Remove the password from a PDF you own.',acc:'application/pdf',o:'<input type="password" id="upw" placeholder="Current password (empty if none)" autocomplete="off">',x:()=>({password:$('upw').value})},
{id:'ocr',srv:'ocr',i:'🔍',n:'OCR PDF',d:'Make scanned PDFs searchable.',acc:'application/pdf',o:'<select id="lng"><option value="eng">English</option><option value="hin">Hindi</option><option value="eng+hin">English + Hindi</option></select>',x:()=>({lang:$('lng').value})}];
let cur=null,files=[];
if($('grid'))$('grid').innerHTML=T.map((t,k)=>`<button class="tool live" data-k="${k}"><div class="ic">${t.i}</div><h3>${t.n}</h3><p>${t.d}</p><span class="tag">${t.srv?'Secure server':'Runs in browser'}</span></button>`).join('');
if($('grid'))$('grid').onclick=e=>{const b=e.target.closest('.tool');if(!b)return;const t=T[b.dataset.k];open(t)};
function open(t,quiet){cur=t;if(!window.EASYPDF_TOOL)document.title=t.n+' – EasyPDF';files=[];$('work').hidden=false;$('wt').textContent=t.n;$('wd').textContent=t.d;$('opts').innerHTML=t.o||'';$('inp').accept=t.acc;$('inp').multiple=!!t.m;$('files').innerHTML='';$('go').disabled=true;$('dl').hidden=true;$('msg').textContent='';if(!quiet)$('work').scrollIntoView({behavior:'smooth'})}
function setF(l){files=[...l];$('files').innerHTML=files.map(f=>`<li>📎 ${f.name} (${(f.size/1024).toFixed(0)} KB)</li>`).join('');$('go').disabled=!files.length;$('dl').hidden=true}
$('drop').onclick=()=>$('inp').click();
$('inp').onchange=e=>setF(e.target.files);
$('drop').ondragover=e=>{e.preventDefault();$('drop').classList.add('on')};
$('drop').ondragleave=()=>$('drop').classList.remove('on');
$('drop').ondrop=e=>{e.preventDefault();$('drop').classList.remove('on');setF(e.dataTransfer.files)};
const buf=f=>f.arrayBuffer();
function parse(s,n){const o=new Set();s.split(',').forEach(p=>{const m=p.trim().split('-').map(Number);if(!m[0])return;const a=m[0],b=m[1]||a;for(let i=a;i<=Math.min(b,n);i++)o.add(i-1)});return[...o]}
$('go').onclick=async()=>{
if(cur.srv)return runServer();
const {PDFDocument,degrees}=PDFLib;$('go').disabled=true;$('msg').textContent='Working…';
try{let out;
if(cur.id==='img'){out=await PDFDocument.create();for(const f of files){const b=await buf(f);const im=f.type==='image/png'?await out.embedPng(b):await out.embedJpg(b);out.addPage([im.width,im.height]).drawImage(im,{x:0,y:0,width:im.width,height:im.height})}}
else if(cur.id==='merge'){out=await PDFDocument.create();for(const f of files){const d=await PDFDocument.load(await buf(f));(await out.copyPages(d,d.getPageIndices())).forEach(p=>out.addPage(p))}}
else if(cur.id==='split'){const d=await PDFDocument.load(await buf(files[0]));const idx=parse($('rng').value,d.getPageCount());if(!idx.length)throw Error('Enter valid page numbers');out=await PDFDocument.create();(await out.copyPages(d,idx)).forEach(p=>out.addPage(p))}
else{out=await PDFDocument.load(await buf(files[0]));const a=+$('ang').value;out.getPages().forEach(p=>p.setRotation(degrees((p.getRotation().angle+a)%360)))}
const blob=new Blob([await out.save()],{type:'application/pdf'});
$('dl').href=URL.createObjectURL(blob);$('dl').download=cur.id+'-result.pdf';$('dl').hidden=false;$('msg').textContent='Done ✓ ('+(blob.size/1024).toFixed(0)+' KB)';
}catch(e){$('msg').textContent='Error: '+e.message}
$('go').disabled=false};

function runServer(){
if(!API){$('msg').textContent='Backend not configured: set the API constant at the top of the script.';return}
if(cur.id==='prt'&&$('pw').value.length<4){$('msg').textContent='Enter a password of at least 4 characters.';return}
$('go').disabled=true;$('dl').hidden=true;$('msg').textContent='Uploading…';
const fd=new FormData();fd.append('file',files[0]);
let x={};try{x=cur.x?cur.x():{}}catch(e){$('msg').textContent='Something went wrong: '+e.message;$('go').disabled=false;return}
for(const k in x)fd.append(k,x[k]);
const r=new XMLHttpRequest();r.open('POST',API.replace(/\/$/,'')+'/api/'+cur.srv);r.responseType='blob';if(API_KEY)r.setRequestHeader('X-API-Key',API_KEY);
let tm=null,t0=0;const fmt=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
r.upload.onprogress=e=>{if(e.lengthComputable){const p=Math.round(e.loaded/e.total*100);if(p<100)$('msg').textContent='Uploading… '+p+'%'}};
r.upload.onload=()=>{t0=Date.now();const big=files[0].size>10*1048576;const tick=()=>{$('msg').textContent='Converting… '+fmt(Math.round((Date.now()-t0)/1000))+' elapsed'+(big?'. Large files can take several minutes, so please keep this page open.':'')};tick();tm=setInterval(tick,1000)};
r.onloadend=()=>clearInterval(tm);
r.onload=async()=>{
if(r.status===200){const m=/filename="?([^";]+)"?/.exec(r.getResponseHeader('Content-Disposition')||'');
$('dl').href=URL.createObjectURL(r.response);$('dl').download=m?m[1]:'result';$('dl').hidden=false;$('msg').textContent='Done ✓ ('+(r.response.size/1024).toFixed(0)+' KB)'+({'fast-fallback':'. The full-layout converter was too slow or found nothing, so the fast converter was used. Complex designs may look simpler.','images-fallback':'. No editable text could be extracted, so each page was placed in the Word file as a picture. For editable text, run OCR PDF first.'}[r.getResponseHeader('X-Word-Mode')]||'')}
else{let d='Error '+r.status;try{d=JSON.parse(await r.response.text()).detail||d}catch(e){}$('msg').textContent='Error: '+d}
$('go').disabled=false};
r.onerror=()=>{$('msg').textContent='Could not reach the server. Check the API URL and ALLOWED_ORIGINS.';$('go').disabled=false};
$('msg').textContent='Connecting to server…';
const wake=setTimeout(()=>{$('msg').textContent='Waking the server… this can take up to a minute on first use.'},6000);
const ac=new AbortController();setTimeout(()=>ac.abort(),20000);
fetch(API.replace(/\/$/,'')+'/health',{cache:'no-store',signal:ac.signal}).catch(()=>{}).finally(()=>{clearTimeout(wake);$('msg').textContent='Uploading…';r.send(fd)})}
if(window.EASYPDF_TOOL){const t0=T.find(x=>x.id===window.EASYPDF_TOOL);if(t0)open(t0,true)}
