PDFKit PWA files
================
1. Upload everything in this folder (manifest.webmanifest, sw.js, pwa.js, offline.html,
   and the icons/ and screenshots/ folders) next to your index.html.
   Delete the old icon-192.png, icon-512.png and icon-512-maskable.png in the root.

2. In index.html, inside <head>, add:

   <link rel="manifest" href="manifest.webmanifest">
   <meta name="theme-color" content="#d9480f">
   <meta name="description" content="Merge, split, rotate, compress and convert PDFs. Free and private.">
   <link rel="icon" type="image/png" href="icons/icon-96.png">
   <link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
   <meta name="mobile-web-app-capable" content="yes">
   <meta name="apple-mobile-web-app-capable" content="yes">
   <meta name="apple-mobile-web-app-title" content="PDFKit">

3. Just before </body>, add this and remove any older serviceWorker.register snippet:

   <script src="pwa.js" defer></script>

4. Commit, wait for the site to redeploy, hard refresh, then re-test at pwabuilder.com.
