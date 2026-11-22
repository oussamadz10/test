// ChronoDevis – utilitaires serveur partagés (sans dépendance).
//
// Variables d'environnement (Vercel > Settings > Environment Variables) :
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
//   GEMINI_API_KEY (ou GROQ_API_KEY)
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
//   STRIPE_PRICE_ESSENTIEL_MONTH, STRIPE_PRICE_ESSENTIEL_YEAR, STRIPE_PRICE_PRO_MONTH, STRIPE_PRICE_PRO_YEAR
//   SITE_URL (ex : https://chronodevisia.fr)
'use strict';

const PLANS = {
    trial:     { aiPerMonth: 60,  photos: true,  publicPage: true,  requestsPerMonth: 100 },
    essentiel: { aiPerMonth: 40,  photos: false, publicPage: true,  requestsPerMonth: 30 },
    pro:       { aiPerMonth: 400, photos: true,  publicPage: true,  requestsPerMonth: 1000 }
};

const env = (k) => String(process.env[k] || '').trim();

function send(res, status, body) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(body));
}

function readRaw(req, limit = 6e6) {
    if (typeof req.rawBody === 'string') return Promise.resolve(req.rawBody);
    return new Promise((resolve, reject) => {
        const chunks = []; let size = 0;
        req.on('data', (c) => { size += c.length; if (size > limit) { reject(new Error('Requête trop volumineuse')); req.destroy(); } else chunks.push(c); });
        req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        req.on('error', reject);
    });
}
async function readJson(req) {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
    if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
    try { return JSON.parse((await readRaw(req)) || '{}'); } catch (e) { return {}; }
}

// ---------- Supabase (REST, clé service : contourne la RLS, uniquement côté serveur) ----------
function sbConfigured() { return !!(env('SUPABASE_URL') && env('SUPABASE_SERVICE_ROLE_KEY')); }
async function sb(path, opts = {}) {
    const url = env('SUPABASE_URL').replace(/\/$/, '') + path;
    const key = env('SUPABASE_SERVICE_ROLE_KEY');
    const r = await fetch(url, {
        method: opts.method || 'GET',
        headers: Object.assign({ apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, opts.headers || {}),
        body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    const text = await r.text();
    if (!r.ok) throw Object.assign(new Error('Supabase ' + r.status + ': ' + text.slice(0, 200)), { status: r.status });
    return text ? JSON.parse(text) : null;
}
const enc = encodeURIComponent;
async function getProfile(id) { const rows = await sb('/rest/v1/profiles?id=eq.' + enc(id) + '&select=*'); return rows && rows[0]; }
async function getProfileBySlug(slug) { const rows = await sb('/rest/v1/profiles?slug=eq.' + enc(slug) + '&select=*'); return rows && rows[0]; }
// Bibliothèque de prix (table facultative : absente = liste vide)
async function getCatalog(userId) { try { return (await sb('/rest/v1/catalog?user_id=eq.' + enc(userId) + '&select=label,unit,unit_price&order=updated_at.desc&limit=300')) || []; } catch (e) { return []; } }
async function updateProfile(id, patch) { return sb('/rest/v1/profiles?id=eq.' + enc(id), { method: 'PATCH', body: patch, headers: { Prefer: 'return=minimal' } }); }

// Vérifie le jeton de session envoyé par le navigateur (Authorization: Bearer <access_token>)
async function getUser(req) {
    const h = String(req.headers.authorization || '');
    const token = h.startsWith('Bearer ') ? h.slice(7) : '';
    if (!token || !env('SUPABASE_URL')) return null;
    const r = await fetch(env('SUPABASE_URL').replace(/\/$/, '') + '/auth/v1/user', {
        headers: { apikey: env('SUPABASE_ANON_KEY') || env('SUPABASE_SERVICE_ROLE_KEY'), Authorization: 'Bearer ' + token }
    });
    if (!r.ok) return null;
    return r.json();
}

// État d'accès d'un artisan : essai en cours, abonnement actif, ou bloqué
function access(p) {
    const now = Date.now();
    const paid = ['active', 'past_due'].includes(p.sub_status) && (p.plan === 'essentiel' || p.plan === 'pro');
    if (paid) return { ok: true, plan: p.plan, limits: PLANS[p.plan] };
    const trialEnd = p.trial_ends_at ? Date.parse(p.trial_ends_at) : 0;
    if (trialEnd > now) return { ok: true, plan: 'trial', limits: PLANS.trial, trialDaysLeft: Math.ceil((trialEnd - now) / 864e5) };
    return { ok: false, plan: 'expired', limits: PLANS.essentiel, reason: 'trial_expired' };
}

// Compte une analyse IA ; renvoie false si le quota mensuel est atteint
async function useAiQuota(p, acc) {
    const month = new Date().toISOString().slice(0, 7);
    const used = p.ai_month === month ? (p.ai_used || 0) : 0;
    if (used >= acc.limits.aiPerMonth) return false;
    await updateProfile(p.id, { ai_month: month, ai_used: used + 1 });
    return true;
}

// Limitation simple par IP (mémoire de la fonction)
const hits = new Map();
function rateLimited(req, max, windowMs) {
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    const key = ip + '|' + String(req.url || '').split('?')[0];            // compteur séparé par point d'accès
    const now = Date.now(), arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
    arr.push(now); hits.set(key, arr);
    if (hits.size > 10000) hits.clear();
    return arr.length > max;
}

const str = (v, max) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
const text = (v, max) => String(v == null ? '' : v).trim().slice(0, max);


// Alerte à l'administrateur (signalements, SIRET déjà utilisé…) – Resend si configuré, sinon FormSubmit
async function mailAdmin(subject, rows, site) { return mailTo(env('ADMIN_EMAIL') || 'contact@chronodevisia.fr', subject, rows, site); }
// Email simple (tableau clé/valeur + lien éventuel) – Resend si configuré, sinon FormSubmit
async function mailTo(to, subject, rows, site, intro) {
    if (!to) return;
    const esc = (v) => String(v == null ? '' : v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const html = (intro ? '<p style="font-family:sans-serif;font-size:14px">' + intro + '</p>' : '') + '<table style="font-family:sans-serif;font-size:14px">' + rows.map(([k, v]) => '<tr><td style="padding:4px 12px;color:#64748b">' + esc(k) + '</td><td style="padding:4px 12px;white-space:pre-line">' + esc(v) + '</td></tr>').join('') + '</table>';
    try {
        let x;
        if (env('RESEND_API_KEY')) x = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + env('RESEND_API_KEY') }, body: JSON.stringify({ from: env('RESEND_FROM') || 'ChronoDevis <onboarding@resend.dev>', to: [to], subject, html }) });
        else x = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(to), { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', Origin: site, Referer: site + '/' }, body: JSON.stringify(Object.assign({ _subject: subject, _template: 'table', _captcha: 'false' }, Object.fromEntries(rows))) });
        if (!x.ok) console.warn('[admin-mail] ' + x.status);
    } catch (e) { console.warn('[admin-mail] ' + e.message); }
}
const clientIp = (req) => String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
const siteOf = (req) => 'https://' + String(req.headers['x-forwarded-host'] || req.headers.host || 'chronodevisia.fr');

module.exports = { mailAdmin, mailTo, clientIp, siteOf, PLANS, env, send, readRaw, readJson, sb, sbConfigured, getProfile, getProfileBySlug, getCatalog, updateProfile, getUser, access, useAiQuota, rateLimited, str, text };
