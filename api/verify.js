// GET /api/verify?code=XXXXXXXXXX – page publique de vérification d'un devis (QR code imprimé sur le document).
// Renvoie uniquement ce qui permet de comparer avec le papier ; le nom du client est masqué.
'use strict';
const S = require('../lib/server');
const mask = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).map((w) => w[0].toUpperCase() + '.').join(' ');

module.exports = async (req, res) => {
    if (req.method !== 'GET') return S.send(res, 405, { error: 'Méthode non autorisée' });
    try {
        if (S.rateLimited(req, 60, 3600e3)) return S.send(res, 429, { error: 'Trop de requêtes.' });
        const code = String(new URL(req.url, 'http://x').searchParams.get('code') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (code.length !== 10) return S.send(res, 404, { found: false });
        const q = (await S.sb('/rest/v1/quotes?verify_code=eq.' + code + '&select=number,title,status,total_ht,total_ttc,created_at,updated_at,client_name,client_city,user_id&limit=1') || [])[0];
        if (!q) return S.send(res, 404, { found: false });
        const p = await S.getProfile(q.user_id);
        if (!p) return S.send(res, 404, { found: false });
        const acc = S.access(p);
        res.setHeader('Cache-Control', 'no-store');
        return S.send(res, 200, {
            found: true, code,
            quote: { number: q.number, title: q.title, status: q.status, totalHt: Number(q.total_ht), totalTtc: Number(q.total_ttc), createdAt: q.created_at, updatedAt: q.updated_at, client: mask(q.client_name), city: q.client_city || '' },
            company: { name: p.company_name || '', siret: p.siret || '', city: p.city || '', verified: !!p.siret_verified, officialName: p.siret_verified ? p.siret_name : null },
            account: acc.plan === 'essentiel' || acc.plan === 'pro' ? 'paid' : acc.plan === 'trial' ? 'trial' : 'inactive'
        });
    } catch (e) { console.error('[verify] ' + e.message); return S.send(res, 500, { error: 'Vérification indisponible.' }); }
};
