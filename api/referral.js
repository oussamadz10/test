// POST /api/referral – programme de parrainage de l'artisan connecté :
// son code, son lien, le nombre d'artisans invités et de mois gagnés.
'use strict';
const S = require('../lib/server');
const { MAX_MONTHS } = require('../lib/referral');

module.exports = async (req, res) => {
    if (req.method !== 'POST') return S.send(res, 405, { error: 'Méthode non autorisée' });
    try {
        const user = await S.getUser(req);
        if (!user) return S.send(res, 401, { error: 'Session expirée, reconnectez-vous.' });
        const p = await S.getProfile(user.id);
        if (!p || !p.ref_code) return S.send(res, 404, { error: 'Parrainage indisponible.' });
        // Rattachement après une inscription Google / Apple (le code ne peut pas passer par les métadonnées)
        const b = await S.readJson(req);
        if (b.action === 'claim') {
            const code = String(b.code || '').toUpperCase().slice(0, 12);
            if (p.referred_by || !/^[A-Z0-9]{4,12}$/.test(code) || code === p.ref_code) return S.send(res, 200, { ok: false });
            if (Date.now() - new Date(p.created_at).getTime() > 864e5) return S.send(res, 200, { ok: false });
            const par = await S.sb('/rest/v1/profiles?ref_code=eq.' + encodeURIComponent(code) + '&select=id');
            if (!par || !par[0] || par[0].id === user.id) return S.send(res, 200, { ok: false });
            await S.sb('/rest/v1/profiles?id=eq.' + encodeURIComponent(user.id) + '&referred_by=is.null', { method: 'PATCH', body: { referred_by: par[0].id } });
            return S.send(res, 200, { ok: true, referred_by: par[0].id });
        }
        const kids = (await S.sb('/rest/v1/profiles?referred_by=eq.' + encodeURIComponent(user.id) + '&select=ref_rewarded_at')) || [];
        const site = S.env('SITE_URL') || 'https://chronodevisia.fr';
        return S.send(res, 200, { code: p.ref_code, link: site + '/?ref=' + p.ref_code, invited: kids.length,
            converted: kids.filter((k) => k.ref_rewarded_at).length, earned: p.ref_earned_months || 0, max: MAX_MONTHS });
    } catch (e) { console.error('[referral] ' + e.message); return S.send(res, 500, { error: 'Erreur, réessayez.' }); }
};
