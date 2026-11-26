# -*- coding: utf-8 -*-
"""Génère /public/blog/ (index + articles) et ajoute les URL au sitemap.
A lancer après gen_site.py :  python3 tools/gen_blog.py"""
import os, json, html, re
from blog_posts import POSTS, DATE, DATE_FR

SITE = 'https://chronodevisia.fr'
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public')
V = '9'
e = html.escape

CSS = '''
.post h1{font-size:clamp(1.6rem,4vw,2.2rem);line-height:1.2;margin:8px 0 12px}
.post .lead{font-size:1.08rem;color:var(--ink2)}
.post h2{margin-top:36px;font-size:1.35rem}.post h3{margin-top:22px;font-size:1.05rem}
.post p,.post li{color:var(--ink2);line-height:1.7}.post li{margin:4px 0}
.post a:not(.btn):not(.pcard){color:var(--acc2)}
.crumb{font-size:.85rem;color:var(--mute)}.crumb a{color:var(--mute)}
.meta{font-size:.85rem;color:var(--mute)}
.cta{background:var(--accbg);border:1px solid #fed7aa;border-radius:16px;padding:22px;margin:36px 0}
.cta h3{margin:0 0 6px}.cta p{margin:0 0 14px}
.faq p{margin:10px 0 0}
.note{font-size:.82rem;color:var(--mute);border-top:1px solid var(--line);padding-top:14px;margin-top:30px}
.plist{display:grid;gap:14px;margin-top:22px}
.pcard{display:block;text-decoration:none;color:inherit;background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px;transition:border-color .15s}
.pcard:hover{border-color:var(--acc)}.pcard h2,.pcard h3{margin:0 0 6px;font-size:1.12rem;color:var(--ink)}.pcard p{margin:0;color:var(--ink2);font-size:.95rem}
'''

def head(title, desc, url, ld):
    return f'''<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="article"><meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}"><meta property="og:url" content="{url}"><meta property="og:image" content="{SITE}/icons/og.png"><meta property="og:locale" content="fr_FR">
<link rel="icon" type="image/png" sizes="48x48" href="/icons/favicon-48.png"><link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/app.css?v={V}">
<style>{CSS}</style>
{''.join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>' for x in ld)}
</head>
<body>
<header class="top"><div class="wrap"><a class="logo" href="/"><img src="/icons/icon-192.png" alt="">Chrono<b>Devis</b></a><nav class="nav"><a class="lnk" href="/blog/">Guides</a><a class="btn btn-p btn-sm" href="/app/?signup=1">Essai gratuit</a></nav></div></header>
'''

FOOT = '''<footer class="foot"><div class="wrap row between">
  <div>© 2026 ChronoDevis</div>
  <div class="row"><a href="/blog/">Guides</a><a href="/legal.html#mentions">Mentions légales</a><a href="/legal.html#cgv">CGV</a><a href="/legal.html#confidentialite">Confidentialité</a></div>
</div></footer>
</body>
</html>
'''

CTA = '''<div class="cta"><h3>Des devis complets en 2 minutes</h3><p>ChronoDevis rédige le devis avec l'IA, ajoute vos mentions légales et permet au client de signer en ligne depuis son téléphone. 7 jours d'essai gratuit, sans carte bancaire.</p><a class="btn btn-p" href="/app/?signup=1">Essayer gratuitement</a></div>'''

def faq_html(faq):
    return ''.join(f'<details class="faq"><summary>{e(q)}</summary><p>{e(a)}</p></details>' for q, a in faq)

