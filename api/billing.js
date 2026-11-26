// POST /api/billing – abonnement Stripe de l'artisan connecté.
//   { action: 'checkout', plan: 'essentiel' | 'pro', interval: 'month' | 'year' } → URL de paiement Stripe
//   { action: 'portal' } → URL de l'espace client Stripe (factures, carte, résiliation)
//   { action: 'status' } → formule, essai, quota
// Offre de lancement : STRIPE_COUPON_LAUNCH = identifiant d'un bon de réduction Stripe (ex. LANCEMENT50),
// appliqué automatiquement au premier abonnement.
'use strict';
const S = require('../lib/server');
const { stripe, ensureCustomer } = require('../lib/stripe');

const PRICE_ENV = {
    'essentiel:month': 'STRIPE_PRICE_ESSENTIEL_MONTH', 'essentiel:year': 'STRIPE_PRICE_ESSENTIEL_YEAR',
    'pro:month': 'STRIPE_PRICE_PRO_MONTH', 'pro:year': 'STRIPE_PRICE_PRO_YEAR'
};

module.exports = async (req, res) => {
    if (req.method !== 'POST') return S.send(res, 405, { error: 'Méthode non autorisée' });
    try {
        const user = await S.getUser(req);
        if (!user) return S.send(res, 401, { error: 'Session expirée, reconnectez-vous.' });
        const p = await S.getProfile(user.id);
        if (!p) return S.send(res, 404, { error: 'Profil introuvable.' });
        const b = await S.readJson(req);
        const site = S.env('SITE_URL') || 'https://' + (req.headers['x-forwarded-host'] || req.headers.host);

        if (b.action === 'status') {
            const acc = S.access(p);
            const month = new Date().toISOString().slice(0, 7);
            return S.send(res, 200, { plan: p.plan, sub_status: p.sub_status, access: acc, trial_ends_at: p.trial_ends_at, current_period_end: p.current_period_end,
                ai_used: p.ai_month === month ? p.ai_used : 0, billing_interval: p.billing_interval, stripe: !!S.env('STRIPE_SECRET_KEY'), launch: !!S.env('STRIPE_COUPON_LAUNCH') && !p.stripe_subscription_id });
        }
        if (!S.env('STRIPE_SECRET_KEY')) return S.send(res, 503, { error: 'Le paiement en ligne n\'est pas encore activé.' });

        if (!p.email) p.email = user.email;
        const customer = await ensureCustomer(p);

        if (b.action === 'portal') {
            const s = await stripe('/billing_portal/sessions', { customer, return_url: site + '/app/#billing' });
            return S.send(res, 200, { url: s.url });
        }
        if (b.action === 'checkout') {
            const plan = b.plan === 'pro' ? 'pro' : 'essentiel', interval = b.interval === 'year' ? 'year' : 'month';
            const price = S.env(PRICE_ENV[plan + ':' + interval]);
            if (!price) return S.send(res, 503, { error: 'Tarif non configuré (' + PRICE_ENV[plan + ':' + interval] + ').' });
            if (!/^price_/.test(price)) return S.send(res, 503, { error: PRICE_ENV[plan + ':' + interval] + ' doit contenir l\'identifiant Stripe du tarif (commence par price_), pas le montant.' });
            const coupon = interval === 'month' && !p.stripe_subscription_id && S.env('STRIPE_COUPON_LAUNCH');   // 1er abonnement mensuel uniquement
            const s = await stripe('/checkout/sessions', {
                mode: 'subscription', customer, client_reference_id: user.id,
                line_items: { 0: { price, quantity: 1 } },
                subscription_data: { metadata: { user_id: user.id, plan } }, metadata: { user_id: user.id, plan },
                ...(coupon ? { discounts: { 0: { coupon } } } : { allow_promotion_codes: 'true' }), billing_address_collection: 'required', tax_id_collection: { enabled: 'true' },
                customer_update: { name: 'auto', address: 'auto' }, locale: ['fr', 'en', 'es'].includes(p.lang) ? p.lang : 'auto',
                success_url: site + '/app/?paid=1#billing', cancel_url: site + '/app/#billing'
            });
            return S.send(res, 200, { url: s.url });
        }
        return S.send(res, 400, { error: 'Action inconnue.' });
    } catch (e) { console.error('[billing] ' + e.message); return S.send(res, e.status || 500, { error: e.message }); }
};
