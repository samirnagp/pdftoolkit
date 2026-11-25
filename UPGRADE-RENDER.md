# EasyPDF upgrade deployment guide

This upgrade is on the isolated branch `easypdf-upgrade-2026-11`. It does not modify `main`, the backend repository, or the live Render service.

## Changes in this branch

- Render static deployment publishes checked-in pages directly. It no longer invokes the root-level `build_pages.py` path that does not exist; it also avoids running the page generator that can overwrite hand-maintained pages.
- Adds security response headers in `render.yaml`: nosniff, frame denial, strict referrer policy, restricted browser permissions, HSTS, and no-cache for the service worker.
- Bumps the service-worker cache to `easypdf-v8`; PDF.js and its worker are fetched from the deployed origin without service-worker cache fallback, preventing stale/mismatched JS and worker assets.
- Makes analytics and AdSense opt-in: integrations load only after the visitor accepts optional cookies. Tool pages now show the consent choice; legacy pages use the same stored preference key.
- Enables the existing Repair PDF client tool against the verified backend `POST /api/repair` route and adds its missing SEO landing page.
- Updates frontend smoke checks for the new cache and repair page.

## Files changed

- `render.yaml`
- `sw.js`
- `assets/site-enhancements.js`
- `assets/site.js`
- `assets/easypdf.js`
- `repair-pdf/index.html` (new)
- `tests/smoke_test.py`

## Frontend Render deployment

1. In GitHub, review the branch and pull request before merging. Keep the production `main` branch untouched until the checks below pass.
2. In Render, open the existing EasyPDF static-site service. Confirm its repository is `samirnagp/pdftoolkit`, branch is `main`, and publish directory is the repository root. The blueprint now intentionally has no build command.
3. Merge the reviewed pull request to `main` only when ready. Render should then deploy the new commit automatically if auto-deploy is enabled. Otherwise use Manual Deploy and select the latest `main` commit.
4. Do not run `tools/build_pages.py` during deploy. It regenerates pages and shared assets and can overwrite manually maintained content.
5. After deploy, hard-refresh the site on Android Chrome and desktop. Test a private/incognito window too.

## Backend Render environment

The backend repository is `samirnagp/pdfkit-backend`; it is a Docker-based FastAPI service. No backend source code was changed in this branch because the supplied backend test suite passed and the existing API already contains the required conversion routes, upload guards, and repair route.

In the backend Render service, set the following environment variables. Use the actual production domains that serve this frontend:

```dotenv
ALLOWED_ORIGINS=https://easypdf.co.in,https://www.easypdf.co.in,https://easypdf.website,https://www.easypdf.website
MAX_UPLOAD_MB=25
CONVERT_TIMEOUT=300
RATE_LIMIT_PER_MIN=20
HEAVY_RATE_PER_MIN=6
MAX_CONCURRENT_JOBS=2
MAX_HEAVY_JOBS=1
QUEUE_WAIT_SECONDS=120
PUBLIC_DOCS=0
HEALTH_DETAILS=0
```

- Do not copy a local `.env` file to Render. Add values in Render's Environment page.
- Do not set `TRUSTED_PROXY_IPS=*`. Leave the existing safe default until the actual proxy topology and trusted ingress IPs are confirmed.
- If a Cloudflare Worker is deliberately placed in front of the backend, configure its shared `PROXY_SECRET` as a Render secret and configure the Worker to send the matching secret. Do not expose it in frontend JavaScript.
- Keep `API_KEY` empty unless the backend has a documented client-authentication design. A secret embedded in browser JavaScript is public and is not meaningful protection.
- Keep `PUBLIC_DOCS=0` and `HEALTH_DETAILS=0` in production. Verify service health at `/health`; detailed route listings and OpenAPI docs may remain disabled.

## AdSense and Analytics

The code deliberately does not invent or insert publisher credentials.

1. After the site meets Google's content, navigation, privacy and policy requirements, apply for AdSense.
2. After Google provides the publisher ID, set `ADSENSE_CLIENT_ID` in `assets/config.js` to the exact `ca-pub-...` value.
3. Add each approved ad-unit slot ID to an `.ad-slot[data-ad-slot]` element in appropriate content areas. Do not place ads next to upload, convert, download, or other accidental-click controls.
4. Set `GA_MEASUREMENT_ID` to the real GA4 `G-...` ID only if Analytics is enabled.
5. Re-deploy after changing the config. Verify the consent banner, reject path, accept path, and that third-party scripts do not load before consent.
6. Add the AdSense-provided `ads.txt` line only after Google supplies the exact publisher record. Do not invent the line.

The current config contains blank integration IDs, so the code is consent-ready but ads and analytics remain inactive until you supply real IDs. The upgrade does not claim AdSense approval.

## Tests and acceptance checklist

Backend tests already run against the supplied backend ZIP:
- `python -m pytest -q`: 22 passed.
- `python -m py_compile main.py worker.py upload_guard.py tests/*.py`: passed.
- Docker build and real document conversions were not run in this environment.

Frontend validation to run after checkout:
```bash
python3 -m pytest -q
python3 tests/smoke_test.py
```

Manual production checks:
- `https://easypdf.co.in/repair-pdf/` loads, accepts a PDF and returns a repaired download for a deliberately recoverable test PDF.
- Existing tools: Word to PDF, Excel to PDF, PowerPoint to PDF, PDF to Word, PDF to JPG, PDF to Excel, Compress, Protect, Unlock, OCR, Merge, Split, Rotate, Scan, Images to PDF and Edit.
- On a mobile device, choose files, take a photo where supported, convert, preview/download, rotate screen, background/resume, and repeat.
- PDF editor loads `/assets/vendor/pdfjs/pdf.min.js` and its matching `pdf.worker.min.js`; verify both return HTTP 200 with correct JavaScript content types.
- Service worker updates to `easypdf-v8`; old caches are removed and PDF.js requests are not served from a stale cache.
- Confirm every sitemap URL returns HTTP 200, including `/repair-pdf/`; check canonical URLs and robots directives.
- Confirm response headers on the static site, and CORS preflight from each production origin against the API.
- Confirm API health and all 11 expected `/api/*` routes from the backend's `/health` details only in a safe staging environment if detailed health is enabled there.

## Important limitations / next phase

- No Admin dashboard was added. The backend has no documented admin authentication, role model, or management API; a frontend-only password gate would be insecure.
- No new image-to-PDF, PDF preview, page extraction, or new OCR engines were invented; existing browser and backend tools are preserved.
- AdSense requires a valid publisher ID, ad-unit slot IDs, approval and an accurate privacy/consent setup.
- Before production release, perform real conversions and verify mobile performance with Lighthouse or PageSpeed. This branch has not been deployed to Render and no production changes have been made.
