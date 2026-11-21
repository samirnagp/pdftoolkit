/* Swaps the text "EasyPDF" brand link for the logo on any page. Safe to load more than once. */
(function(){
  function icons(){
    if(document.querySelector('link[rel~="icon"]'))return;
    var l=document.createElement('link');l.rel='icon';l.href='/favicon.ico';l.sizes='any';document.head.appendChild(l);
    var a=document.createElement('link');a.rel='apple-touch-icon';a.href='/icons/apple-touch-icon.png';document.head.appendChild(a);
  }
  function swap(){
    var links=document.querySelectorAll('a');
    for(var i=0;i<links.length;i++){
      var a=links[i];
      if(a.querySelector('img')||a.closest('footer'))continue;
      if(a.textContent.replace(/\s+/g,'').toLowerCase()!=='easypdf')continue;
      var img=new Image();
      img.src='/assets/logo.png';img.alt='EasyPDF – pdftoolkit';img.height=50;img.decoding='async';
      img.style.cssText='display:block;height:50px;width:auto;max-width:60vw;object-fit:contain';
      if(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches)img.style.cssText+=';background:#fff;border-radius:8px;padding:2px 8px';
      a.setAttribute('aria-label','EasyPDF home');a.style.lineHeight='0';a.style.display='block';a.textContent='';a.appendChild(img);
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
