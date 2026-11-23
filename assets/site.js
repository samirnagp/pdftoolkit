(function(){
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
// Mega menu
var dd=$('.dd'),btn=$('.dd-btn');
if(btn){btn.addEventListener('click',function(e){e.stopPropagation();var o=dd.classList.toggle('open');btn.setAttribute('aria-expanded',o)});
document.addEventListener('click',function(e){if(!dd.contains(e.target)){dd.classList.remove('open');btn.setAttribute('aria-expanded','false')}});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){dd.classList.remove('open');btn.setAttribute('aria-expanded','false')}})}
// Mobile drawer
var mb=$('.menu-btn'),h=$('.hdr');
if(mb)mb.addEventListener('click',function(){var o=h.classList.toggle('open');mb.setAttribute('aria-expanded',o);mb.textContent=o?'✕':'☰'});
// Tool search + category filter (home page)
var q=$('#q'),cards=$$('.card'),cat='All';
function apply(){var t=(q&&q.value||'').trim().toLowerCase(),n=0;
cards.forEach(function(c){var ok=(cat==='All'||c.dataset.cat===cat)&&(!t||c.dataset.name.indexOf(t)>-1);c.hidden=!ok;if(ok)n++});
var none=$('#none');if(none)none.hidden=n>0}
if(q){q.addEventListener('input',apply);
q.addEventListener('keydown',function(e){if(e.key==='Enter'){var f=cards.filter(function(c){return !c.hidden})[0];if(f)location.href=f.href}})}
$$('.chip').forEach(function(b){b.addEventListener('click',function(){cat=b.dataset.cat;$$('.chip').forEach(function(x){x.classList.toggle('on',x===b)});apply()})});
// Cookie consent (analytics + ads load only after "Accept")
var KEY='easypdf_consent';
function load(){if(window.__adsLoaded)return;window.__adsLoaded=true;
/* ADD AFTER CONSENT: paste your Google Analytics (gtag.js) and AdSense script loaders here. */}
function banner(){if($('#cc'))return;var d=document.createElement('div');d.id='cc';d.setAttribute('role','dialog');d.setAttribute('aria-label','Cookie consent');
d.innerHTML='<p>We use cookies for analytics and to show ads. You can accept or reject non-essential cookies. See our <a href="/privacy.html">Privacy Policy</a>.</p><button class="btn" id="cc-y">Accept</button> <button class="btn alt" id="cc-n">Reject</button>';
document.body.appendChild(d);
$('#cc-y').onclick=function(){try{localStorage.setItem(KEY,'yes')}catch(e){}d.remove();load()};
$('#cc-n').onclick=function(){try{localStorage.setItem(KEY,'no')}catch(e){}d.remove()}}
var s=null;try{s=localStorage.getItem(KEY)}catch(e){}
if(s==='yes')load();else if(s!=='no')banner();
var cs=$('#cookie-settings');if(cs)cs.addEventListener('click',function(e){e.preventDefault();try{localStorage.removeItem(KEY)}catch(x){}banner()});
})();
