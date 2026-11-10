#!/usr/bin/env python3
"""Builds the EasyPDF home page, one landing page per tool, assets/icons.js, assets/tools.js and sitemap.xml.
Run from the site folder:   python3 tools/build_pages.py
Page wording lives in tools/tools_content.py. Groups, icons and search keywords live in this file."""
import html, json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tools_content import TOOLS  # noqa: E402

SITE = "https://easypdf.co.in"
DATE = "2026-10-31"
CONTACT = "contact@easypdf.co.in"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ADS = False   # set True only when you add real advertising. Ads go in .ad-slot blocks that are far from the upload area.
AD = '<aside class="ad-slot" aria-label="Advertisement"><!-- paste the ad code here --></aside>'
e = html.escape

# ---------- groups, icons, search words ----------
GROUPS = [
    ("convert", "Convert", "Change a file into another format", "swap"),
    ("organize", "Organize", "Merge, split and arrange pages", "layers"),
    ("compress", "Compress", "Make files smaller", "shrink"),
    ("edit", "Edit", "Edit, repair, rotate and read scanned text", "pencil"),
    ("protect", "Protect", "Add or remove a password", "shield"),
]
# id: (group, icon, call-to-action button text, search words)
META = {
    "p2w": ("convert", "doc", "Convert to Word", "word docx doc editable text pdf to word"),
    "w2p": ("convert", "filedown", "Convert to PDF", "word docx doc odt rtf document to pdf"),
    "p2j": ("convert", "image", "Convert to JPG", "jpg jpeg image picture photo png pages pdf to jpg"),
    "x2p": ("convert", "table", "Convert to PDF", "excel xlsx xls csv spreadsheet sheet table"),
    "s2p": ("convert", "slides", "Convert to PDF", "powerpoint ppt pptx slides presentation deck"),
    "img": ("convert", "imgfile", "Create PDF", "images photos jpg jpeg png pictures combine scan to pdf"),
    "merge": ("organize", "layers", "Merge PDFs", "merge combine join append together one file"),
    "split": ("organize", "scissors", "Extract pages", "split extract pages separate cut select remove ranges"),
    "cmp": ("compress", "shrink", "Compress PDF", "compress reduce shrink smaller size email optimize"),
    "rot": ("edit", "rotate", "Rotate PDF", "rotate turn sideways upside down flip orientation"),
    "ocr": ("edit", "scan", "Make searchable", "ocr scan scanned text searchable recognize hindi english"),
    "prt": ("protect", "lock", "Protect PDF", "protect password lock encrypt secure"),
    "unl": ("protect", "unlock", "Unlock PDF", "unlock remove password decrypt open restrictions"),
    "scan": ("convert", "camera", "Create PDF", "scan scanner camera photo document paper pages phone pictures to pdf"),
    "p2x": ("convert", "filetable", "Convert to Excel", "excel xlsx xls spreadsheet table tables data csv pdf to excel"),
    "rep": ("edit", "wrench", "Repair PDF", "repair fix corrupt corrupted damaged broken cannot open recover"),
    "edit": ("edit", "type", "Open editor", "edit editor text sign signature annotate highlight draw whiteout fill form add image delete pages reorder"),
}
ICONS = {
    "doc": "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z M14 3v5h5 M9 13h6 M9 17h6",
    "filedown": "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z M14 3v5h5 M12 11v6 M9.5 14.5L12 17l2.5-2.5",
    "image": "M4 5h16v14H4z M4 16l4.5-4.5 4 4 2.5-2.5 5 5 M9 9.5h.01",
    "table": "M4 5h16v14H4z M4 10h16 M10 5v14",
    "slides": "M3 4h18 M5 4v11h14V4 M12 15v5 M8 20h8",
    "imgfile": "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z M14 3v5h5 M8 17l3-3 2.5 2.5L15 15l2 2",
    "layers": "M12 3l9 5-9 5-9-5z M3 12.5l9 5 9-5 M3 17l9 5 9-5",
    "scissors": "M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M20 4L8.12 15.88 M14.47 14.48L20 20 M8.12 8.12L12 12",
    "shrink": "M4 14h6v6 M20 10h-6V4 M14 10l7-7 M3 21l7-7",
    "rotate": "M21 12a9 9 0 1 1-3-6.7 M21 3v6h-6",
    "scan": "M4 8V5a1 1 0 0 1 1-1h3 M16 4h3a1 1 0 0 1 1 1v3 M20 16v3a1 1 0 0 1-1 1h-3 M8 20H5a1 1 0 0 1-1-1v-3 M8 9h8 M8 12h8 M8 15h5",
    "lock": "M5 11h14v10H5z M7 11V8a5 5 0 0 1 10 0v3 M12 15v2",
    "unlock": "M5 11h14v10H5z M7 11V8a5 5 0 0 1 9.6-2 M12 15v2",
    "swap": "M4 7h14l-3.5-3.5 M20 17H6l3.5 3.5",
    "pencil": "M4 20h4L19 9l-4-4L4 16z M13.5 6.5l4 4",
    "shield": "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
    "upload": "M12 16V4 M7 9l5-5 5 5 M4 20h16",
    "download": "M12 4v12 M7 11l5 5 5-5 M4 20h16",
    "check": "M5 13l4 4L19 7",
    "x": "M6 6l12 12 M18 6L6 18",
    "search": "M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z M21 21l-4.3-4.3",
    "file": "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z M14 3v5h5",
    "up": "M6 15l6-6 6 6",
    "down": "M6 9l6 6 6-6",
    "camera": "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    "filetable": "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z M14 3v5h5 M8 12h8 M8 16h8 M12 10v8",
    "wrench": "M14.7 6.3a4 4 0 0 0-5.4 5.1L3 17.7V21h3.3l6.3-6.3a4 4 0 0 0 5.1-5.4L15 12l-3-3z",
    "type": "M5 6V4h14v2 M12 4v16 M9 20h6",
    "pointer": "M5 3l14 8-6 2-2 6z",
    "highlighter": "M13.5 5.5l5 5L10 19l-5-5z M4 21h8",
    "square": "M4 4h16v16H4z",
    "imgplus": "M14 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9 M4 17l4.5-4.5 4 4 M18 2v6 M15 5h6",
    "undo": "M9 14L4 9l5-5 M4 9h10a6 6 0 0 1 0 12h-3",
    "trash": "M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13 M10 11v6 M14 11v6",
}
for t in TOOLS:
    t["g"], t["ic"], t["cta"], t["kw"] = META[t["id"]]
