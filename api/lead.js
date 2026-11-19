// ChronoDevis AI – transmet une demande client (email débloqué ou demande de visite) à l'artisan.
//
// Variables d'environnement Vercel :
//   LEAD_EMAIL      – adresse qui reçoit les demandes (obligatoire)
//   RESEND_API_KEY  – optionnel : envoi via Resend (sinon FormSubmit, gratuit, sans compte :
//                     la toute première demande déclenche un email d'activation à confirmer une fois)
//   RESEND_FROM     – optionnel : expéditeur Resend vérifié (ex : "ChronoDevis <devis@chronodevisia.fr>")
'use strict';

const hits = new Map();
function limited(ip) {
    const now = Date.now(), arr = (hits.get(ip) || []).filter((t) => now - t < 3600e3);
    arr.push(now); hits.set(ip, arr);
    if (hits.size > 5000) hits.clear();
    return arr.length > 10;
}
const str = (v, max) => String(v == null ? '' : v).trim().slice(0, max);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function readBody(req) {
    if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
    return new Promise((resolve) => {
        let raw = '';
        req.on('data', (c) => { raw += c; if (raw.length > 30000) req.destroy(); });
        req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch (e) { resolve({}); } });
        req.on('error', () => resolve({}));
    });
}

module.exports = async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    if (limited(ip)) return res.status(429).json({ error: 'Trop de demandes.' });

    const b = await readBody(req);
    if (b.website) return res.status(200).json({ ok: true });                 // piège anti-robot
    const email = str(b.email, 120);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ error: 'Email invalide.' });
    if (b.consent !== true) return res.status(400).json({ error: 'Consentement requis.' });

    const to = process.env.LEAD_EMAIL;
    if (!to) { console.warn('[lead] LEAD_EMAIL manquant – demande non transmise pour ' + email); return res.status(200).json({ ok: true, delivered: false }); }

    const kind = b.kind === 'visit' ? 'Demande de visite technique' : 'Nouvelle estimation consultée';
    const rows = [
        ['Type de demande', kind], ['Email', email], ['Téléphone', str(b.phone, 30) || '—'], ['Nom', str(b.name, 80) || '—'],
        ['Code postal / ville', str(b.city, 80) || '—'], ['Prestation', str(b.title, 160)], ['Type', str(b.type, 60)],
        ['Zone', str(b.zone, 60)], ['Gamme', str(b.investment, 40)], ['Date souhaitée', str(b.dates, 80)],
        ['Main d\'œuvre', str(b.labor, 40)], ['Fournitures', str(b.materials, 40)], ['Déplacement', str(b.travel, 40)],
        ['Total HT estimé', str(b.total, 40)], ['Description du client', str(b.description, 2000)]
    ];
    const subject = kind + ' – ' + (str(b.title, 80) || 'ChronoDevis') + ' – ' + (str(b.total, 30) || '');
    const text = rows.map(([k, v]) => k + ' : ' + v).join('\n');
    const html = '<h2 style="font-family:sans-serif">' + esc(kind) + '</h2><table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">' +
        rows.map(([k, v]) => '<tr><td style="padding:6px 12px;color:#64748b;vertical-align:top">' + esc(k) + '</td><td style="padding:6px 12px;white-space:pre-line">' + esc(v) + '</td></tr>').join('') + '</table>';

    try {
        let r;
        if (process.env.RESEND_API_KEY) {
            r = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.RESEND_API_KEY },
                body: JSON.stringify({ from: process.env.RESEND_FROM || 'ChronoDevis <onboarding@resend.dev>', to: [to], reply_to: email, subject, html, text })
            });
        } else {
            const site = 'https://' + (req.headers['x-forwarded-host'] || req.headers.host || 'chronodevisia.fr');
            r = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(to), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', Origin: site, Referer: site + '/' },
                body: JSON.stringify(Object.assign({ _subject: subject, _replyto: email, _template: 'table', _captcha: 'false' }, Object.fromEntries(rows)))
            });
        }
        const out = await r.text();
        if (!r.ok) throw new Error(r.status + ' ' + out.slice(0, 200));
        return res.status(200).json({ ok: true, delivered: true });
    } catch (e) {
        console.error('[lead] envoi échoué : ' + e.message + '\n' + text);
        return res.status(200).json({ ok: true, delivered: false });           // le client n'est jamais bloqué
    }
};
