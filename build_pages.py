#!/usr/bin/env python3
"""Builds a landing page for every EasyPDF tool, plus sitemap.xml and the tool links on the home page.
Run from the site folder:   python3 tools/build_pages.py
Edit the TOOLS list below to change any text, then run it again."""
import html, json, os, re

SITE = "https://easypdf.co.in"
DATE = "2026-10-31"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTACT = "contact@easypdf.co.in"

# id = tool id used by assets/easypdf.js; local = runs in the browser (no upload)
TOOLS = [
 dict(id="p2w", slug="pdf-to-word", name="PDF to Word", icon="📝", local=False,
  title="PDF to Word Converter – Free Online PDF to DOCX | EasyPDF",
  desc="Convert PDF to editable Word (DOCX) online for free. Choose Auto, Fast or Best layout. Files are deleted right after conversion.",
  h1="Convert PDF to Word", short="Editable DOCX from any PDF.",
  intro="Turn a PDF into a Word document you can edit. Auto mode tries the best layout first and switches to a faster method if the file is complex, so you always get a usable file.",
  steps=["Choose your PDF file.", "Pick a mode. Auto is the best choice for most files.", "Click Convert, then download your .docx file."],
  benefits=[("Four modes", "Auto, Fast, Best layout or Page pictures, so you can trade speed against layout accuracy."),
            ("Never an empty file", "Every result is checked, and the tool falls back to a safer method if no text could be read."),
            ("Deleted after conversion", "Your PDF is removed from our server as soon as your Word file is sent.")],
  notes=["Auto tries the full-layout converter first and uses a faster one if it takes too long. A message tells you which was used.",
         "Scanned PDFs contain pictures of text, not real text. Run OCR PDF first for editable text, or choose Page pictures to keep the look.",
         "Files up to 25 MB are accepted. Very long documents may be limited in Best layout mode."],
  faq=[("Why does my Word file look different from the PDF?", "A PDF fixes every element in place, while Word reflows text. Best layout keeps the design closest to the original. Fast mode is quicker but simpler."),
       ("Can I convert a scanned PDF to editable Word?", "Yes, in two steps. Run OCR PDF to make the text selectable, then convert the result to Word."),
       ("Is PDF to Word free?", "Yes. There is no sign-up and no watermark.")],
  related=["ocr-pdf", "word-to-pdf", "compress-pdf", "unlock-pdf"]),
 dict(id="w2p", slug="word-to-pdf", name="Word to PDF", icon="📄", local=False,
  title="Word to PDF Converter – Free Online DOCX to PDF | EasyPDF",
  desc="Convert Word documents (DOC, DOCX, ODT, RTF) to PDF online for free. Quick, no sign-up, and files are deleted right after conversion.",
  h1="Convert Word to PDF", short="DOC and DOCX to PDF.",
  intro="Save a Word document as a PDF that looks the same on every device. Upload your file, and download a PDF in moments.",
  steps=["Choose your Word file (.doc, .docx, .odt or .rtf).", "Click Convert.", "Download your PDF."],
  benefits=[("Keeps your layout", "Headings, tables, images and page breaks carry over to the PDF."),
            ("Works with common formats", "DOC, DOCX, ODT and RTF files are supported."),
            ("Deleted after conversion", "Your document is removed from our server as soon as the PDF is sent.")],
  notes=["If your document uses a font that is not installed on our server, a similar font is used instead, so line breaks can shift slightly.",
         "Files up to 25 MB are accepted.",
         "Check the PDF before you send it, especially documents with unusual fonts or complex tables."],
  faq=[("Will the PDF look exactly like my Word file?", "In most cases yes. Documents that rely on unusual fonts may differ a little, because a similar font is substituted."),
       ("Can I convert password-protected Word files?", "No. Remove the password in Word first, then upload the file."),
       ("Can I protect the finished PDF with a password?", "Yes. Use Protect PDF on the result.")],
  related=["pdf-to-word", "protect-pdf", "compress-pdf", "merge-pdf"]),
 dict(id="p2j", slug="pdf-to-jpg", name="PDF to JPG", icon="📷", local=False,
  title="PDF to JPG Converter – Turn PDF Pages into Images | EasyPDF",
  desc="Convert every page of a PDF into a JPG image and download them as one ZIP. Choose 100 to 300 dpi. Free, no sign-up.",
  h1="Convert PDF to JPG", short="Each page as an image (ZIP).",
  intro="Turn each page of a PDF into a JPG picture. Pick the image quality, and download all the pages together in a single ZIP file.",
  steps=["Choose your PDF file.", "Select a resolution: 100 dpi for screens, 150 dpi for general use, 300 dpi for printing.", "Click Convert and download the ZIP with one JPG per page."],
  benefits=[("One image per page", "Pages are numbered page-1.jpg, page-2.jpg and so on."),
            ("Choose the quality", "From 100 to 300 dpi, depending on whether you need small files or sharp prints."),
            ("Deleted after conversion", "Your PDF is removed from our server as soon as the ZIP is sent.")],
  notes=["Long documents are limited to the first 100 pages.",
         "Higher resolutions make larger files and take longer.",
         "Files up to 25 MB are accepted."],
  faq=[("Which resolution should I choose?", "Use 150 dpi for most purposes. Choose 300 dpi if you plan to print the images, and 100 dpi for quick previews."),
       ("Can I get a single page only?", "Use Extract pages first to pull out the page you want, then convert it to JPG."),
       ("Why is a ZIP file downloaded?", "A PDF has many pages, so the images are packed together in one ZIP file.")],
  related=["images-to-pdf", "split-pdf", "compress-pdf", "ocr-pdf"]),
 dict(id="x2p", slug="excel-to-pdf", name="Excel to PDF", icon="📊", local=False,
  title="Excel to PDF Converter – Free XLSX to PDF Online | EasyPDF",
  desc="Convert Excel spreadsheets (XLS, XLSX, ODS, CSV) to PDF online for free. No sign-up, and files are deleted right after conversion.",
  h1="Convert Excel to PDF", short="Spreadsheets to PDF.",
  intro="Turn a spreadsheet into a PDF you can share or print. Upload your workbook and download the PDF.",
  steps=["Choose your spreadsheet (.xls, .xlsx, .ods or .csv).", "Click Convert.", "Download your PDF."],
  benefits=[("Share without editing", "Recipients see your numbers and formatting, but can’t change the cells."),
            ("Common formats", "XLS, XLSX, ODS and CSV files are supported."),
            ("Deleted after conversion", "Your file is removed from our server as soon as the PDF is sent.")],
  notes=["Wide sheets can spread across several pages. In Excel, set the print area and choose to fit all columns on one page before you upload.",
         "Formulas are shown as their calculated values.",
         "Files up to 25 MB are accepted."],
  faq=[("Why is my spreadsheet split over many pages?", "The PDF follows the sheet’s print settings. Fit the columns to one page width in Excel for a cleaner result."),
       ("Are all sheets converted?", "Yes, the sheets in the workbook are included in the PDF."),
       ("Can I merge the PDF with other documents?", "Yes. Use Merge PDF after conversion.")],
  related=["word-to-pdf", "powerpoint-to-pdf", "merge-pdf", "compress-pdf"]),
 dict(id="s2p", slug="powerpoint-to-pdf", name="PowerPoint to PDF", icon="📽️", local=False,
  title="PowerPoint to PDF Converter – PPTX to PDF Free | EasyPDF",
  desc="Convert PowerPoint presentations (PPT, PPTX, ODP) to PDF online for free. No sign-up, and files are deleted right after conversion.",
  h1="Convert PowerPoint to PDF", short="Slides to PDF.",
  intro="Save your presentation as a PDF so it opens the same way on every device. Each slide becomes one page.",
  steps=["Choose your presentation (.ppt, .pptx or .odp).", "Click Convert.", "Download your PDF."],
  benefits=[("One page per slide", "Layouts, images and text carry over to the PDF."),
            ("Easy to share", "A PDF opens everywhere, with no PowerPoint needed."),
            ("Deleted after conversion", "Your file is removed from our server as soon as the PDF is sent.")],
  notes=["Animations and transitions are not kept in a PDF.",
         "If a slide uses a font that is not installed on our server, a similar font is used instead.",
         "Files up to 25 MB are accepted. Compress large decks with Compress PDF afterwards."],
  faq=[("Are speaker notes included?", "No. The PDF contains the slides only."),
       ("Why does a slide look slightly different?", "Fonts or special effects that are not available on our server are replaced with similar ones."),
       ("Can I make the PDF smaller?", "Yes. Use Compress PDF on the result.")],
  related=["compress-pdf", "word-to-pdf", "merge-pdf", "protect-pdf"]),
 dict(id="cmp", slug="compress-pdf", name="Compress PDF", icon="🗜️", local=False,
  title="Compress PDF – Reduce PDF File Size Online | EasyPDF",
  desc="Make PDF files smaller for email and uploads. Choose smallest file, balanced or best quality. Free, with no sign-up.",
  h1="Compress PDF", short="Reduce file size.",
  intro="Shrink a PDF so it is easier to email or upload. Pick how much to compress, and download the smaller file.",
  steps=["Choose your PDF file.", "Select Smallest file, Balanced or Best quality.", "Click Convert and download the compressed PDF."],
  benefits=[("Three levels", "Smallest file for screens, Balanced for everyday use, Best quality for printing."),
            ("Never bigger", "If a PDF can’t be made smaller, you receive your original file back."),
            ("Deleted after conversion", "Your PDF is removed from our server as soon as the result is sent.")],
  notes=["PDFs full of photos or scans shrink the most. Text-only PDFs are often small already.",
         "Smaller files can look softer, so compare before you send an important document.",
         "Files up to 25 MB are accepted."],
  faq=[("How much smaller will my PDF be?", "It depends on the content. Image-heavy PDFs can shrink a lot, while text-only PDFs may change very little."),
       ("Will the quality drop?", "Smallest file lowers image quality the most. Best quality keeps images sharper."),
       ("My file is over 25 MB. What can I do?", "Split it with Extract pages, compress the parts, then merge them again.")],
  related=["merge-pdf", "split-pdf", "pdf-to-jpg", "protect-pdf"]),
 dict(id="prt", slug="protect-pdf", name="Protect PDF", icon="🔐", local=False,
  title="Protect PDF – Add a Password to a PDF Online | EasyPDF",
  desc="Lock a PDF with a password so only people who know it can open it. Strong AES-256 encryption. Free, with no sign-up.",
  h1="Protect PDF with a Password", short="Add a password (AES-256).",
  intro="Add a password to your PDF so only people who know it can open the file. Enter a password, and download the protected copy.",
  steps=["Choose your PDF file.", "Type a password of 4 to 64 characters.", "Click Convert and download the protected PDF."],
  benefits=[("Strong encryption", "The file is encrypted with AES-256."),
            ("Quick", "Done in seconds, and nothing to install."),
            ("Password not stored", "The password is used only to lock your file and is not kept.")],
  notes=["Write the password down somewhere safe. We cannot recover a forgotten password.",
         "Share the password through a different channel than the file, for example by phone.",
         "Files up to 25 MB are accepted."],
  faq=[("What if I forget the password?", "We can’t recover it, and neither can anyone else. Keep an unprotected copy somewhere safe."),
       ("Can I remove the password later?", "Yes. Use Unlock PDF and enter the password."),
       ("Does the password protect the file when I email it?", "Yes. Anyone who opens the file needs the password.")],
  related=["unlock-pdf", "compress-pdf", "merge-pdf", "word-to-pdf"]),
 dict(id="unl", slug="unlock-pdf", name="Unlock PDF", icon="🔓", local=False,
  title="Unlock PDF – Remove a PDF Password Online | EasyPDF",
  desc="Remove the password from a PDF you own. Enter the current password and download an unlocked copy. Free, with no sign-up.",
  h1="Unlock a PDF", short="Remove the password from a PDF you own.",
  intro="Remove the password from a PDF when you already know it, so you can open, print or share it without typing it each time.",
  steps=["Choose your protected PDF file.", "Type its current password (leave it empty if the file opens without one).", "Click Convert and download the unlocked PDF."],
  benefits=[("Removes the password", "You get a copy that opens without asking for a password."),
            ("Removes restrictions", "Files that open freely but block printing or copying can be freed too."),
            ("Password not stored", "The password is used only for this one step and is not kept.")],
  notes=["This tool cannot recover a forgotten password. You need the correct password to unlock a file.",
         "Use it only on files you own or have permission to change.",
         "Files up to 25 MB are accepted."],
  faq=[("Can you unlock a PDF if I forgot the password?", "No. EasyPDF only removes a password you already know."),
       ("Why does it say the password is incorrect?", "Check the capital letters and spaces. Passwords are case-sensitive."),
       ("Can I protect the file again later?", "Yes. Use Protect PDF.")],
  related=["protect-pdf", "merge-pdf", "pdf-to-word", "compress-pdf"]),
 dict(id="ocr", slug="ocr-pdf", name="OCR PDF", icon="🔍", local=False,
  title="OCR PDF – Make Scanned PDFs Searchable | EasyPDF",
  desc="Turn scanned PDFs into searchable, selectable text with OCR. English and Hindi supported. Free, no sign-up.",
  h1="OCR PDF: Make Scans Searchable", short="Make scanned PDFs searchable.",
  intro="A scanned PDF is just pictures of pages. OCR reads the text in those pictures so you can search, select and copy it.",
  steps=["Choose your scanned PDF.", "Select the language: English, Hindi, or both.", "Click Convert and download the searchable PDF."],
  benefits=[("Searchable text", "Find words, copy paragraphs and use the file with other tools."),
            ("English and Hindi", "Pick one language or both for mixed documents."),
            ("Skips pages with text", "Pages that already have text are left as they are.")],
  notes=["OCR reads page by page, so long scans take several minutes. Try a few pages first.",
         "Clear, straight scans at 200 to 300 dpi give the best results.",
         "After OCR, you can convert the result to Word with PDF to Word. Files up to 25 MB are accepted."],
  faq=[("How do I know if my PDF is scanned?", "Try selecting text with your mouse. If you can’t, it is probably a scan."),
       ("Will the file look different afterwards?", "No. The pages look the same, with an invisible text layer added."),
       ("How accurate is OCR?", "It depends on the scan. Clean, well-lit, straight pages work best. Always check important text.")],
  related=["pdf-to-word", "compress-pdf", "pdf-to-jpg", "unlock-pdf"]),
 dict(id="img", slug="images-to-pdf", name="Images to PDF", icon="🖼️", local=True,
  title="JPG to PDF Converter – Images to PDF Online | EasyPDF",
  desc="Combine JPG and PNG images into one PDF in your browser. Free, no sign-up, and your pictures never leave your device.",
  h1="Convert Images to PDF", short="JPG and PNG into one PDF.",
  intro="Turn photos, scans and screenshots into a single PDF. Each picture gets its own page, and everything happens in your browser.",
  steps=["Choose your JPG or PNG images.", "Check the order of the files in the list.", "Click Convert and download your PDF."],
  benefits=[("Stays on your device", "The conversion runs in your browser, so your pictures are never uploaded."),
            ("One page per image", "Each page matches the size of its picture, so nothing is cropped or stretched."),
            ("No sign-up", "Open the page, convert and download. No account and no watermark.")],
  notes=["Supported formats are JPG and PNG. Convert other formats, such as WebP or HEIC, to JPG first.",
         "Pages follow the order of the files in the list, which is usually alphabetical. Rename files 1, 2, 3 to control the order.",
         "If the PDF is large, shrink it afterwards with Compress PDF."],
  faq=[("Does it reduce the quality of my pictures?", "No. Pictures are placed in the PDF as they are. Large photos make a large PDF, so use Compress PDF if needed."),
       ("Can I mix JPG and PNG files?", "Yes, in the same PDF."),
       ("Are my images uploaded anywhere?", "No. This tool works entirely in your browser.")],
  related=["merge-pdf", "compress-pdf", "pdf-to-jpg", "rotate-pdf"]),
 dict(id="merge", slug="merge-pdf", name="Merge PDF", icon="🧩", local=True,
  title="Merge PDF – Combine PDF Files Online Free | EasyPDF",
  desc="Merge several PDF files into one in your browser. Free, fast and private: your files are not uploaded.",
  h1="Merge PDF Files", short="Join several PDFs into one.",
  intro="Combine two or more PDFs into a single document. Choose your files, and download the merged PDF. It all happens in your browser.",
  steps=["Choose two or more PDF files.", "Check the order in the list.", "Click Convert and download the merged PDF."],
  benefits=[("Stays on your device", "Your files are merged in your browser and never uploaded."),
            ("Any number of files", "Limited only by your device’s memory."),
            ("No sign-up", "No account, no watermark and no limits on use.")],
  notes=["Files are joined in the order they are listed, usually alphabetical. Rename them 1, 2, 3 to set the order.",
         "Password-protected PDFs must be unlocked first with Unlock PDF.",
         "Interactive elements such as bookmarks may not carry over to the merged file."],
  faq=[("Can I change the order of the files?", "Rename the files so their names sort in the order you want, then choose them again."),
       ("Is there a limit on file size?", "No fixed limit. Very large files depend on your device’s memory."),
       ("Are my files uploaded?", "No. Merging runs entirely in your browser.")],
  related=["split-pdf", "compress-pdf", "images-to-pdf", "unlock-pdf"]),
 dict(id="split", slug="split-pdf", name="Extract Pages", icon="✂️", local=True,
  title="Extract Pages from PDF – Split PDF Online | EasyPDF",
  desc="Pull selected pages or page ranges out of a PDF into a new file. Free and private: it runs in your browser.",
  h1="Extract Pages from a PDF", short="Pull out pages or ranges.",
  intro="Keep only the pages you need. Type the pages you want, and download them as a new PDF. It runs in your browser, so nothing is uploaded.",
  steps=["Choose your PDF file.", "Type the pages you want, for example 1-3,5,8-10.", "Click Convert and download the new PDF."],
  benefits=[("Stays on your device", "Your PDF is processed in your browser and never uploaded."),
            ("Pages and ranges", "Mix single pages and ranges in one list."),
            ("No sign-up", "No account, no watermark.")],
  notes=["Separate pages with commas and use a dash for ranges: 1-3,5,8-10.",
         "Pages are copied in the order you type them, and repeated numbers are used once.",
         "The result is one new PDF. To split a document into several parts, run the tool once for each part."],
  faq=[("Can I split a PDF into many separate files at once?", "This tool makes one PDF from the pages you choose. Run it again for each additional part."),
       ("What if I type a page that doesn’t exist?", "Pages beyond the end of the document are ignored."),
       ("Is my PDF uploaded?", "No. Extracting pages runs entirely in your browser.")],
  related=["merge-pdf", "rotate-pdf", "compress-pdf", "pdf-to-jpg"]),
 dict(id="rot", slug="rotate-pdf", name="Rotate PDF", icon="🔄", local=True,
  title="Rotate PDF – Turn PDF Pages Online Free | EasyPDF",
  desc="Rotate every page of a PDF by 90, 180 or 270 degrees in your browser. Free and private: your file is not uploaded.",
  h1="Rotate PDF Pages", short="Rotate all pages 90°, 180° or 270°.",
  intro="Fix a sideways or upside-down PDF. Choose an angle, and download the rotated file. It runs in your browser, so nothing is uploaded.",
  steps=["Choose your PDF file.", "Select 90, 180 or 270 degrees.", "Click Convert and download the rotated PDF."],
  benefits=[("Stays on your device", "Your PDF is rotated in your browser and never uploaded."),
            ("Three angles", "Turn pages 90° clockwise, 180° or 270°."),
            ("No sign-up", "No account, no watermark.")],
  notes=["The angle is applied to all pages. For only some pages, pull them out with Extract pages, rotate them, then join everything with Merge PDF.",
         "A rotation of 90 turns pages clockwise, and 270 turns them counter-clockwise."],
  faq=[("Can I rotate just one page?", "Not directly. Extract that page, rotate it, and merge the parts back together."),
       ("Does rotating reduce quality?", "No. Only the page orientation changes."),
       ("Is my PDF uploaded?", "No. Rotating runs entirely in your browser.")],
  related=["merge-pdf", "split-pdf", "compress-pdf", "images-to-pdf"]),
]
BY_SLUG = {t["slug"]: t for t in TOOLS}
e = html.escape


