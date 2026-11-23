/* Swaps the text "EasyPDF" brand link for the logo on any page. Safe to load more than once. */
(function(){
  var css=document.createElement('style');
  css.textContent='a[data-epdf-logo]{display:inline-flex!important;align-items:center;line-height:0!important;font-size:0!important;overflow:hidden;max-height:44px;margin:0!important;padding:0!important}'+
  'a[data-epdf-logo]::before,a[data-epdf-logo]::after{content:none!important;display:none!important}'+
  'a[data-epdf-logo]>*:not(img){display:none!important}'+
  'a[data-epdf-logo] img{display:block;height:40px;width:auto;max-width:58vw;object-fit:contain;margin:0!important}'+
  '@media(prefers-color-scheme:dark){a[data-epdf-logo] img{background:#fff;border-radius:8px;padding:2px 8px}}';
  document.head.appendChild(css);
  function icons(){
    if(document.querySelector('link[rel~="icon"]'))return;
    var l=document.createElement('link');l.rel='icon';l.href='/favicon.ico';l.sizes='any';document.head.appendChild(l);
    var a=document.createElement('link');a.rel='apple-touch-icon';a.href='/icons/apple-touch-icon.png';document.head.appendChild(a);
  }
  function clean(a){
    // hide leftover brand text next to the link (e.g. a separate "PDF" element)
    var p=a.parentElement;if(!p)return;
    [].slice.call(p.childNodes).forEach(function(n){
      if(n===a)return;
      var t=(n.textContent||'').replace(/\s+/g,'').toLowerCase();
      if(n.nodeType===3&&(t==='pdf'||t==='easy'||t==='easypdf'))n.textContent='';
      else if(n.nodeType===1&&(t==='pdf'||t==='easy'||t==='easypdf'))n.style.display='none';
    });
  }
  function swap(){
    var links=document.querySelectorAll('a');
    for(var i=0;i<links.length;i++){
      var a=links[i];
      if(a.hasAttribute('data-epdf-logo')||a.closest('footer'))continue;
      var t=a.textContent.replace(/\s+/g,'').toLowerCase();
      if(a.querySelector('img')&&t==='')continue;
      if(t!=='easypdf')continue;
      var img=new Image();
      img.src='/assets/logo.png';img.alt='EasyPDF – pdftoolkit';img.decoding='async';
      a.setAttribute('aria-label','EasyPDF home');a.setAttribute('data-epdf-logo','');
      a.textContent='';a.appendChild(img);clean(a);
      return true;
    }
    return false;
  }
  icons();
  function run(){
    if(swap())return;
    var mo=new MutationObserver(function(){if(swap())mo.disconnect()});
    mo.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(function(){mo.disconnect()},5000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();