BY_SLUG = {t["slug"]: t for t in TOOLS}


def svg(name):
    return f'<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="{ICONS[name]}"/></svg>'


# ---------- shared pieces ----------
HEADER = f'''<header class="top"><div class="wrap"><nav>
<a class="logo" href="/">Easy<b>PDF</b></a>
<a class="l keep" href="/#tools">Tools</a><a class="l" href="/#about">About</a><a class="l keep" href="/privacy.html">Privacy</a>
</nav></div></header>'''
FOOTER = f'''<footer><div class="wrap">© 2026 EasyPDF · <a href="/">Home</a> · <a href="/privacy.html">Privacy</a> · <a href="mailto:{CONTACT}">Contact</a><br>Browser tools run on your device; server tools delete files right after conversion.</div></footer>'''
EDITOR_JS = '<script src="/assets/editor.js?v=4"></script>'
SCRIPTS = '''<script src="/assets/icons.js?v=4"></script>
<script src="/assets/tools.js?v=4"></script>
<script src="/assets/config.js?v=4"></script>
<script src="/assets/easypdf.js?v=4"></script>
<script src="/pwa.js" defer></script>'''


def head(title, desc, url, ld):
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#d9480f">
<meta property="og:type" content="website">
<meta property="og:site_name" content="EasyPDF">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/icons/icon-512.png">
<meta name="twitter:card" content="summary">
<meta name="apple-mobile-web-app-title" content="EasyPDF">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" type="image/png" href="/icons/icon-96.png">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<script type="application/ld+json">{ld}</script>
<link rel="stylesheet" href="/assets/easypdf.css?v=4">
</head>
<body>
'''


def workspace(home):
    close = '<button class="btn ghost" id="wclose" type="button">Change tool</button>' if home else ""
    return f'''<section class="ws" id="work" data-state="idle" hidden aria-labelledby="wt">
