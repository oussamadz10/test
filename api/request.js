// POST /api/request – un client envoie sa demande à un artisan depuis la page client.
// La demande est enregistrée dans la boîte de réception de l'artisan, et l'artisan est prévenu par email
// (Resend si RESEND_API_KEY est défini, sinon FormSubmit – gratuit, activation à confirmer une fois).
'use strict';
const S = require('../lib/server');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function notify(p, r, site) {
    const to = p.contact_email || p.email;
    if (!to) return;
    const total = r.estimate && r.estimate.totalHt ? Number(r.estimate.totalHt).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) + ' HT' : '—';
    const rows = [['Client', r.client_name || '—'], ['Email', r.client_email], ['Téléphone', r.client_phone || '—'], ['Ville / code postal', r.client_city || '—'],
        ['Prestation', (r.estimate && r.estimate.title) || '—'], ['Estimation', total], ['Photos', String(r.photos_count)], ['Description', r.description || '—']];
    const subject = 'Nouvelle demande de devis – ' + ((r.estimate && r.estimate.title) || r.client_name || 'ChronoDevis');
    const html = '<p style="font-family:sans-serif">Nouvelle demande reçue sur votre page ChronoDevis. Retrouvez-la dans votre espace : <a href="' + site + '/app/#requests">' + site + '/app/</a></p>' +
        '<table style="font-family:sans-serif;font-size:14px">' + rows.map(([k, v]) => '<tr><td style="padding:4px 12px;color:#64748b;vertical-align:top">' + esc(k) + '</td><td style="padding:4px 12px;white-space:pre-line">' + esc(v) + '</td></tr>').join('') + '</table>';
    try {
        let x;
        if (S.env('RESEND_API_KEY')) {
            x = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + S.env('RESEND_API_KEY') },
                body: JSON.stringify({ from: S.env('RESEND_FROM') || 'ChronoDevis <onboarding@resend.dev>', to: [to], reply_to: r.client_email, subject, html }) });
        } else {
            x = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(to), { method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', Origin: site, Referer: site + '/' },
                body: JSON.stringify(Object.assign({ _subject: subject, _replyto: r.client_email, _template: 'table', _captcha: 'false' }, Object.fromEntries(rows))) });
        }
        if (!x.ok) console.warn('[request] email ' + x.status + ' ' + (await x.text()).slice(0, 150));
    } catch (e) { console.warn('[request] email : ' + e.message); }
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') return S.send(res, 405, { error: 'Méthode non autorisée' });
    try {
        if (S.rateLimited(req, 8, 3600e3)) return S.send(res, 429, { error: 'Trop de demandes.' });
        const b = await S.readJson(req);
        if (b.website) return S.send(res, 200, { ok: true });                         // piège anti-robot
        const email = S.str(b.email, 120);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return S.send(res, 400, { error: 'Email invalide.' });
        if (b.consent !== true) return S.send(res, 400, { error: 'Consentement requis.' });
        const p = S.sbConfigured() ? await S.getProfileBySlug(S.str(b.slug, 60)) : null;
        if (!p || p.public_page_enabled === false) return S.send(res, 404, { error: 'Page introuvable.' });

        const e = b.estimate && typeof b.estimate === 'object' ? b.estimate : {};
        const row = {
            artisan_id: p.id, client_name: S.str(b.name, 100), client_email: email, client_phone: S.str(b.phone, 30), client_city: S.str(b.city, 80),
            description: S.text(b.description, 2500), photos_count: Math.min(5, Number(b.photosCount) || 0),
            estimate: { title: S.str(e.title, 140), summary: S.str(e.summary, 700), totalHt: Number(e.totalHt) || 0, hours: Number(e.hours) || 0,
                lines: Array.isArray(e.lines) ? e.lines.slice(0, 50) : [], steps: Array.isArray(e.steps) ? e.steps.slice(0, 20).map((s) => S.str(s, 300)) : [],
                photoFindings: Array.isArray(e.photoFindings) ? e.photoFindings.slice(0, 8).map((s) => S.str(s, 300)) : [], investment: S.str(e.investment, 40), kind: b.kind === 'visit' ? 'visit' : 'estimate' }
        };
        const saved = await S.sb('/rest/v1/requests', { method: 'POST', body: row, headers: { Prefer: 'return=representation' } });
        await notify(p, row, S.env('SITE_URL') || 'https://' + (req.headers['x-forwarded-host'] || req.headers.host));
        return S.send(res, 200, { ok: true, id: saved && saved[0] && saved[0].id });
    } catch (e) { console.error('[request] ' + e.message); return S.send(res, 500, { error: 'Envoi impossible, réessayez.' }); }
};
