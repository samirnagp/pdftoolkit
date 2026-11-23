#!/usr/bin/env python3
"""Run from your repo root (the folder that contains merge-pdf/, compress-pdf/, ...):
    python3 apply_content.py --dry     # preview only
    python3 apply_content.py           # update the pages (a .bak backup is saved next to each)
For every <tool>/index.html it keeps your upload tool and script, replaces the text sections
between 'How to use ...' and 'More PDF tools' with the new content, and updates the
title, description, FAQ markup and stylesheet link. Pages it cannot match are skipped and reported."""
import os,re,sys,shutil
HERE=os.path.dirname(os.path.abspath(__file__))
DRY='--dry' in sys.argv
SLUGS="pdf-to-word word-to-pdf pdf-to-jpg excel-to-pdf powerpoint-to-pdf images-to-pdf scan-to-pdf pdf-to-excel merge-pdf split-pdf compress-pdf ocr-pdf rotate-pdf repair-pdf edit-pdf protect-pdf unlock-pdf".split()
CSS='<link rel="stylesheet" href="/assets/tool-content.css">'
def h2_start(s,pat,after=0):
    m=re.compile(r'<h2\b[^>]*>(?:(?!</h2>).)*?'+pat,re.S|re.I).search(s,after)
    if not m:return None
    i=m.start()
    sec=s.rfind('<section',0,i)
    if sec!=-1 and s.find('</section>',sec,i)==-1:i=sec   # heading is inside a <section> wrapper
    return i
def balanced(x):
    return all(len(re.findall(r'<'+t+r'\b',x,re.I))==len(re.findall(r'</'+t+'>',x,re.I)) for t in('div','section','details','ul','ol'))
done=skipped=0
for slug in SLUGS:
    p=os.path.join(slug,'index.html')
    if not os.path.exists(p):print('SKIP  ',slug,'- no',p);skipped+=1;continue
    c=open(os.path.join(HERE,'content',slug+'.html'),encoding='utf-8').read()
    blk=re.search(r'<!-- START -->(.*?)<!-- END -->',c,re.S).group(1).strip()
    head=re.search(r'<!--\s*(<title>.*?)-->\s*$',c,re.S).group(1)
    title=re.search(r'<title>(.*?)</title>',head,re.S).group(0)
    desc=re.search(r'<meta name="description"[^>]*>',head).group(0)
    ld=re.search(r'<script type="application/ld\+json">.*?</script>',head,re.S).group(0)
    s=open(p,encoding='utf-8').read()
    if 'class="cx"' in s:print('SKIP  ',slug,'- already updated');skipped+=1;continue
    a=h2_start(s,r'How to use')
    b=h2_start(s,r'More PDF tools',a or 0)
    if a is None or b is None or b<=a:print('SKIP  ',slug,'- could not find "How to use" / "More PDF tools" headings');skipped+=1;continue
    if not balanced(s[a:b]):print('SKIP  ',slug,'- section markup not self-contained, edit by hand');skipped+=1;continue
    n=s[:a]+blk+'\n'+s[b:]
    n,k=re.subn(r'<title>.*?</title>',lambda m:title,n,count=1,flags=re.S)
    if k==0:n=n.replace('</head>',title+'\n</head>',1)
    n,k=re.subn(r'<meta name="description"[^>]*>',lambda m:desc,n,count=1)
    if k==0:n=n.replace('</head>',desc+'\n</head>',1)
    if 'FAQPage' not in n:n=n.replace('</head>',ld+'\n</head>',1)
    if 'tool-content.css' not in n:n=n.replace('</head>',CSS+'\n</head>',1)
    if not DRY:
        shutil.copyfile(p,p+'.bak');open(p,'w',encoding='utf-8').write(n)
    print('OK    ',slug,'(dry run)' if DRY else '');done+=1
print(f'\n{done} page(s) {"would be " if DRY else ""}updated, {skipped} skipped.')