<div class="ws-head"><span class="ico" id="wic"></span><div><h2 id="wt"></h2><p id="wd"></p></div>{close}</div>
<div class="dz" id="drop" tabindex="0" role="button" aria-label="Drop files here, or press Enter to choose files">
<span class="up">{svg("upload")}</span><p class="t" id="dzt">Drop your file here</p><p class="or" aria-hidden="true">or</p><button class="btn lg" id="pick" type="button">{svg("upload")}<span>Choose file</span></button><p class="s" id="dzh"></p>
</div>
<input type="file" id="inp" hidden>
<div class="actions" id="camrow" hidden><button class="btn ghost lg" id="cam" type="button">{svg("camera")}<span>Take photo</span></button></div>
<input type="file" id="camin" accept="image/*" capture="environment" hidden>
<p class="msg" id="ferr" hidden role="alert"></p>
<ul class="files" id="files" aria-label="Selected files"></ul>
<p class="note" id="fnote" aria-live="polite"></p>
<div class="opts" id="opts"></div>
<div class="actions" id="main"><button class="btn lg" id="go" type="button" disabled><span id="gol">Convert</span></button></div>
<div class="prog" id="prog" hidden aria-live="polite">
<div class="prog-top"><span id="stage"></span><span id="pct"></span></div>
<div class="bar" id="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100"><i id="barfill"></i></div>
<p class="note" id="pnote"></p>
<button class="btn ghost" id="cancel" type="button">Cancel</button>
</div>
<div class="res ok" id="ok" hidden role="status">
<div class="mark">{svg("check")}</div><h3>Your file is ready</h3><p class="fn" id="okfn"></p><p class="note" id="oknote"></p>
<div class="actions"><a class="btn lg" id="dl" href="#">{svg("download")}<span>Download</span></a><button class="btn ghost lg" id="again" type="button">Convert another file</button></div>
</div>
<div class="res err" id="err" hidden role="alert">
<div class="mark">{svg("x")}</div><h3 id="errt"></h3><p id="errm"></p><p class="hint" id="errh"></p>
<div class="actions"><button class="btn lg" id="retry" type="button">Try again</button><button class="btn ghost lg" id="other" type="button">Choose another file</button></div>
</div>
</section>'''


def editor_ui():
    sw = "".join(f'<button class="sw" type="button" data-c="{c}" style="--c:{c}" aria-label="Colour {c}" aria-pressed="false"></button>'
                 for c in ["#111111", "#d9480f", "#1c7ed6", "#2b8a3e", "#e03131", "#fcc419"])
    tools = [("select", "pointer", "Select"), ("text", "type", "Text"), ("draw", "pencil", "Draw"), ("hl", "highlighter", "Highlight"), ("white", "square", "Cover"), ("img", "imgplus", "Image")]
    tb = "".join(f'<button class="tb" type="button" data-tool="{k}" aria-pressed="false">{svg(i)}<span>{n}</span></button>' for k, i, n in tools)
    return f'''<section class="ed" id="ed" aria-label="PDF editor">
