// POST /api/account { action: 'delete' } – suppression définitive du compte de l'artisan connecté (RGPD).
'use strict';
const S = require('../lib/server');
module.exports = async (req, res) => {
    if (req.method !== 'POST') return S.send(res, 405, { error: 'Méthode non autorisée' });
    try {
        const user = await S.getUser(req);
        if (!user) return S.send(res, 401, { error: 'Session expirée.' });
        const b = await S.readJson(req);
        if (b.action !== 'delete' || b.confirm !== 'SUPPRIMER') return S.send(res, 400, { error: 'Confirmation manquante.' });
        const p = await S.getProfile(user.id);
        if (p && p.stripe_subscription_id && S.env('STRIPE_SECRET_KEY') && p.sub_status !== 'canceled') {
            await fetch('https://api.stripe.com/v1/subscriptions/' + p.stripe_subscription_id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + S.env('STRIPE_SECRET_KEY') } });
        }
        await S.sb('/auth/v1/admin/users/' + encodeURIComponent(user.id), { method: 'DELETE' });   // profil, devis et demandes supprimés en cascade
        return S.send(res, 200, { ok: true });
    } catch (e) { console.error('[account] ' + e.message); return S.send(res, 500, { error: 'Suppression impossible, contactez le support.' }); }
};
