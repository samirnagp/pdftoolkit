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
// Cookie consent: analytics and advertising are initialized only after acceptance.
var KEY='easypdf_consent';
function enableIntegrations(){
  if(window.__easyConsentLoader)return;
  window.__easyConsentLoader=true;
  function start(){
    var script=document.createElement('script');
    script.src='/assets/site-enhancements.js?v=8';
    script.onload=function(){window.dispatchEvent(new Event('easypdf-consent-accepted'))};
    document.head.appendChild(script);
  }
  if(typeof API==='undefined' && !window.__easyConfigLoading){
    window.__easyConfigLoading=true;
    var cfg=document.createElement('script');cfg.src='/assets/config.js?v=8';
    cfg.onload=start;document.head.appendChild(cfg);
  }else start();
}
function banner(){
  if($('#cc'))return;
  var d=document.createElement('div');d.id='cc';d.setAttribute('role','dialog');d.setAttribute('aria-label','Cookie consent');
  d.style.cssText='position:fixed;z-index:9999;left:12px;right:12px;bottom:12px;max-width:720px;margin:auto;padding:16px;background:#fff;color:#222;border:1px solid #bbb;border-radius:12px;box-shadow:0 4px 24px #0003;font:14px/1.5 system-ui,sans-serif';
  d.innerHTML='<p>Optional analytics and advertising help support EasyPDF. Choose whether to allow them. Read our <a href="/privacy.html">Privacy Policy</a>.</p><button class="btn" id="cc-y" type="button">Accept</button> <button class="btn alt" id="cc-n" type="button">Reject</button>';
  document.body.appendChild(d);
  $('#cc-y').onclick=function(){try{localStorage.setItem(KEY,'yes')}catch(e){}d.remove();enableIntegrations()};
  $('#cc-n').onclick=function(){try{localStorage.setItem(KEY,'no')}catch(e){}d.remove()};
}
var choice='';try{choice=localStorage.getItem(KEY)||''}catch(e){}
if(choice==='yes')enableIntegrations();else if(!choice)banner();
var cs=$('#cookie-settings');if(cs)cs.addEventListener('click',function(e){e.preventDefault();try{localStorage.removeItem(KEY)}catch(x){}banner()});
})();