def jsonld(t, url):
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


def page(t):
    url = f"{SITE}/{t['slug']}/"
    badge = ("🔒 Runs in your browser. Your file never leaves your device." if t["local"]
             else "🔒 Secure server. Your file is deleted right after conversion.")
    related = "".join(f'<a href="/{BY_SLUG[s]["slug"]}/"><b>{BY_SLUG[s]["icon"]} {e(BY_SLUG[s]["name"])}</b><span>{e(BY_SLUG[s]["short"])}</span></a>' for s in t["related"])
    steps = "".join(f"<li>{e(s)}</li>" for s in t["steps"])
    cards = "".join(f'<div class="card3"><h3>{e(a)}</h3><p>{e(b)}</p></div>' for a, b in t["benefits"])
    notes = "".join(f"<li>{e(n)}</li>" for n in t["notes"])
    faq = "".join(f"<details><summary>{e(q)}</summary><p>{e(a)}</p></details>" for q, a in t["faq"])
    pdflib = '<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"></script>\n' if t["local"] else ""
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(t["title"])}</title>
<meta name="description" content="{e(t["desc"])}">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#d9480f">
<meta property="og:type" content="website">
<meta property="og:site_name" content="EasyPDF">
<meta property="og:title" content="{e(t["title"])}">
<meta property="og:description" content="{e(t["desc"])}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/icons/icon-512.png">
<meta name="twitter:card" content="summary">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" type="image/png" href="/icons/icon-96.png">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<script type="application/ld+json">{jsonld(t, url)}</script>
<link rel="stylesheet" href="/assets/easypdf.css?v=1">
</head>
<body>
<header><div class="wrap"><nav>
<a class="logo" href="/" style="color:inherit;text-decoration:none">Easy<b>PDF</b></a>
<div><a href="/#tools">All tools</a><a href="/#about">About</a><a href="/privacy.html" class="keep">Privacy</a></div>
</nav></div></header>

