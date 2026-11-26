// POST /api/siret { siret } – vérifie le SIRET de l'artisan connecté auprès de l'API publique Recherche d'entreprises,
// puis le fige sur son profil. Un même SIRET ne peut être vérifié que sur un seul compte.
'use strict';
const S = require('../lib/server');
const { checkSiret } = require('../lib/siret');
const { tryReward } = require('../lib/referral');

module.exports = async (req, res) => {
    if (req.method !== 'POST') return S.send(res, 405, { error: 'Méthode non autorisée' });
    try {
        const user = await S.getUser(req);
        if (!user) return S.send(res, 401, { error: 'Session expirée.', code: 'auth' });
        if (S.rateLimited(req, 10, 3600e3)) return S.send(res, 429, { error: 'Trop de tentatives.', code: 'busy' });
        const p = await S.getProfile(user.id);
        if (!p) return S.send(res, 404, { error: 'Profil introuvable.', code: 'auth' });
        const b = await S.readJson(req);
        const siret = String(b.siret || '').replace(/\s+/g, '');
        if (p.siret_verified) return S.send(res, p.siret === siret ? 200 : 409, p.siret === siret ? { ok: true, name: p.siret_name } : { error: 'SIRET déjà vérifié.', code: 'locked' });
        const c = await checkSiret(siret);
        if (!c.ok) return S.send(res, c.error === 'unavailable' || c.error === 'busy' ? 503 : 400, { error: c.error, code: c.error });
        if (!c.active) return S.send(res, 400, { error: 'Établissement fermé.', code: 'closed' });
        const taken = await S.sb('/rest/v1/profiles?siret=eq.' + siret + '&siret_verified=is.true&id=neq.' + user.id + '&select=id');
        if (taken && taken.length) {
            S.mailAdmin('ChronoDevis – SIRET déjà utilisé : ' + siret, [['SIRET', siret], ['Entreprise', c.name], ['Compte qui tente', p.email], ['IP', S.clientIp(req)]], S.siteOf(req));
            return S.send(res, 409, { error: 'SIRET déjà utilisé.', code: 'taken' });
        }
        const patch = { siret, siret_verified: true, siret_name: c.name, siret_checked_at: new Date().toISOString() };
        if (!String(p.company_name || '').trim()) patch.company_name = c.name;
        await S.updateProfile(user.id, patch);
        try { await tryReward(user.id, S.siteOf(req)); } catch (e) { console.error('[referral] ' + e.message); }
        return S.send(res, 200, { ok: true, name: c.name, address: c.address, individual: c.individual });
    } catch (e) { console.error('[siret] ' + e.message); return S.send(res, 500, { error: 'Vérification impossible pour le moment.', code: 'unavailable' }); }
};