<div class="dz" id="edrop" tabindex="0" role="button" aria-label="Drop a PDF here, or press Enter to choose one">
<span class="up">{svg("upload")}</span><p class="t" id="edt">Drop your PDF here</p><p class="or" aria-hidden="true">or</p><button class="btn lg" id="edpick" type="button">{svg("upload")}<span>Choose PDF</span></button><p class="s">PDF files up to 100 MB · stays on your device</p>
</div>
<input type="file" id="edin" accept=".pdf,application/pdf" hidden>
<input type="file" id="edimg" accept="image/png,image/jpeg" hidden>
<p class="msg" id="ederr" hidden role="alert"></p>
<div class="prog" id="edbusy" hidden aria-live="polite"><div class="prog-top"><span id="edbusyt">Opening your PDF…</span></div><div class="bar ind"><i></i></div></div>
<div id="edwork" hidden>
<div class="edbar" role="toolbar" aria-label="Editing tools">
<div class="tg" role="group" aria-label="Tools">{tb}</div>
<div class="tg" role="group" aria-label="Colour">{sw}</div>
<label class="szl"><span class="sr">Size</span><select id="edsz" aria-label="Size"><option value="s">Small</option><option value="m" selected>Medium</option><option value="l">Large</option></select></label>
<div class="tg"><button class="tb" id="edundo" type="button" disabled>{svg("undo")}<span>Undo</span></button><button class="tb" id="eddel" type="button" disabled>{svg("trash")}<span>Delete</span></button></div>
</div>
<p class="note" id="edhelp" aria-live="polite"></p>
<div id="edpages"></div>
<div class="actions"><button class="btn lg" id="eddl" type="button">{svg("download")}<span>Download edited PDF</span></button><button class="btn ghost lg" id="ednew" type="button">Open another PDF</button></div>
<div class="res ok" id="edok" hidden role="status"><div class="mark">{svg("check")}</div><h3>Your edited PDF is ready</h3><p class="fn" id="edokfn"></p><p class="note" id="edoknote"></p><div class="actions"><a class="btn lg" id="eddl2" href="#">{svg("download")}<span>Download again</span></a></div></div>
</div>
</section>'''


def card(t, tag="a"):
    inner = f'<span class="ico">{svg(t["ic"])}</span><span><b>{e(t["name"])}</b><small>{e(t["short"])}</small></span>'
    return f'<a class="card" href="/{t["slug"]}/" data-id="{t["id"]}" data-g="{t["g"]}">{inner}</a>'


# ---------- tool pages ----------
def tool_ld(t, url):
    steps = [{"@type": "HowToStep", "position": i + 1, "name": s} for i, s in enumerate(t["steps"])]
    return json.dumps({"@context": "https://schema.org", "@graph": [
        {"@type": "WebApplication", "name": f"EasyPDF {t['name']}", "url": url, "applicationCategory": "UtilitiesApplication",
         "operatingSystem": "Any", "description": t["desc"], "offers": {"@type": "Offer", "price": "0", "priceCurrency": "INR"}},
        {"@type": "HowTo", "name": t["h1"], "step": steps},
        {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in t["faq"]]},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "EasyPDF", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": t["name"], "item": url}]},
    ]}, ensure_ascii=False)


def tool_page(t):
    url = f"{SITE}/{t['slug']}/"
    badge = ("🔒 Runs in your browser. Your file never leaves your device." if t["local"]
             else "🔒 Secure server. Your file is deleted right after conversion.")
    related = "".join(f'<a href="/{BY_SLUG[s]["slug"]}/" data-g="{BY_SLUG[s]["g"]}"><span class="ico">{svg(BY_SLUG[s]["ic"])}</span><span><b>{e(BY_SLUG[s]["name"])}</b><span class="d">{e(BY_SLUG[s]["short"])}</span></span></a>' for s in t["related"])
    steps = "".join(f"<li>{e(s)}</li>" for s in t["steps"])
    cards = "".join(f'<div class="card3"><h3>{e(a)}</h3><p>{e(b)}</p></div>' for a, b in t["benefits"])
    notes = "".join(f"<li>{e(n)}</li>" for n in t["notes"])
    faq = "".join(f"<details><summary>{e(q)}</summary><p>{e(a)}</p></details>" for q, a in t["faq"])
    ad = AD if ADS else ""
    return head(t["title"], t["desc"], url, tool_ld(t, url)).replace("<body>", '<body class="tp">', 1) + f'''{HEADER}