<main class="wrap">
<p class="crumb"><a href="/">Home</a> › {e(t["name"])}</p>
<div class="hero t">
<span class="badge">{badge}</span>
<h1>{e(t["h1"])}</h1>
<p>{e(t["intro"])}</p>
</div>

<div class="panel" id="work" hidden>
<h2 id="wt"></h2><p id="wd" style="color:var(--mu);margin:0 0 14px"></p>
<div class="drop" id="drop">Tap to choose files or drag &amp; drop here</div>
<input type="file" id="inp" hidden>
<ul id="files"></ul>
<div class="row" id="opts"></div>
<div class="row"><button class="p" id="go" disabled>Convert</button><a class="p" id="dl" hidden>Download</a></div>
<div id="msg" aria-live="polite"></div>
</div>

<section class="sec">
<h2>How to use {e(t["name"])}</h2>
<ol class="steps" style="margin-top:12px">{steps}</ol>
</section>

<section class="sec">
<h2>Why use EasyPDF</h2>
<div class="cards3" style="margin-top:12px">{cards}</div>
</section>

<section class="sec">
<h2>Good to know</h2>
<ul class="notes">{notes}</ul>
</section>

<section class="sec">
<h2>Questions about {e(t["name"])}</h2>
<div style="margin-top:12px">{faq}</div>
</section>

