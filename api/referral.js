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
        const kids = (await S.sb('/rest/v1/profiles?referred_by=eq.' + encodeURIComponent(user.id) + '&select=ref_rewarded_at')) || [];
        const site = S.env('SITE_URL') || 'https://chronodevisia.fr';
        return S.send(res, 200, { code: p.ref_code, link: site + '/?ref=' + p.ref_code, invited: kids.length,
            converted: kids.filter((k) => k.ref_rewarded_at).length, earned: p.ref_earned_months || 0, max: MAX_MONTHS });
    } catch (e) { console.error('[referral] ' + e.message); return S.send(res, 500, { error: 'Erreur, réessayez.' }); }
};
