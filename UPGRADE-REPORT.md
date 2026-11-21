# EasyPDF V2 — source review and change report

## Source reviewed

The upgrade was based on the uploaded `pdftoolkit-main` ZIP. The project is a static HTML/CSS/JavaScript PWA with:
- A homepage and separate tool landing pages
- Shared files in `assets/` (`easypdf.css`, `easypdf.js`, `tools.js`, `config.js`, editor and icon scripts)
- Browser-side PDF/image processing and server-side conversion requests
- A service worker, manifest, offline page, icons and Search Console verification file
- `build_pages.py` and an existing sitemap

## Changes in this package

- Updated the API base URL in `assets/config.js` to `https://api.easypdf.co.in`.
- Added a user-controlled Light/Dark theme toggle with local preference persistence.
- Added in-page preview for PDF conversion results while retaining the existing download action.
- Added optional GA4 and AdSense script loading. IDs are blank by default; no credentials are fabricated.
- Guarded endpoints not documented by the supplied API contract: Unlock PDF and Repair PDF. PDF to Excel is enabled after live API documentation and HTTP 200 verification.
- Bumped the service worker cache to `easypdf-v5` and included the new enhancement script.
- Reworked `build_pages.py` so it refreshes the sitemap without overwriting the existing tool pages.
- Added Render static-site configuration, smoke tests and deployment instructions.
- Preserved the existing Search Console verification HTML file and the existing tool directory routes.

## Verification performed

- `python3 build_pages.py` completed and generated a 19-URL sitemap.
- `python3 tests/smoke_test.py` passed.
- `node --check` passed for the shared JavaScript, config, PWA and service-worker scripts.
- All 19 HTML pages that load the shared tool engine also load the enhancement script.

## Not claimed as complete

- Live conversion tests were not run against the production backend from this ZIP review.
- Admin dashboard is not implemented because the supplied API contract does not describe secure admin/authentication endpoints.
- Unlock PDF and Repair PDF remain paused pending documented backend endpoints. PDF to Excel is enabled after successful live verification.
- AdSense is not active until approval, a publisher ID and real ad-slot IDs are configured.
- GA4 is not active until a valid Measurement ID is configured.
