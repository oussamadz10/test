// ChronoDevis – appel minimal à l'API Stripe (sans dépendance)
'use strict';
const S = require('./server');

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

// Client Stripe de l'artisan (créé au besoin)
// Un identifiant créé en mode test n'existe pas en production (et inversement) : on le recrée.
async function ensureCustomer(p) {
    if (p.stripe_customer_id) {
        try { const c = await stripe('/customers/' + encodeURIComponent(p.stripe_customer_id), null, 'GET'); if (!c.deleted) return c.id; }
        catch (e) { if (!/No such customer/i.test(e.message)) throw e; }
        console.log('[stripe] client introuvable, recréé pour ' + p.id);
        await S.updateProfile(p.id, { stripe_customer_id: null, stripe_subscription_id: null });
        p.stripe_customer_id = null; p.stripe_subscription_id = null;
    }
    const c = await stripe('/customers', { email: p.email || undefined, name: p.company_name || undefined, metadata: { user_id: p.id } });
    await S.updateProfile(p.id, { stripe_customer_id: c.id });
    p.stripe_customer_id = c.id;
    return c.id;
}

module.exports = { stripe, ensureCustomer };
