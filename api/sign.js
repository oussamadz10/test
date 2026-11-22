// /api/sign – acceptation en ligne d'un devis par le client (lien secret envoyé par l'artisan).
//   GET  ?token=…                         → devis + entreprise (pour affichage)
//   POST { token, action:'accept', name, signature, consent:true }   → signature électronique simple
//   POST { token, action:'decline', reason }                         → refus
// Preuves conservées : date, nom saisi, image de signature, IP, empreinte SHA-256 du contenu signé.
'use strict';
const crypto = require('crypto');
const S = require('../lib/server');

const Q_FIELDS = 'id,user_id,number,title,status,data,total_ht,total_ttc,created_at,client_name,client_address,client_email,client_phone,verify_code,signed_at,signed_name,signature,signed_hash,declined_at,decline_reason';
const P_FIELDS = ['company_name', 'legal_form', 'address', 'postal_code', 'city', 'phone', 'contact_email', 'siret', 'rcs_rm', 'vat_regime', 'vat_number', 'logo_url', 'payment_terms', 'insurance', 'mediator', 'siret_verified', 'siret_name', 'accent_color', 'lang'];

const tokenOf = (v) => String(v || '').toLowerCase().replace(/[^a-f0-9]/g, '').slice(0, 64);
const markOf = (p) => { const a = S.access(p); return !p.siret_verified ? 'ENTREPRISE NON VÉRIFIÉE' : (a.plan === 'essentiel' || a.plan === 'pro') ? '' : 'DOCUMENT DE DÉMONSTRATION'; };
const expiredOf = (q) => Date.now() > Date.parse(q.created_at) + ((q.data && q.data.validityDays) || 30) * 864e5 + 864e5;
// Empreinte du contenu engageant (ordre des clés fixe)
function hashOf(q, p) {
    const d = q.data || {};
    const doc = { number: q.number, date: q.created_at, siret: p.siret || '', company: p.company_name || '', client: q.client_name || '', title: q.title || '',
        lines: (d.lines || []).map((l) => [l.label, Number(l.qty), l.unit, Number(l.unitPrice)]), vatRate: d.vatRate, totalHt: Number(q.total_ht), totalTtc: Number(q.total_ttc) };
    return crypto.createHash('sha256').update(JSON.stringify(doc)).digest('hex');
}
async function load(token) {
    if (token.length < 24) return null;
    const q = (await S.sb('/rest/v1/quotes?share_token=eq.' + token + '&select=' + Q_FIELDS + '&limit=1') || [])[0];
    if (!q) return null;
    const p = await S.getProfile(q.user_id);
    return p ? { q, p } : null;
}
const pub = (q) => { const o = Object.assign({}, q); delete o.id; delete o.user_id; return o; };

module.exports = async (req, res) => {
    try {
        if (!S.sbConfigured()) return S.send(res, 503, { error: 'Service non configuré.' });
        if (req.method === 'GET') {
            if (S.rateLimited(req, 120, 3600e3)) return S.send(res, 429, { error: 'Trop de requêtes.' });
            const x = await load(tokenOf(new URL(req.url, 'http://x').searchParams.get('token')));
            if (!x) return S.send(res, 404, { error: 'Lien invalide.', code: 'notfound' });
            res.setHeader('Cache-Control', 'no-store');
            const company = {}; P_FIELDS.forEach((k) => { company[k] = x.p[k]; });
            return S.send(res, 200, { quote: pub(x.q), company, mark: markOf(x.p), expired: !x.q.signed_at && expiredOf(x.q) });
        }
        if (req.method !== 'POST') return S.send(res, 405, { error: 'Méthode non autorisée' });
        if (S.rateLimited(req, 15, 3600e3)) return S.send(res, 429, { error: 'Trop de tentatives.' });
        const b = await S.readJson(req);
        const x = await load(tokenOf(b.token));
        if (!x) return S.send(res, 404, { error: 'Lien invalide.', code: 'notfound' });
        const { q, p } = x;
        if (q.signed_at) return S.send(res, 409, { error: 'Devis déjà signé.', code: 'signed' });
        if (q.declined_at) return S.send(res, 409, { error: 'Devis déjà refusé.', code: 'declined' });
        if (expiredOf(q)) return S.send(res, 410, { error: 'Devis expiré.', code: 'expired' });
        const site = S.siteOf(req), now = new Date().toISOString(), ip = S.clientIp(req);
        const to = p.contact_email || p.email;
        if (b.action === 'decline') {
            const reason = S.text(b.reason, 1000);
            await S.sb('/rest/v1/quotes?id=eq.' + q.id, { method: 'PATCH', body: { declined_at: now, decline_reason: reason, status: 'refused', updated_at: now } });
            await S.mailTo(to, 'Devis ' + q.number + ' refusé par le client', [['Devis', q.number + ' – ' + (q.title || '')], ['Client', q.client_name || '—'], ['Motif', reason || '—']], site,
                'Votre client a refusé le devis en ligne. <a href="' + site + '/app/">Ouvrir ChronoDevis</a>');
            return S.send(res, 200, { ok: true, declined: true });
        }
        if (b.action !== 'accept') return S.send(res, 400, { error: 'Action inconnue.' });
        const name = S.str(b.name, 120);
        const sig = String(b.signature || '');
        if (name.length < 2) return S.send(res, 400, { error: 'Nom requis.', code: 'name' });
        if (b.consent !== true) return S.send(res, 400, { error: 'Consentement requis.', code: 'consent' });
        if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(sig) || sig.length < 400 || sig.length > 300000) return S.send(res, 400, { error: 'Signature manquante.', code: 'signature' });
        const hash = hashOf(q, p);
        await S.sb('/rest/v1/quotes?id=eq.' + q.id, { method: 'PATCH', body: { signed_at: now, signed_name: name, signed_ip: ip, signature: sig, signed_hash: hash, status: 'accepted', updated_at: now } });
        await S.mailTo(to, 'Devis ' + q.number + ' signé par ' + name, [['Devis', q.number + ' – ' + (q.title || '')], ['Montant', Number(q.total_ttc).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })], ['Signé par', name], ['Le', new Date(now).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })]], site,
            'Bonne nouvelle : votre client a accepté et signé le devis en ligne. <a href="' + site + '/app/">Ouvrir ChronoDevis</a>');
        return S.send(res, 200, { ok: true, signedAt: now, hash });
    } catch (e) { console.error('[sign] ' + e.message); return S.send(res, 500, { error: 'Service indisponible, réessayez.' }); }
};