<section class="sec">
<h2>More PDF tools</h2>
<div class="rel">{related}</div>
</section>
</main>

<footer><div class="wrap">© 2026 EasyPDF · <a href="/">Home</a> · <a href="/privacy.html">Privacy</a> · <a href="mailto:{CONTACT}">Contact</a><br>Browser tools run on your device; server tools delete files right after conversion.</div></footer>

{pdflib}<script>window.EASYPDF_TOOL="{t["id"]}";</script>
<script src="/assets/config.js?v=1"></script>
<script src="/assets/easypdf.js?v=1"></script>
<script src="/pwa.js" defer></script>
</body>
</html>
'''


def main():
    for t in TOOLS:
        d = os.path.join(ROOT, t["slug"])
        os.makedirs(d, exist_ok=True)
        open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(page(t))
    # home page: crawlable links to every tool page
    links = "".join(f'<a href="/{t["slug"]}/"><b>{t["icon"]} {e(t["name"])}</b><span>{e(t["short"])}</span></a>' for t in TOOLS)
    p = os.path.join(ROOT, "index.html")
    h = open(p, encoding="utf-8").read()
    h, n = re.subn(r'(<div class="rel" id="alltools">).*?(</div>\n</section>)', lambda m: m.group(1) + links + m.group(2), h, 1, flags=re.S)
    assert n == 1, "alltools block not found in index.html"
    open(p, "w", encoding="utf-8").write(h)
    # sitemap
    urls = [("/", "1.0"), ("/privacy.html", "0.3")] + [(f"/{t['slug']}/", "0.8") for t in TOOLS]
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    xml += "".join(f"  <url><loc>{SITE}{u}</loc><lastmod>{DATE}</lastmod><priority>{pr}</priority></url>\n" for u, pr in urls)
    open(os.path.join(ROOT, "sitemap.xml"), "w").write(xml + "</urlset>\n")
    print(f"Built {len(TOOLS)} tool pages, updated index.html and sitemap.xml")


if __name__ == "__main__":
    main()
