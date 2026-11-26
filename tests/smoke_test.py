#!/usr/bin/env python3
"""Dependency-free smoke checks for the EasyPDF static frontend."""
from pathlib import Path
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
errors = []
def check(condition, message):
    if not condition:
        errors.append(message)

home = (ROOT / "index.html").read_text(encoding="utf-8")
config = (ROOT / "assets/config.js").read_text(encoding="utf-8")
engine = (ROOT / "assets/easypdf.js").read_text(encoding="utf-8")
sw = (ROOT / "sw.js").read_text(encoding="utf-8")
check("https://api.easypdf.co.in" in config, "API base URL is not configured.")
check("site.js" in home, "Home page does not load the consent manager.")
check("pdfPreview" in engine, "PDF result preview logic is missing.")
check("cur.unavailable" in engine, "Unavailable backend tools are not guarded.")

site_js = (ROOT / "assets/site.js").read_text(encoding="utf-8")
check("api.easypdf.co.in/health" in site_js, "Homepage does not check backend availability.")
check("hideServerTools" in site_js, "Server-only tools are not hidden when the backend is offline.")
check("Your file was not uploaded." in engine, "Server tools do not fail safely before uploading when the API is down.")
check("fetch(base + '/health'" in engine and "send();" in engine, "Server tools do not perform a health preflight before upload.")

check("easypdf-v8" in sw, "Service worker cache version was not bumped.")
check((ROOT / "google87958db414d318c8.html").exists(), "Search Console verification file is missing.")
check((ROOT / "robots.txt").exists(), "robots.txt is missing.")
check((ROOT / "manifest.webmanifest").exists(), "PWA manifest is missing.")
check((ROOT / "repair-pdf" / "index.html").exists(), "Repair PDF landing page is missing.")
check("srv: 'repair', ext: PDF" in engine, "Repair PDF is not wired to the backend route.")

for page in ROOT.rglob("*.html"):
    if any(part in {"assets", "icons", "screenshots", "vendor"} for part in page.parts):
        continue
    html = page.read_text(encoding="utf-8", errors="replace")
    refs = re.findall(r"(?:src|href)=['\"](/[^'\"?#]+)", html)
    for ref in refs:
        if ref.startswith(("/#", "/privacy", "/contact", "/mailto:")):
            continue
        target = ROOT / ref.lstrip("/")
        if not target.exists() and not ref.endswith("/"):
            errors.append(f"{page.relative_to(ROOT)} references missing {ref}")

try:
    tree = ET.parse(ROOT / "sitemap.xml")
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    for loc in tree.findall(".//s:loc", ns):
        path = (loc.text or "").replace("https://easypdf.co.in", "")
        if path == "/":
            target = ROOT / "index.html"
        elif path.endswith("/"):
            target = ROOT / path.strip("/") / "index.html"
        else:
            target = ROOT / path.lstrip("/")
        check(target.exists(), f"Sitemap target missing: {path}")
except Exception as exc:
    errors.append(f"sitemap.xml is invalid: {exc}")

if errors:
    print("FAIL")
    for error in errors:
        print(" -", error)
    raise SystemExit(1)
print("PASS: EasyPDF static frontend smoke checks.")
