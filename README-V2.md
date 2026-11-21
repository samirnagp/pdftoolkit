# EasyPDF V2 frontend

This is the upgraded static frontend for EasyPDF.co.in. Start with:
- `DEPLOYMENT.md` — GitHub/Render deployment and configuration
- `UPGRADE-REPORT.md` — changes and verification performed
- `UPGRADE-NOTES.md` — supplied API contract notes and limitations

Run local checks from this directory:
```bash
python3 build_pages.py
python3 tests/smoke_test.py
node --check assets/easypdf.js
node --check assets/site-enhancements.js
```

Do not deploy private API secrets in frontend JavaScript. The backend must enforce CORS, file validation, upload limits, rate limits and temporary-file deletion.
