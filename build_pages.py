#!/usr/bin/env python3
"""Safe static-site build helper. Never overwrites hand-authored tool pages."""
from datetime import date
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent
SITE = "https://easypdf.co.in"
EXCLUDED = {"assets", "icons", "screenshots", "images", "tools", "tests"}

def main():
    pages = ["/", "/privacy.html"]
    for child in sorted(ROOT.iterdir()):
        if child.is_dir() and child.name not in EXCLUDED and (child / "index.html").is_file():
            pages.append(f"/{child.name}/")
    urls = ET.Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")
    for path in pages:
        item = ET.SubElement(urls, "url")
        ET.SubElement(item, "loc").text = SITE + path
        ET.SubElement(item, "lastmod").text = date.today().isoformat()
        ET.SubElement(item, "priority").text = "1.0" if path == "/" else ("0.3" if path == "/privacy.html" else "0.8")
    ET.indent(urls, space="  ")
    (ROOT / "sitemap.xml").write_bytes(b'<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(urls, encoding="utf-8") + b"\n")
    print(f"Validated static pages and wrote sitemap.xml ({len(pages)} URLs).")
    print("Existing tool pages were not overwritten.")

if __name__ == "__main__":
    main()
