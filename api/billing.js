// POST /api/billing – abonnement Stripe de l'artisan connecté.
//   { action: 'checkout', plan: 'essentiel' | 'pro', interval: 'month' | 'year' } → URL de paiement Stripe
//   { action: 'portal' } → URL de l'espace client Stripe (factures, carte, résiliation)
//   { action: 'status' } → formule, essai, quota
'use strict';
const S = require('../lib/server');

const PRICE_ENV = {
    'essentiel:month': 'STRIPE_PRICE_ESSENTIEL_MONTH', 'essentiel:year': 'STRIPE_PRICE_ESSENTIEL_YEAR',
    'pro:month': 'STRIPE_PRICE_PRO_MONTH', 'pro:year': 'STRIPE_PRICE_PRO_YEAR'
};

async function stripe(path, params, method = 'POST') {
    const body = new URLSearchParams();
    const add = (k, v) => {
        if (v === undefined || v === null) return;
        if (typeof v === 'object') Object.entries(v).forEach(([kk, vv]) => add(k + '[' + kk + ']', vv));
        else body.append(k, String(v));
    };
    Object.entries(params || {}).forEach(([k, v]) => add(k, v));
    const r = await fetch('https://api.stripe.com/v1' + path + (method === 'GET' && params ? '?' + body : ''), {
        method, headers: { Authorization: 'Bearer ' + S.env('STRIPE_SECRET_KEY'), 'Content-Type': 'application/x-www-form-urlencoded' },
        body: method === 'GET' ? undefined : body
    });
    const j = await r.json();
    if (!r.ok) throw Object.assign(new Error('Stripe : ' + ((j.error && j.error.message) || r.status)), { status: 502 });
    return j;
}

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
                ai_used: p.ai_month === month ? p.ai_used : 0, billing_interval: p.billing_interval, stripe: !!S.env('STRIPE_SECRET_KEY') });
        }
        if (!S.env('STRIPE_SECRET_KEY')) return S.send(res, 503, { error: 'Le paiement en ligne n\'est pas encore activé.' });

        let customer = p.stripe_customer_id;
        if (!customer) {
            const c = await stripe('/customers', { email: user.email, name: p.company_name || undefined, metadata: { user_id: user.id } });
            customer = c.id;
            await S.updateProfile(user.id, { stripe_customer_id: customer });
        }

        if (b.action === 'portal') {
            const s = await stripe('/billing_portal/sessions', { customer, return_url: site + '/app/#billing' });
            return S.send(res, 200, { url: s.url });
        }
        if (b.action === 'checkout') {
            const plan = b.plan === 'pro' ? 'pro' : 'essentiel', interval = b.interval === 'year' ? 'year' : 'month';
            const price = S.env(PRICE_ENV[plan + ':' + interval]);
            if (!price) return S.send(res, 503, { error: 'Tarif non configuré (' + PRICE_ENV[plan + ':' + interval] + ').' });
            const s = await stripe('/checkout/sessions', {
                mode: 'subscription', customer, client_reference_id: user.id,
                line_items: { 0: { price, quantity: 1 } },
                subscription_data: { metadata: { user_id: user.id, plan } }, metadata: { user_id: user.id, plan },
                allow_promotion_codes: 'true', billing_address_collection: 'required', tax_id_collection: { enabled: 'true' },
                customer_update: { name: 'auto', address: 'auto' }, locale: ['fr', 'en', 'es'].includes(p.lang) ? p.lang : 'auto',
                success_url: site + '/app/?paid=1#billing', cancel_url: site + '/app/#billing'
            });
            return S.send(res, 200, { url: s.url });
        }
        return S.send(res, 400, { error: 'Action inconnue.' });
    } catch (e) { console.error('[billing] ' + e.message); return S.send(res, e.status || 500, { error: e.message }); }
};