<main class="wrap">
<p class="crumb"><a href="/">Home</a> › {e(t["name"])}</p>
<div class="hero t"><span class="badge">{badge}</span><h1>{e(t["h1"])}</h1><p>{e(t["intro"])}</p></div>
{editor_ui() if t["id"] == "edit" else workspace(False)}
<section class="sec"><h2>How to use {e(t["name"])}</h2><ol class="steps">{steps}</ol></section>
<section class="sec"><h2>Why use EasyPDF</h2><div class="cards3" style="margin-top:12px">{cards}</div></section>
<section class="sec"><h2>Good to know</h2><ul class="notes">{notes}</ul></section>
{ad}
<section class="sec"><h2>Questions about {e(t["name"])}</h2><div style="margin-top:12px">{faq}</div></section>
<section class="sec"><h2>More PDF tools</h2><div class="rel">{related}</div></section>
</main>
{FOOTER}
<script>window.EASYPDF_TOOL="{t["id"]}";</script>
{SCRIPTS}
{EDITOR_JS if t["id"] == "edit" else ""}
</body>
</html>
'''


# ---------- home page ----------
HOME_TITLE = "EasyPDF – Free Online PDF Tools: Merge, Convert, Compress, Unlock"
HOME_DESC = ("EasyPDF is a free online PDF toolkit. Merge, split, rotate, compress, protect and unlock PDFs, and convert "
             "PDF to Word, Word to PDF, Excel, PowerPoint and JPG. No sign-up.")


def home_page():
    ld = json.dumps({"@context": "https://schema.org", "@type": "WebApplication", "name": "EasyPDF", "url": SITE + "/",
                     "applicationCategory": "UtilitiesApplication", "operatingSystem": "Any", "description": HOME_DESC,
                     "offers": {"@type": "Offer", "price": "0", "priceCurrency": "INR"},
                     "featureList": [t["name"] for t in TOOLS]}, ensure_ascii=False)
    groups = ""
    for gid, gname, gdesc, gic in GROUPS:
        cards = "".join(card(t) for t in TOOLS if t["g"] == gid)
        groups += f'''<section class="grp" aria-labelledby="g-{gid}"><div class="grp-h"><span class="ico" data-g="{gid}">{svg(gic)}</span><div><h2 id="g-{gid}">{gname}</h2><p>{gdesc}</p></div></div><div class="cards">{cards}</div></section>
'''
    chips = "".join(f'<button class="chip" type="button" data-q="{q}">{l}</button>' for q, l in
                    [("merge", "Merge PDFs"), ("word", "Convert to Word"), ("compress", "Compress"), ("password", "Add a password"), ("scan", "Scanned PDF"), ("jpg", "PDF to image")])
    ad = AD if ADS else ""
    return head(HOME_TITLE, HOME_DESC, SITE + "/", ld) + f'''{HEADER}
<main class="wrap">
<div class="hero">
<span class="badge">Free · No sign-up · Files deleted after conversion</span>
<h1>Every PDF tool, <span>one simple place.</span></h1>
<p>Upload a file, pick what you want to do, and download the result.</p>
</div>

<section class="start" id="start" aria-label="Upload a file">
<div class="dz big" id="hdrop" tabindex="0" role="button" aria-label="Drop a file here, or press Enter to choose one">
<span class="up">{svg("upload")}</span><p class="t" id="hdt">Drop your file here</p><p class="or" aria-hidden="true">or</p><button class="btn lg" id="hpick" type="button">{svg("upload")}<span>Choose file</span></button><p class="s">PDF, Word, Excel, PowerPoint, JPG or PNG · up to 25 MB</p>
</div>
<input type="file" id="hinp" hidden multiple accept=".pdf,.doc,.docx,.odt,.rtf,.xls,.xlsx,.ods,.csv,.ppt,.pptx,.odp,.jpg,.jpeg,.png">
<p class="msg" id="herr" hidden role="alert"></p>
<div class="suggest" id="suggest" hidden aria-live="polite"></div>
</section>

