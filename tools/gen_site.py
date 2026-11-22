#!/usr/bin/env python3
"""Génère les pages publiques de ChronoDevis (accueil + tarifs + mentions) en 4 langues.
Usage : python3 tools/gen_site.py   (écrit dans public/)"""
import html, json, os
ICONS = json.load(open(os.path.join(os.path.dirname(__file__), 'icons.json'), encoding='utf-8'))
def svg(name):
    return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + '</svg>'

ROOT = os.path.join(os.path.dirname(__file__), '..', 'public')
SITE = 'https://chronodevisia.fr'
V = '7'
LANGS = ['fr', 'en', 'es', 'ar']
PATH = {'fr': '/', 'en': '/en/', 'es': '/es/', 'ar': '/ar/'}
OG = {'fr': 'fr_FR', 'en': 'en_GB', 'es': 'es_ES', 'ar': 'ar_AR'}
NAME = {'fr': 'Français', 'en': 'English', 'es': 'Español', 'ar': 'العربية'}

PRICE = {'essentiel': {'month': 19, 'year': 182}, 'pro': {'month': 39, 'year': 374}}

T = {
 'fr': dict(
  title='ChronoDevis – Devis artisan en 2 minutes avec l\'IA | Logiciel de devis BTP',
  desc='Logiciel de devis pour artisans de tous les métiers : l\'IA chiffre main d\'œuvre, fournitures et déplacement à partir d\'une description ou d\'une photo. Devis conformes, page client, 7 jours gratuits sans carte.',
  nav_feat='Fonctionnalités', nav_price='Tarifs', nav_faq='FAQ', login='Connexion', start='Essai gratuit',
  badge='Pour tous les artisans et toutes les entreprises en France',
  h1='Vos devis en <em>2 minutes</em>, chiffrés par l\'intelligence artificielle',
  lead='Décrivez le chantier ou prenez une photo : ChronoDevis estime la main d\'œuvre, les fournitures et le déplacement, puis génère un devis conforme à votre nom. Plombier, électricien, maçon, peintre… micro-entreprise, SARL ou SAS.',
  cta='Commencer gratuitement – 7 jours', cta_sub='Sans carte bancaire · Sans engagement',
  demo_t='Essayez tout de suite', demo_s='Décrivez des travaux, l\'IA les chiffre en quelques secondes.',
  demo_ph='Ex : repeindre un salon de 25 m², murs et plafond, avec préparation des fissures',
  demo_btn='Estimer', demo_photo='Ajouter une photo',
  f_t='Tout pour chiffrer, envoyer et signer plus vite',
  feats=[('sparkles','Chiffrage par IA','Heures, taux horaire, fournitures avec quantités et prix, déplacement : l\'IA propose, vous ajustez.'),
         ('camera','Analyse de photos','Photographiez l\'équipement ou le chantier : l\'IA identifie le matériel, l\'état et les contraintes.'),
         ('file','Devis conformes','Numérotation, mentions légales, TVA (20 %, 10 %, 5,5 % ou franchise 293 B), assurance, bon pour accord.'),
         ('link','Votre page client','Un lien à partager : vos clients obtiennent une estimation et vous envoient leur demande directement.'),
         ('wrench','Tous les métiers','Plomberie, électricité, maçonnerie, peinture, menuiserie, couverture, carrelage, paysagisme et plus.'),
         ('building','Toutes les structures','Micro-entreprise, EI, EURL, SARL, SASU, SAS : vos mentions et votre régime de TVA s\'adaptent.'),
         ('phone-app','Application mobile','Installez ChronoDevis sur Android et iPhone et faites vos devis directement sur le chantier.'),
         ('globe','4 langues','Interface en français, anglais, espagnol et arabe. Devis toujours édités en français, conformes au droit français.')],
  how_t='Comment ça marche', how=[('1','Décrivez ou photographiez','Quelques mots ou une photo du chantier suffisent.'),('2','L\'IA chiffre','Main d\'œuvre, fournitures, déplacement et TVA en quelques secondes.'),('3','Ajustez et envoyez','Modifiez les lignes, éditez le PDF et faites-le signer.')],
  p_t='Des tarifs simples', p_s='7 jours d\'essai gratuit avec toutes les fonctionnalités Pro. Sans carte bancaire.',
  monthly='Mensuel', yearly='Annuel', save='-20 %', per_month='€ / mois', per_year='€ / an', billed_year='soit {m} € / mois, facturé annuellement', tax_note='Prix nets : TVA non applicable, art. 293 B du CGI.',
  ess_n='Essentiel', ess_d='Pour l\'artisan qui démarre.', pro_n='Pro', pro_d='Pour chiffrer plus et convertir vos visiteurs.', popular='Le plus choisi',
  ess_f=['40 estimations IA par mois','Devis illimités et conformes (PDF)','Bibliothèque de vos prix','Votre page client','30 demandes clients par mois','Toutes les mentions légales et régimes de TVA'],
  pro_f=['400 estimations IA par mois','Analyse de photos par l\'IA','Dictée vocale des chantiers','Tableau de bord de votre activité','Demandes clients illimitées','Votre logo et vos couleurs','Support prioritaire'],
  choose='Essayer 7 jours gratuits',
  faq_t='Questions fréquentes',
  faq=[('Que se passe-t-il après les 7 jours ?','Rien n\'est prélevé : aucune carte n\'est demandée. Vous choisissez une formule pour continuer, sinon votre compte passe en lecture seule et vos devis restent consultables.'),
       ('Les prix proposés par l\'IA sont-ils fiables ?','L\'IA s\'appuie sur les prix du marché français et sur votre description. C\'est une base de travail : vous pouvez modifier chaque ligne et indiquer votre propre taux horaire.'),
       ('Mes devis sont-ils conformes ?','Oui : numéro, date, durée de validité, identité de l\'entreprise (SIRET, RCS/RM, TVA), assurance, détail des prestations, totaux HT/TVA/TTC, conditions de paiement et zone « bon pour accord ».'),
       ('Puis-je résilier à tout moment ?','Oui, en un clic depuis votre espace. L\'abonnement s\'arrête à la fin de la période payée.'),
       ('Où sont stockées mes données ?','Dans une base sécurisée en Europe. Vos données et celles de vos clients ne sont ni revendues ni utilisées à d\'autres fins.')],
  f_legal='Mentions légales', f_cgv='CGV / CGU', f_priv='Confidentialité', f_contact='Contact', rights='Tous droits réservés.',
  est_title='Estimation', est_total='Total estimé HT', est_more='Créez votre compte pour éditer ce devis, ajouter vos mentions et l\'envoyer.', est_cta='Créer mon compte gratuit',
 ),
 'en': dict(
  title='ChronoDevis – Tradesman quotes in 2 minutes with AI | Quote software for France',
  desc='Quote software for tradespeople in France: AI prices labour, materials and travel from a description or a photo. Compliant quotes, client page, 7-day free trial, no card.',
  nav_feat='Features', nav_price='Pricing', nav_faq='FAQ', login='Log in', start='Free trial',
  badge='For every trade and every business in France',
  h1='Your quotes in <em>2 minutes</em>, priced by artificial intelligence',
  lead='Describe the job or take a photo: ChronoDevis estimates labour, materials and travel, then creates a compliant quote in your name. Plumber, electrician, builder, painter… sole trader, SARL or SAS.',
  cta='Start free – 7 days', cta_sub='No credit card · No commitment',
  demo_t='Try it now', demo_s='Describe some work and the AI prices it in seconds.',
  demo_ph='E.g. repaint a 25 m² living room, walls and ceiling, including crack repair',
  demo_btn='Estimate', demo_photo='Add a photo',
  f_t='Everything to price, send and sign faster',
  feats=[('sparkles','AI pricing','Hours, hourly rate, materials with quantities and prices, travel: the AI suggests, you adjust.'),
         ('camera','Photo analysis','Snap the equipment or the site: the AI identifies the hardware, its condition and constraints.'),
         ('file','Compliant quotes','Numbering, French legal mentions, VAT (20%, 10%, 5.5% or 293 B exemption), insurance, sign-off box.'),
         ('link','Your client page','A link to share: your clients get an estimate and send their request straight to you.'),
         ('wrench','Every trade','Plumbing, electrical, masonry, painting, carpentry, roofing, tiling, landscaping and more.'),
         ('building','Every business type','Micro-entreprise, EI, EURL, SARL, SASU, SAS: your mentions and VAT regime adapt.'),
         ('phone-app','Mobile app','Install ChronoDevis on Android and iPhone and quote right on site.'),
         ('globe','4 languages','Interface in French, English, Spanish and Arabic. Quotes are always issued in French, compliant with French law.')],
  how_t='How it works', how=[('1','Describe or photograph','A few words or a photo of the job is enough.'),('2','AI prices it','Labour, materials, travel and VAT in seconds.'),('3','Adjust and send','Edit the lines, export the PDF and get it signed.')],
  p_t='Simple pricing', p_s='7-day free trial with all Pro features. No credit card.',
  monthly='Monthly', yearly='Yearly', save='-20%', per_month='€ / month', per_year='€ / year', billed_year='i.e. €{m} / month, billed yearly', tax_note='Net prices: VAT not applicable (art. 293 B of the French tax code).',
  ess_n='Essentiel', ess_d='For tradespeople getting started.', pro_n='Pro', pro_d='Price more and convert your visitors.', popular='Most popular',
  ess_f=['40 AI estimates per month','Unlimited compliant quotes (PDF)','Your price library','Your client page','30 client requests per month','All legal mentions and VAT regimes'],
  pro_f=['400 AI estimates per month','AI photo analysis','Voice dictation on site','Business dashboard','Unlimited client requests','Your logo and colours','Priority support'],
  choose='Try free for 7 days',
  faq_t='FAQ',
  faq=[('What happens after 7 days?','Nothing is charged: no card is required. Choose a plan to continue; otherwise your account becomes read-only and your quotes stay available.'),
       ('Are the AI prices reliable?','The AI uses French market prices and your description. It\'s a starting point: edit any line and set your own hourly rate.'),
       ('Are my quotes compliant?','Yes: number, date, validity, company identity (SIRET, RCS/RM, VAT), insurance, itemised work, totals excl./incl. VAT, payment terms and a sign-off box.'),
       ('Can I cancel anytime?','Yes, in one click from your account. Your plan stops at the end of the paid period.'),
       ('Where is my data stored?','In a secure database in Europe. Your data and your clients\' data are never sold or used for anything else.')],
  f_legal='Legal notice', f_cgv='Terms', f_priv='Privacy', f_contact='Contact', rights='All rights reserved.',
  est_title='Estimate', est_total='Estimated total excl. VAT', est_more='Create your account to edit this quote, add your details and send it.', est_cta='Create my free account',
 ),
 'es': dict(
  title='ChronoDevis – Presupuestos de obra en 2 minutos con IA | Software para profesionales en Francia',
  desc='Software de presupuestos para profesionales de todos los oficios en Francia: la IA calcula mano de obra, materiales y desplazamiento a partir de una descripción o una foto. 7 días gratis sin tarjeta.',
  nav_feat='Funciones', nav_price='Precios', nav_faq='Preguntas', login='Entrar', start='Prueba gratis',
  badge='Para todos los oficios y todas las empresas en Francia',
  h1='Tus presupuestos en <em>2 minutos</em>, calculados por inteligencia artificial',
  lead='Describe la obra o haz una foto: ChronoDevis estima la mano de obra, los materiales y el desplazamiento, y genera un presupuesto conforme a tu nombre. Fontanero, electricista, albañil, pintor… autónomo, SARL o SAS.',
  cta='Empezar gratis – 7 días', cta_sub='Sin tarjeta · Sin compromiso',
  demo_t='Pruébalo ahora', demo_s='Describe un trabajo y la IA lo calcula en segundos.',
  demo_ph='Ej.: pintar un salón de 25 m², paredes y techo, reparando grietas',
  demo_btn='Calcular', demo_photo='Añadir una foto',
  f_t='Todo para presupuestar, enviar y firmar más rápido',
  feats=[('sparkles','Cálculo con IA','Horas, tarifa, materiales con cantidades y precios, desplazamiento: la IA propone, tú ajustas.'),
         ('camera','Análisis de fotos','Fotografía el equipo o la obra: la IA identifica el material, su estado y las dificultades.'),
         ('file','Presupuestos conformes','Numeración, menciones legales francesas, IVA (20 %, 10 %, 5,5 % o exención 293 B), seguro, firma.'),
         ('link','Tu página de clientes','Un enlace para compartir: tus clientes obtienen una estimación y te envían su solicitud.'),
         ('wrench','Todos los oficios','Fontanería, electricidad, albañilería, pintura, carpintería, tejados, alicatado, jardinería y más.'),
         ('building','Todas las estructuras','Micro-entreprise, EI, EURL, SARL, SASU, SAS: tus menciones y tu régimen de IVA se adaptan.'),
         ('phone-app','App móvil','Instala ChronoDevis en Android y iPhone y presupuesta en la obra.'),
         ('globe','4 idiomas','Interfaz en francés, inglés, español y árabe. Presupuestos siempre en francés, conformes al derecho francés.')],
  how_t='Cómo funciona', how=[('1','Describe o fotografía','Unas palabras o una foto bastan.'),('2','La IA calcula','Mano de obra, materiales, desplazamiento e IVA en segundos.'),('3','Ajusta y envía','Edita las líneas, exporta el PDF y hazlo firmar.')],
  p_t='Precios sencillos', p_s='7 días de prueba gratis con todas las funciones Pro. Sin tarjeta.',
  monthly='Mensual', yearly='Anual', save='-20 %', per_month='€ / mes', per_year='€ / año', billed_year='es decir {m} € / mes, facturado anualmente', tax_note='Precios netos: IVA no aplicable (art. 293 B del código fiscal francés).',
  ess_n='Essentiel', ess_d='Para empezar.', pro_n='Pro', pro_d='Para presupuestar más y convertir visitas.', popular='El más elegido',
  ess_f=['40 estimaciones IA al mes','Presupuestos ilimitados y conformes (PDF)','Biblioteca de tus precios','Tu página de clientes','30 solicitudes de clientes al mes','Todas las menciones legales y regímenes de IVA'],
  pro_f=['400 estimaciones IA al mes','Análisis de fotos con IA','Dictado por voz en la obra','Panel de tu actividad','Solicitudes de clientes ilimitadas','Tu logo y tus colores','Soporte prioritario'],
  choose='Probar 7 días gratis',
  faq_t='Preguntas frecuentes',
  faq=[('¿Qué pasa después de 7 días?','No se cobra nada: no pedimos tarjeta. Elige un plan para continuar; si no, tu cuenta pasa a solo lectura y tus presupuestos siguen disponibles.'),
       ('¿Son fiables los precios de la IA?','La IA usa precios del mercado francés y tu descripción. Es una base: puedes cambiar cada línea e indicar tu propia tarifa.'),
       ('¿Mis presupuestos son conformes?','Sí: número, fecha, validez, identidad de la empresa (SIRET, RCS/RM, IVA), seguro, detalle, totales sin/con IVA, condiciones de pago y firma.'),
       ('¿Puedo cancelar cuando quiera?','Sí, con un clic desde tu cuenta. El plan termina al final del periodo pagado.'),
       ('¿Dónde se guardan mis datos?','En una base segura en Europa. Tus datos y los de tus clientes nunca se venden ni se usan para otra cosa.')],
  f_legal='Aviso legal', f_cgv='Condiciones', f_priv='Privacidad', f_contact='Contacto', rights='Todos los derechos reservados.',
  est_title='Estimación', est_total='Total estimado sin IVA', est_more='Crea tu cuenta para editar este presupuesto, añadir tus datos y enviarlo.', est_cta='Crear mi cuenta gratis',
 ),
 'ar': dict(
  title='ChronoDevis – عروض أسعار للحرفيين في دقيقتين بالذكاء الاصطناعي | برنامج عروض الأسعار في فرنسا',
  desc='برنامج عروض أسعار لكل الحرفيين في فرنسا: الذكاء الاصطناعي يحسب اليد العاملة واللوازم والتنقل من وصف أو صورة. عروض أسعار مطابقة للقانون، صفحة للزبائن، 7 أيام مجاناً بدون بطاقة.',
  nav_feat='المزايا', nav_price='الأسعار', nav_faq='الأسئلة', login='تسجيل الدخول', start='تجربة مجانية',
  badge='لكل الحرف ولكل أشكال المؤسسات في فرنسا',
  h1='عروض أسعارك في <em>دقيقتين</em>، يحسبها الذكاء الاصطناعي',
  lead='صِف الورشة أو التقط صورة: يقدّر ChronoDevis اليد العاملة واللوازم والتنقل، ثم يُنشئ عرض سعر مطابقاً للقانون باسمك. سبّاك، كهربائي، بنّاء، دهّان… مقاول ذاتي أو SARL أو SAS.',
  cta='ابدأ مجاناً – 7 أيام', cta_sub='بدون بطاقة بنكية · بدون التزام',
  demo_t='جرّبه الآن', demo_s='صِف عملاً ما، ويحسب الذكاء الاصطناعي سعره في ثوانٍ.',
  demo_ph='مثال: دهن صالون مساحته 25 م²، الجدران والسقف، مع إصلاح الشقوق',
  demo_btn='احسب', demo_photo='أضف صورة',
  f_t='كل ما تحتاجه لتسعير العروض وإرسالها وتوقيعها أسرع',
  feats=[('sparkles','تسعير بالذكاء الاصطناعي','الساعات، سعر الساعة، اللوازم بكمياتها وأسعارها، التنقل: الذكاء الاصطناعي يقترح وأنت تعدّل.'),
         ('camera','تحليل الصور','صوّر الجهاز أو الورشة: يتعرّف الذكاء الاصطناعي على المعدات وحالتها والصعوبات.'),
         ('file','عروض مطابقة للقانون','ترقيم، المعلومات القانونية الفرنسية، الضريبة (20٪، 10٪، 5.5٪ أو الإعفاء 293 B)، التأمين، خانة الموافقة.'),
         ('link','صفحتك للزبائن','رابط تشاركه: يحصل زبائنك على تقدير ويرسلون طلبهم إليك مباشرة.'),
         ('wrench','كل الحرف','سباكة، كهرباء، بناء، دهان، نجارة، أسقف، بلاط، حدائق وغيرها.'),
         ('building','كل أشكال المؤسسات','مقاول ذاتي، EI، EURL، SARL، SASU، SAS: معلوماتك القانونية ونظام ضريبتك يتكيّفان.'),
         ('phone-app','تطبيق للهاتف','ثبّت ChronoDevis على أندرويد وآيفون واصنع عروضك في الورشة مباشرة.'),
         ('globe','4 لغات','الواجهة بالفرنسية والإنجليزية والإسبانية والعربية. عروض الأسعار تصدر دائماً بالفرنسية وفق القانون الفرنسي.')],
  how_t='كيف يعمل', how=[('1','صِف أو صوّر','بضع كلمات أو صورة للورشة تكفي.'),('2','الذكاء الاصطناعي يسعّر','اليد العاملة واللوازم والتنقل والضريبة في ثوانٍ.'),('3','عدّل وأرسل','عدّل البنود، صدّر PDF واجعل الزبون يوقّع.')],
  p_t='أسعار بسيطة', p_s='7 أيام تجربة مجانية بكل مزايا Pro. بدون بطاقة بنكية.',
  monthly='شهري', yearly='سنوي', save='-20٪', per_month='€ / شهرياً', per_year='€ / سنوياً', billed_year='أي {m} € شهرياً، تُدفع سنوياً', tax_note='أسعار صافية: لا تُطبَّق ضريبة القيمة المضافة (المادة 293 B من قانون الضرائب الفرنسي).',
  ess_n='Essentiel', ess_d='للحرفي الذي يبدأ.', pro_n='Pro', pro_d='لتسعير أكثر وتحويل الزوار إلى زبائن.', popular='الأكثر اختياراً',
  ess_f=['40 تقديراً بالذكاء الاصطناعي شهرياً','عروض أسعار غير محدودة ومطابقة (PDF)','مكتبة أسعارك','صفحتك للزبائن','30 طلباً من الزبائن شهرياً','كل المعلومات القانونية وأنظمة الضريبة'],
  pro_f=['400 تقدير بالذكاء الاصطناعي شهرياً','تحليل الصور بالذكاء الاصطناعي','الإملاء الصوتي في الورشة','لوحة أرقام نشاطك','طلبات زبائن غير محدودة','شعارك وألوانك','دعم ذو أولوية'],
  choose='جرّب 7 أيام مجاناً',
  faq_t='أسئلة شائعة',
  faq=[('ماذا يحدث بعد 7 أيام؟','لا يُقتطع أي مبلغ لأننا لا نطلب بطاقة. تختار باقة لتستمر، وإلا يصبح حسابك للقراءة فقط وتبقى عروضك متاحة.'),
       ('هل أسعار الذكاء الاصطناعي موثوقة؟','يعتمد على أسعار السوق الفرنسية ووصفك. هي نقطة انطلاق: يمكنك تعديل كل بند وتحديد سعر ساعتك.'),
       ('هل عروضي مطابقة للقانون؟','نعم: رقم، تاريخ، مدة الصلاحية، هوية المؤسسة (SIRET، RCS/RM، الضريبة)، التأمين، تفاصيل الأعمال، المجاميع، شروط الدفع وخانة الموافقة.'),
       ('هل يمكنني الإلغاء متى شئت؟','نعم، بضغطة واحدة من حسابك. يتوقف الاشتراك في نهاية الفترة المدفوعة.'),
       ('أين تُحفظ بياناتي؟','في قاعدة بيانات آمنة في أوروبا. بياناتك وبيانات زبائنك لا تُباع ولا تُستعمل لأي غرض آخر.')],
  f_legal='المعلومات القانونية', f_cgv='الشروط', f_priv='الخصوصية', f_contact='اتصل بنا', rights='جميع الحقوق محفوظة.',
  est_title='التقدير', est_total='المجموع التقديري بدون ضريبة', est_more='أنشئ حسابك لتعديل هذا العرض وإضافة معلوماتك وإرساله.', est_cta='أنشئ حسابي المجاني',
 ),
}

