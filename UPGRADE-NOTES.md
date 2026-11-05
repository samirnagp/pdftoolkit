# EasyPDF frontend upgrade notes

## What changed
- Frontend API base URL now points to `https://api.easypdf.co.in`.
- Removed the unsupported `mode` form field from PDF-to-Word requests; the published API accepts only `file`.
- Added an in-page PDF preview after a PDF result is generated. Non-PDF results retain the download action without showing a PDF frame.
- Added optional Google Analytics 4 and AdSense script loading. Both integrations remain disabled until IDs are entered.
- Preserved local browser tools: Images to PDF, Merge PDF, Extract Pages, and Rotate PDF.
- Unlock PDF is deliberately blocked with an explanatory message because the supplied OpenAPI document does not list `POST /api/unlock`.

## Confirmed backend contract from the supplied OpenAPI document
- `GET /health`
- `POST /api/word-to-pdf` (`file`)
- `POST /api/excel-to-pdf` (`file`)
- `POST /api/powerpoint-to-pdf` (`file`)
- `POST /api/pdf-to-word` (`file`)
- `POST /api/pdf-to-jpg` (`file`, optional `dpi`)
- `POST /api/compress` (`file`, optional `level`)
- `POST /api/protect` (`file`, `password`)
- `POST /api/ocr` (`file`, optional `lang`)

The OpenAPI response schemas are empty, so the frontend assumes successful conversions return downloadable response bytes. Verify each endpoint returns the expected file MIME type and `Content-Disposition` header.

## Important deployment checks
1. Deploy the complete folder contents to the same static hosting target as the current site. Keep the directory structure and trailing-slash tool routes.
2. Configure backend CORS to allow the production origin `https://easypdf.co.in` (and `https://www.easypdf.co.in` only if that hostname is used). Browser calls to the API require CORS even when `/health` opens directly in a browser.
3. Test each server tool with a small sample file. Check response bytes, filenames, errors, and file deletion behavior.
4. `MAX_MB` must match the backend upload limit. It is currently 25 MB in the frontend.
5. Enter `GA_MEASUREMENT_ID` only after creating/confirming the GA4 web data stream. Enter `ADSENSE_CLIENT_ID` only after AdSense approval. Add ad units separately in page placements after approval; loading the library alone does not create ad placements.
6. Search Console ownership verification is already represented by the existing `google87958db414d318c8.html`; keep it deployed. Submit `/sitemap.xml` in Search Console.

## Features that still need backend work
- Unlock PDF: add `POST /api/unlock` accepting `file` and `password`.
- PDF merge/split/rotate/images-to-PDF are already browser-side.
- Admin dashboard: do not deploy a static password-only admin page. A real admin dashboard needs authenticated server-side endpoints, role checks, secure sessions, and persistent storage. None are present in the supplied OpenAPI schema.
- Search Console integration is managed in Google Search Console, not by a frontend API key.

## Security notes
- Never put a private API secret in `assets/config.js`; every visitor can read frontend JavaScript.
- Enforce file type and size checks, rate limiting, safe temporary-file handling, and automatic deletion on the backend.
- Do not log uploaded document contents or passwords.