def article(p):
    url = f'{SITE}/blog/{p["slug"]}/'
    ld = [
        {'@context': 'https://schema.org', '@type': 'BlogPosting', 'headline': p['title'], 'description': p['desc'],
         'datePublished': DATE, 'dateModified': DATE, 'inLanguage': 'fr-FR', 'mainEntityOfPage': url,
         'image': f'{SITE}/icons/og.png',
         'author': {'@type': 'Organization', 'name': 'ChronoDevis', 'url': SITE},
         'publisher': {'@type': 'Organization', 'name': 'ChronoDevis', 'logo': {'@type': 'ImageObject', 'url': f'{SITE}/icons/icon-192.png'}}},
        {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
            {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in p['faq']]},
        {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Accueil', 'item': SITE + '/'},
            {'@type': 'ListItem', 'position': 2, 'name': 'Guides', 'item': SITE + '/blog/'},
            {'@type': 'ListItem', 'position': 3, 'name': p['short'], 'item': url}]},
    ]
    others = [o for o in POSTS if o is not p]
    rel = ''.join(f'<a class="pcard" href="/blog/{o["slug"]}/"><h3>{e(o["title"])}</h3><p>{e(o["desc"])}</p></a>' for o in others)
    return head(p['title'] + ' | ChronoDevis', p['desc'], url, ld) + f'''<main class="wrap narrow post" style="padding:26px 20px 50px">
<div class="crumb"><a href="/">Accueil</a> › <a href="/blog/">Guides</a> › {e(p["short"])}</div>
<article>
<h1>{e(p["title"])}</h1>
<p class="meta">Mis à jour le {DATE_FR} · {p["read"]} min de lecture</p>
<p class="lead">{e(p["lead"])}</p>
{p["body"].strip()}
{CTA}
<h2 id="faq">Questions fréquentes</h2>
<div style="margin-top:14px">{faq_html(p["faq"])}</div>
<p class="note">Article d'information générale, à jour au {DATE_FR}. Il ne remplace pas le conseil d'un professionnel du droit pour une situation particulière.</p>
</article>
<h2>À lire aussi</h2>
<div class="plist">{rel}</div>
</main>
''' + FOOT

def index():
    url = SITE + '/blog/'
    title = 'Guides du devis pour artisans : règles, litiges et bonnes pratiques | ChronoDevis'
    desc = 'Guides pratiques pour les artisans : mentions obligatoires du devis, rétractation et acompte, travaux supplémentaires, impayés. Questions et réponses claires.'
    ld = [{'@context': 'https://schema.org', '@type': 'Blog', 'name': 'Guides ChronoDevis', 'url': url, 'inLanguage': 'fr-FR',
           'blogPost': [{'@type': 'BlogPosting', 'headline': p['title'], 'url': f'{SITE}/blog/{p["slug"]}/', 'datePublished': DATE} for p in POSTS]}]
    cards = ''.join(f'<a class="pcard" href="/blog/{p["slug"]}/"><h2>{e(p["title"])}</h2><p>{e(p["desc"])}</p><p class="meta" style="margin-top:8px">{p["read"]} min de lecture</p></a>' for p in POSTS)
    return head(title, desc, url, ld).replace('og:type" content="article"', 'og:type" content="website"') + f'''<main class="wrap narrow post" style="padding:26px 20px 50px">
<div class="crumb"><a href="/">Accueil</a> › Guides</div>
<h1>Guides du devis pour artisans</h1>
<p class="lead">Les problèmes les plus courants autour du devis, expliqués simplement, avec les réponses aux questions que se posent les artisans et leurs clients.</p>
<div class="plist">{cards}</div>
{CTA}
</main>
''' + FOOT

if __name__ == '__main__':
    os.makedirs(os.path.join(ROOT, 'blog'), exist_ok=True)
    open(os.path.join(ROOT, 'blog', 'index.html'), 'w', encoding='utf-8').write(index())
    for p in POSTS:
        d = os.path.join(ROOT, 'blog', p['slug']); os.makedirs(d, exist_ok=True)
        open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(article(p))
    sm_path = os.path.join(ROOT, 'sitemap.xml')
    sm = open(sm_path, encoding='utf-8').read()
    sm = re.sub(r'<url><loc>[^<]*/blog/[^<]*</loc>.*?</url>', '', sm)
    add = f'<url><loc>{SITE}/blog/</loc><lastmod>{DATE}</lastmod></url>' + ''.join(
        f'<url><loc>{SITE}/blog/{p["slug"]}/</loc><lastmod>{DATE}</lastmod></url>' for p in POSTS)
    open(sm_path, 'w', encoding='utf-8').write(sm.replace('</urlset>', add + '</urlset>'))
    print('blog ok', len(POSTS))
