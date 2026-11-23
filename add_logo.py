#!/usr/bin/env python3
"""Run from your repo root:  python3 add_logo.py
Adds favicon links and /assets/logo.js to every page/template file (html, htm, ejs, njk, hbs, php, pug-free).
Safe to run repeatedly. Prints every file it changes, and a warning if it finds none."""
import os
ICON='<link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png"><link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">\n'
TAG='<script src="/assets/logo.js?v=4" defer></script>\n'
EXT=('.html','.htm','.ejs','.njk','.hbs','.handlebars','.php')
SKIP={'node_modules','.git','.next','dist','build'}
n=0;seen=0
for root,dirs,files in os.walk('.'):
    dirs[:]=[d for d in dirs if d not in SKIP]
    for f in files:
        if not f.endswith(EXT):continue
        seen+=1
        p=os.path.join(root,f);s=open(p,encoding='utf-8',errors='ignore').read();o=s
        if 'rel="icon"' not in s and '</head>' in s:s=s.replace('</head>',ICON+'</head>',1)
        if '/assets/logo.js' in s:s=__import__('re').sub(r'/assets/logo\.js(\?v=\d+)?"','/assets/logo.js?v=4"',s)
        elif '</body>' in s:s=s.replace('</body>',TAG+'</body>',1)
        if s!=o:open(p,'w',encoding='utf-8').write(s);n+=1;print('updated',p)
print(f'{seen} page file(s) found, {n} updated')
if seen==0:print('WARNING: no page files found - run from the repo root.')