<section class="find" id="tools">
<label for="q">What do you want to do with your PDF?</label>
<div class="sbox">{svg("search")}<input id="q" type="search" placeholder="Try “merge”, “Word”, “compress” or “password”" autocomplete="off"><button class="x" id="qclear" type="button" aria-label="Clear search" hidden>{svg("x")}</button></div>
<div class="chips">{chips}</div>
</section>

{workspace(True)}

<div id="groups">
{groups}<div class="empty" id="noresult" hidden><b>No tool matches that.</b><br>Try “merge”, “Word”, “compress” or “password”.</div>
</div>
{ad}
<section class="sec" id="about">
<h2>Why EasyPDF</h2>
<p class="lead">Simple PDF tools that respect your files.</p>
<div class="cards3">
<div class="card3"><h3>🔒 Private</h3><p>Merge, extract, rotate, scan, edit and images-to-PDF run inside your browser, so those files never leave your device. Other tools upload a file only for the conversion and delete it right after.</p></div>
<div class="card3"><h3>⚡ Free and quick</h3><p>No sign-up and no watermarks. Large or complex files can take a little longer to convert.</p></div>
<div class="card3"><h3>🧰 Everything in one place</h3><p>Convert between PDF and Word, Excel, PowerPoint and JPG. Scan, edit, repair, compress, protect, unlock and OCR your PDFs.</p></div>
</div>
</section>

<section class="sec" id="faq">
<h2>Questions</h2>
<details><summary>Is it safe to upload my files?</summary><p>Files are sent over an encrypted connection and processed only to make your result. They are deleted right after the conversion, and any leftover is removed within minutes. Read the <a href="/privacy.html">privacy page</a> for details.</p></details>
<details><summary>Which tools work without uploading?</summary><p>Images to PDF, Scan to PDF, Merge PDF, Extract pages, Rotate PDF and Edit PDF run entirely in your browser. The other tools need an upload.</p></details>
<details><summary>What is the file size limit?</summary><p>Tools that use the server accept files up to 25 MB. For bigger files, compress them first or split them with Extract pages.</p></details>
<details><summary>Can EasyPDF recover a forgotten password?</summary><p>No. Unlock PDF only removes a password you already know.</p></details>
<details><summary>My scanned PDF gives no text in Word. What now?</summary><p>Run OCR PDF first to make the text selectable, then convert the result to Word.</p></details>
</section>
</main>
{FOOTER}
{SCRIPTS}
</body>
</html>
'''


def main():
    # shared data for the browser
    open(os.path.join(ROOT, "assets", "icons.js"), "w", encoding="utf-8").write("window.ICONS=" + json.dumps(ICONS, ensure_ascii=False) + ";\n")
    meta = [{"id": t["id"], "slug": t["slug"], "name": t["name"], "short": t["short"], "g": t["g"], "ic": t["ic"], "cta": t["cta"], "kw": t["kw"], "local": t["local"]} for t in TOOLS]
    groups = [{"id": g, "name": n, "desc": d, "ic": i} for g, n, d, i in GROUPS]
    open(os.path.join(ROOT, "assets", "tools.js"), "w", encoding="utf-8").write(
        "window.TOOLS_META=" + json.dumps(meta, ensure_ascii=False) + ";\nwindow.GROUPS_META=" + json.dumps(groups, ensure_ascii=False) + ";\n")
    for t in TOOLS:
        d = os.path.join(ROOT, t["slug"]); os.makedirs(d, exist_ok=True)
        open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(tool_page(t))
    open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(home_page())
    urls = [("/", "1.0"), ("/privacy.html", "0.3")] + [(f"/{t['slug']}/", "0.8") for t in TOOLS]
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    xml += "".join(f"  <url><loc>{SITE}{u}</loc><lastmod>{DATE}</lastmod><priority>{pr}</priority></url>\n" for u, pr in urls)
    open(os.path.join(ROOT, "sitemap.xml"), "w").write(xml + "</urlset>\n")
    print(f"Built home page + {len(TOOLS)} tool pages, assets/icons.js, assets/tools.js and sitemap.xml")


if __name__ == "__main__":
    main()
