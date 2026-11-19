// POST /api/stripe-webhook – Stripe prévient le site des paiements et changements d'abonnement.
// Dans Stripe > Développeurs > Webhooks, ajoutez l'URL https://VOTRE-DOMAINE/api/stripe-webhook avec les événements :
//   checkout.session.completed, customer.subscription.created, customer.subscription.updated, customer.subscription.deleted
'use strict';
const crypto = require('crypto');
const S = require('../lib/server');

function verify(raw, header, secret) {
    const parts = Object.fromEntries(String(header || '').split(',').map((kv) => kv.split('=')));
    const sigs = String(header || '').split(',').filter((kv) => kv.startsWith('v1=')).map((kv) => kv.slice(3));
    const t = Number(parts.t);
    if (!t || !sigs.length || Math.abs(Date.now() / 1000 - t) > 600) return false;
    const expected = crypto.createHmac('sha256', secret).update(t + '.' + raw).digest('hex');
    return sigs.some((s) => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}

function planFromPrice(priceId) {
    const map = {
        [S.env('STRIPE_PRICE_ESSENTIEL_MONTH')]: ['essentiel', 'month'], [S.env('STRIPE_PRICE_ESSENTIEL_YEAR')]: ['essentiel', 'year'],
        [S.env('STRIPE_PRICE_PRO_MONTH')]: ['pro', 'month'], [S.env('STRIPE_PRICE_PRO_YEAR')]: ['pro', 'year']
    };
    delete map[''];
    return map[priceId] || null;
}

async function applySubscription(sub) {
    const item = sub.items && sub.items.data && sub.items.data[0];
    const pi = item && item.price;
    const found = planFromPrice(pi && pi.id) || [sub.metadata && sub.metadata.plan === 'pro' ? 'pro' : 'essentiel', (pi && pi.recurring && pi.recurring.interval) || 'month'];
    const end = sub.current_period_end || (item && item.current_period_end);
    const status = ['active', 'trialing'].includes(sub.status) ? 'active' : sub.status === 'past_due' ? 'past_due' : 'canceled';
    const patch = {
        plan: status === 'canceled' ? 'trial' : found[0], billing_interval: found[1], sub_status: status,
        stripe_subscription_id: sub.id, current_period_end: end ? new Date(end * 1000).toISOString() : null
    };
    const userId = sub.metadata && sub.metadata.user_id;
    const q = userId ? 'id=eq.' + encodeURIComponent(userId) : 'stripe_customer_id=eq.' + encodeURIComponent(sub.customer);
    await S.sb('/rest/v1/profiles?' + q, { method: 'PATCH', body: patch, headers: { Prefer: 'return=minimal' } });
    console.log('[stripe] ' + (userId || sub.customer) + ' → ' + patch.plan + '/' + patch.sub_status);
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') return S.send(res, 405, { error: 'Méthode non autorisée' });
    try {
        const raw = await S.readRaw(req, 1e6);
        if (!verify(raw, req.headers['stripe-signature'], S.env('STRIPE_WEBHOOK_SECRET'))) return S.send(res, 400, { error: 'Signature invalide' });
        const ev = JSON.parse(raw);
        const o = ev.data && ev.data.object;
        if (ev.type === 'checkout.session.completed' && o.mode === 'subscription' && o.subscription) {
            const r = await fetch('https://api.stripe.com/v1/subscriptions/' + o.subscription, { headers: { Authorization: 'Bearer ' + S.env('STRIPE_SECRET_KEY') } });
            const sub = await r.json();
            sub.metadata = Object.assign({ user_id: o.client_reference_id }, sub.metadata || {});
            await applySubscription(sub);
        } else if (/^customer\.subscription\.(created|updated|deleted)$/.test(ev.type)) {
            await applySubscription(o);
        }
        return S.send(res, 200, { received: true });
    } catch (e) { console.error('[stripe-webhook] ' + e.message); return S.send(res, 500, { error: 'Erreur' }); }
};

module.exports.config = { api: { bodyParser: false } };