e = html.escape

def page(l):
    d = T[l]
    rtl = ' dir="rtl"' if l == 'ar' else ''
    url = SITE + PATH[l]
    alts = '\n'.join(f'<link rel="alternate" hreflang="{x}" href="{SITE}{PATH[x]}">' for x in LANGS) + f'\n<link rel="alternate" hreflang="x-default" href="{SITE}/">'
    app = f'/app/?lang={l}'
    feats = ''.join(f'<div class="card feat"><div class="ic">{svg(i)}</div><h3>{e(a)}</h3><p class="muted small">{e(b)}</p></div>' for i, a, b in d['feats'])
    how = ''.join(f'<div class="card"><div class="pill acc">{n}</div><h3 style="margin-top:10px">{e(a)}</h3><p class="muted small">{e(b)}</p></div>' for n, a, b in d['how'])
    faq = ''.join(f'<details class="faq"><summary>{e(q)}</summary><p class="muted" style="margin:10px 0 0">{e(a)}</p></details>' for q, a in d['faq'])
    def plan(key, best):
        pk = 'ess' if key == 'essentiel' else 'pro'
        feats_ = d[pk + '_f']
        m, y = PRICE[key]['month'], PRICE[key]['year']
        return f'''<div class="card pad-lg price{' best' if best else ''}">
  {f'<span class="pill acc" style="position:absolute;top:-12px;inset-inline-end:20px">{e(d["popular"])}</span>' if best else ''}
  <h3>{e(d[pk+'_n'])}</h3><p class="muted small">{e(d[pk+'_d'])}</p>
  <div><span class="amt" data-m="{m}" data-y="{y}">{m}</span> <span class="muted small per" data-m="{e(d['per_month'])}" data-y="{e(d['per_year'])}">{e(d['per_month'])}</span></div>
  <div class="xs muted yr hidden">{e(d['billed_year'].replace('{m}', str(round(y/12))))}</div>
  <ul>{''.join(f'<li>{e(x)}</li>' for x in feats_)}</ul>
  <a class="btn {'btn-p' if best else 'btn-d'} btn-block" href="{app}&signup=1&plan={key}">{e(d['choose'])}</a></div>'''
    ld = [{"@context": "https://schema.org", "@type": "SoftwareApplication", "name": "ChronoDevis", "applicationCategory": "BusinessApplication",
           "operatingSystem": "Web, Android, iOS", "inLanguage": l, "url": url, "description": d['desc'],
           "offers": [{"@type": "Offer", "name": "Essentiel", "price": "19.00", "priceCurrency": "EUR"}, {"@type": "Offer", "name": "Pro", "price": "39.00", "priceCurrency": "EUR"}]},
          {"@context": "https://schema.org", "@type": "FAQPage", "inLanguage": l,
           "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in d['faq']]}]
    langsel = ''.join(f'<option value="{PATH[x]}"{" selected" if x == l else ""}>{NAME[x]}</option>' for x in LANGS)
    return f'''<!DOCTYPE html>
<html lang="{l}"{rtl}>
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{e(d['title'])}</title>
<meta name="description" content="{e(d['desc'])}">
<link rel="canonical" href="{url}">
{alts}
<meta name="theme-color" content="#0f172a">
<meta property="og:type" content="website"><meta property="og:site_name" content="ChronoDevis"><meta property="og:locale" content="{OG[l]}">
<meta property="og:title" content="{e(d['title'])}"><meta property="og:description" content="{e(d['desc'])}"><meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/icons/og.png">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" type="image/png" sizes="48x48" href="/icons/favicon-48.png"><link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="ChronoDevis">
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/app.css?v={V}">
{''.join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>' for x in ld)}
</head>
<body>
<header class="top"><div class="wrap">
  <a class="logo" href="{PATH[l]}"><img src="/icons/icon-192.png" alt="">Chrono<b>Devis</b></a>
  <nav class="nav">
    <a class="lnk" href="#features">{e(d['nav_feat'])}</a><a class="lnk" href="#pricing">{e(d['nav_price'])}</a><a class="lnk" href="#faq">{e(d['nav_faq'])}</a>
    <select class="lang" aria-label="Langue" onchange="location.href=this.value">{langsel}</select>
    <a class="btn btn-g btn-sm" href="{app}">{e(d['login'])}</a><a class="btn btn-p btn-sm" href="{app}&signup=1">{e(d['start'])}</a>
  </nav>
</div></header>

<section class="hero"><div class="wrap grid g2" style="align-items:center;gap:40px">
  <div>
    <span class="pill acc"><span class="dot"></span> {e(d['badge'])}</span>
    <h1 style="margin-top:16px">{d['h1']}</h1>
    <p class="lead">{e(d['lead'])}</p>
    <div class="row" style="margin-top:22px"><a class="btn btn-p btn-lg" href="{app}&signup=1">{e(d['cta'])}</a></div>
    <p class="xs muted" style="margin-top:10px">{e(d['cta_sub'])}</p>
  </div>
  <div class="card pad-lg" id="demo">
    <h3>{e(d['demo_t'])}</h3><p class="muted small">{e(d['demo_s'])}</p>
    <textarea class="in" id="demo-text" placeholder="{e(d['demo_ph'])}"></textarea>
    <div id="demo-photo" style="margin:10px 0"></div>
    <button class="btn btn-d btn-block" id="demo-go">{e(d['demo_btn'])}</button>
    <div id="demo-out" style="margin-top:14px"></div>
  </div>
</div></section>

<section class="sec" id="features"><div class="wrap">
  <h2 class="center">{e(d['f_t'])}</h2>
  <div class="grid g4" style="margin-top:28px">{feats}</div>
</div></section>

<section class="sec" style="background:#fff"><div class="wrap">
  <h2 class="center">{e(d['how_t'])}</h2>
  <div class="grid g3" style="margin-top:28px">{how}</div>
</div></section>

<section class="sec" id="pricing"><div class="wrap">
  <h2 class="center">{e(d['p_t'])}</h2><p class="center muted">{e(d['p_s'])}</p>
  <div class="center" style="margin:18px 0 28px"><div class="tog" id="tog"><button class="on" data-i="m">{e(d['monthly'])}</button><button data-i="y">{e(d['yearly'])} <span class="pill ok">{e(d['save'])}</span></button></div></div>
  <div class="grid g2 narrow" style="margin:0 auto">{plan('essentiel', False)}{plan('pro', True)}</div>
  <p class="xs muted center" style="margin-top:14px">{e(d['tax_note'])}</p>
</div></section>

<section class="sec" id="faq"><div class="wrap narrow">
  <h2 class="center">{e(d['faq_t'])}</h2><div style="margin-top:24px">{faq}</div>
</div></section>

<footer class="foot"><div class="wrap row between">
  <div>© 2026 ChronoDevis. {e(d['rights'])}</div>
  <div class="row"><a href="/legal.html#mentions">{e(d['f_legal'])}</a><a href="/legal.html#cgv">{e(d['f_cgv'])}</a><a href="/legal.html#confidentialite">{e(d['f_priv'])}</a><a href="/legal.html#contact">{e(d['f_contact'])}</a></div>
</div></footer>

<script src="/assets/i18n.js?v=8"></script>
<script src="/assets/core.js?v={V}"></script>
<script>
CD.setLang({json.dumps(l)});
document.getElementById('tog').addEventListener('click', function (ev) {{
  var b = ev.target.closest('button'); if (!b) return;
  this.querySelectorAll('button').forEach(function (x) {{ x.classList.toggle('on', x === b); }});
  var y = b.dataset.i === 'y';
  document.querySelectorAll('.amt').forEach(function (a) {{ a.textContent = y ? a.dataset.y : a.dataset.m; }});
  document.querySelectorAll('.per').forEach(function (a) {{ a.textContent = y ? a.dataset.y : a.dataset.m; }});
  document.querySelectorAll('.yr').forEach(function (a) {{ a.classList.toggle('hidden', !y); }});
}});
(function () {{
  var picker = CD.photoPicker(document.getElementById('demo-photo'), 1);
  var out = document.getElementById('demo-out'), go = document.getElementById('demo-go');
  go.onclick = async function () {{
    var text = document.getElementById('demo-text').value.trim(), photos = picker.get();
    if (text.length < 8 && !photos.length) {{ CD.toast(CD.T('err.describe')); return; }}
    go.disabled = true; go.innerHTML = '<span class="spin"></span> ' + CD.T('analyzing');
    out.innerHTML = '';
    try {{
      var est = await CD.api('analyze-devis', {{ description: text, images: photos, lang: CD.lang }});
      if (est.outOfScope) {{ out.append(CD.el('div', {{ class: 'alert info', text: est.message }})); return; }}
      var lines = CD.buildLines(est), t = CD.totals(lines, 0);
      var tb = CD.el('table', {{ class: 'tbl' }});
      lines.forEach(function (l) {{ tb.append(CD.el('tr', {{}}, CD.el('td', {{ text: l.label }}), CD.el('td', {{ class: 'r', text: l.qty + ' ' + l.unit }}), CD.el('td', {{ class: 'r', text: CD.eur(l.qty * l.unitPrice) }}))); }});
      out.append(CD.el('div', {{ class: 'est-head' }}, CD.el('div', {{ class: 'k', text: {json.dumps(d['est_title'])} }}), CD.el('h3', {{ text: est.title, style: 'margin:4px 0 0' }})),
        CD.el('div', {{ class: 'est-body' }}, CD.el('p', {{ class: 'small muted', text: est.summary }}), tb,
          CD.el('div', {{ class: 'sum-row tot' }}, CD.el('span', {{ text: {json.dumps(d['est_total'])} }}), CD.el('span', {{ text: CD.eur(t.ht) }})),
          CD.el('p', {{ class: 'small muted', text: {json.dumps(d['est_more'])} }}),
          CD.el('a', {{ class: 'btn btn-p btn-block', href: {json.dumps(app + '&signup=1')}, text: {json.dumps(d['est_cta'])} }})));
    }} catch (e) {{
      out.append(CD.el('div', {{ class: 'alert err' }}, e.message, e.code === 'demo_limit' ? CD.el('div', {{}}, CD.el('a', {{ href: {json.dumps(app + '&signup=1')}, text: {json.dumps(d['est_cta'])} }})) : ''));
    }} finally {{ go.disabled = false; go.textContent = {json.dumps(d['demo_btn'])}; }}
  }};
}})();
CD.installBanner();
</script>
</body>
</html>
'''

if __name__ == '__main__':
    for l in LANGS:
        out = os.path.join(ROOT, 'index.html' if l == 'fr' else os.path.join(l, 'index.html'))
        os.makedirs(os.path.dirname(out), exist_ok=True)
        open(out, 'w', encoding='utf-8').write(page(l))
    sm = ''.join(f'<url><loc>{SITE}{PATH[l]}</loc>' + ''.join(f'<xhtml:link rel="alternate" hreflang="{x}" href="{SITE}{PATH[x]}"/>' for x in LANGS) + '</url>' for l in LANGS)
    open(os.path.join(ROOT, 'sitemap.xml'), 'w').write('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' + sm + '</urlset>')
    open(os.path.join(ROOT, 'robots.txt'), 'w').write('User-agent: *\nAllow: /\nDisallow: /app/\nDisallow: /api/\nSitemap: ' + SITE + '/sitemap.xml\n')
    print('ok')
