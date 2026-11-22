/* ChronoDevis – noyau JS commun : langue, Supabase (sans bibliothèque), photos, calculs, installation. */
(function () {
    'use strict';
    const CD = window.CD = window.CD || {};

    // ---------- langue ----------
    const LANGS = ['fr', 'en', 'es', 'ar'];
    CD.lang = (function () {
        const q = new URLSearchParams(location.search).get('lang');
        let l = q || (function () { try { return localStorage.getItem('cdLang'); } catch (e) { return null; } })() || document.documentElement.lang || (navigator.language || 'fr').slice(0, 2);
        return LANGS.includes(l) ? l : 'fr';
    })();
    CD.setLang = function (l) {
        if (!LANGS.includes(l)) return;
        try { localStorage.setItem('cdLang', l); } catch (e) {}
        CD.lang = l;
        document.documentElement.lang = l;
        document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    };
    CD.T = function (key, vars) {
        const d = (CD.I18N && (CD.I18N[CD.lang] || CD.I18N.fr)) || {};
        let s = d[key] != null ? d[key] : ((CD.I18N && CD.I18N.fr && CD.I18N.fr[key]) != null ? CD.I18N.fr[key] : key);
        if (vars) Object.keys(vars).forEach((k) => { s = s.split('{' + k + '}').join(vars[k]); });
        return s;
    };
    CD.applyI18n = function (root) {
        (root || document).querySelectorAll('[data-t]').forEach((el) => { el.textContent = CD.T(el.dataset.t); });
        (root || document).querySelectorAll('[data-tph]').forEach((el) => { el.placeholder = CD.T(el.dataset.tph); });
    };

    // ---------- petits utilitaires ----------
    CD.$ = (sel, root) => (root || document).querySelector(sel);
    CD.el = function (tag, attrs, ...kids) {
        const e = document.createElement(tag);
        Object.entries(attrs || {}).forEach(([k, v]) => {
            if (v == null || v === false) return;
            if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else if (k === 'html') e.innerHTML = v;
            else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v);
        });
        kids.flat().forEach((c) => { if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c))); });
        return e;
    };
    // ---------- icônes (traits fins, style Lucide) ----------
    CD.ICONS = {"home": "<path d=\"M3 10.5 12 3l9 7.5\"/><path d=\"M5 9.5V21h14V9.5\"/><path d=\"M10 21v-6h4v6\"/>", "plus": "<path d=\"M12 5v14M5 12h14\"/>", "file": "<path d=\"M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z\"/><path d=\"M14 3v5h5M9 13h6M9 17h6\"/>", "inbox": "<path d=\"M22 12h-6l-2 3h-4l-2-3H2\"/><path d=\"M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z\"/>", "link": "<path d=\"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71\"/><path d=\"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71\"/>", "settings": "<path d=\"M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6\"/>", "card": "<rect x=\"2\" y=\"5\" width=\"20\" height=\"14\" rx=\"2\"/><path d=\"M2 10h20M6 15h4\"/>", "sparkles": "<path d=\"M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z\"/><path d=\"M19 15v4M17 17h4\"/>", "x": "<path d=\"M18 6 6 18M6 6l12 12\"/>", "back": "<path d=\"M19 12H5M12 19l-7-7 7-7\"/>", "printer": "<path d=\"M6 9V3h12v6\"/><rect x=\"3\" y=\"9\" width=\"18\" height=\"8\" rx=\"2\"/><path d=\"M6 14h12v7H6z\"/>", "mail": "<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"2\"/><path d=\"m3 7 9 6 9-6\"/>", "pencil": "<path d=\"M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z\"/>", "trash": "<path d=\"M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6\"/>", "phone": "<path d=\"M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z\"/>", "camera": "<path d=\"M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z\"/><circle cx=\"12\" cy=\"13\" r=\"3.5\"/>", "image": "<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"/><circle cx=\"9\" cy=\"9\" r=\"2\"/><path d=\"m21 15-5-5L5 21\"/>", "check": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"m8 12 3 3 5-6\"/>", "wrench": "<path d=\"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z\"/>", "building": "<rect x=\"4\" y=\"2\" width=\"16\" height=\"20\" rx=\"1\"/><path d=\"M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01\"/>", "phone-app": "<rect x=\"6\" y=\"2\" width=\"12\" height=\"20\" rx=\"2\"/><path d=\"M11 18h2\"/>", "globe": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z\"/>"};
    CD.icon = function (name, cls) {
        const s = document.createElement('span'); s.className = 'i' + (cls ? ' ' + cls : ''); s.setAttribute('aria-hidden', 'true');
        s.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (CD.ICONS[name] || '') + '</svg>';
        return s;
    };
    CD.eur = (n) => Number(n || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
    CD.toast = function (msg, ms) {
        const t = CD.el('div', { class: 'toast', role: 'status', text: msg });
        document.body.append(t); setTimeout(() => t.remove(), ms || 3200);
    };
    CD.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    // ---------- configuration et Supabase ----------
    let cfgP = null;
    CD.config = () => cfgP || (cfgP = fetch('/api/config').then((r) => r.json()).catch(() => ({})));
    const SKEY = 'cdSession';
    CD.session = (function () { try { return JSON.parse(localStorage.getItem(SKEY) || 'null'); } catch (e) { return null; } })();
    function saveSession(s) {
        CD.session = s ? { access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at || (Math.floor(Date.now() / 1000) + (s.expires_in || 3600)), user: s.user || (CD.session && CD.session.user) } : null;
        try { s ? localStorage.setItem(SKEY, JSON.stringify(CD.session)) : localStorage.removeItem(SKEY); } catch (e) {}
    }
    async function authFetch(path, body, opts) {
        const c = await CD.config();
        if (!c.supabaseUrl) throw new Error(CD.T('err.notConfigured'));
        const r = await fetch(c.supabaseUrl + '/auth/v1' + path, {
            method: (opts && opts.method) || 'POST',
            headers: Object.assign({ apikey: c.supabaseAnonKey, 'Content-Type': 'application/json' }, (opts && opts.token) ? { Authorization: 'Bearer ' + opts.token } : {}),
            body: body ? JSON.stringify(body) : undefined
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error_description || j.msg || j.message || ('Erreur ' + r.status));
        return j;
    }
    CD.auth = {
        async signUp(email, password, meta) {
            const j = await authFetch('/signup?redirect_to=' + encodeURIComponent(location.origin + '/app/'), { email, password, data: meta || {} });
            if (j.access_token) saveSession(j);
            return j;
        },
        async signIn(email, password) { const j = await authFetch('/token?grant_type=password', { email, password }); saveSession(j); return j; },
        async recover(email) { return authFetch('/recover?redirect_to=' + encodeURIComponent(location.origin + '/app/'), { email }); },
        async updatePassword(password) { return authFetch('/user', { password }, { method: 'PUT', token: await CD.token() }); },
        async signOut() { try { await authFetch('/logout', null, { token: CD.session && CD.session.access_token }); } catch (e) {} saveSession(null); },
        // lien reçu par email (confirmation ou mot de passe oublié) : #access_token=...&refresh_token=...
        fromHash() {
            const h = new URLSearchParams(location.hash.replace(/^#/, ''));
            if (!h.get('access_token')) return h.get('error_description') ? { error: h.get('error_description') } : null;
            saveSession({ access_token: h.get('access_token'), refresh_token: h.get('refresh_token'), expires_in: Number(h.get('expires_in')) || 3600 });
            history.replaceState(null, '', location.pathname + location.search);
            return { type: h.get('type') };
        }
    };
    CD.token = async function () {
        const s = CD.session;
        if (!s) return null;
        if (s.expires_at - 60 > Date.now() / 1000) return s.access_token;
        try { const j = await authFetch('/token?grant_type=refresh_token', { refresh_token: s.refresh_token }); saveSession(j); return j.access_token; }
        catch (e) { saveSession(null); return null; }
    };
    CD.db = async function (path, opts) {
        const c = await CD.config(), tok = await CD.token();
        if (!tok) throw Object.assign(new Error(CD.T('err.session')), { code: 'auth' });
        const r = await fetch(c.supabaseUrl + '/rest/v1' + path, {
            method: (opts && opts.method) || 'GET',
            headers: Object.assign({ apikey: c.supabaseAnonKey, Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' }, (opts && opts.headers) || {}),
            body: opts && opts.body !== undefined ? JSON.stringify(opts.body) : undefined
        });
        const t = await r.text();
        if (r.status === 401) { saveSession(null); throw Object.assign(new Error(CD.T('err.session')), { code: 'auth' }); }
        if (!r.ok) { let m = t; try { const j = JSON.parse(t); m = j.message || j.hint || t; } catch (e) {} throw new Error(m); }
        return t ? JSON.parse(t) : null;
    };
    CD.api = async function (path, body, needAuth) {
        const headers = { 'Content-Type': 'application/json' };
        if (needAuth) { const tok = await CD.token(); if (tok) headers.Authorization = 'Bearer ' + tok; }
        const r = await fetch('/api/' + path, { method: 'POST', headers, body: JSON.stringify(body || {}) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw Object.assign(new Error(j.error || ('Erreur ' + r.status)), { status: r.status, code: j.code });
        return j;
    };

    // ---------- photos (réduites dans le navigateur avant envoi) ----------
    CD.compressImage = function (file, max, quality) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file), img = new Image();
            img.onload = () => {
                const k = Math.min(1, (max || 1280) / Math.max(img.width, img.height));
                const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
                const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
                URL.revokeObjectURL(url); resolve(c.toDataURL('image/jpeg', quality || 0.8));
            };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image')); };
            img.src = url;
        });
    };
    // Zone photos réutilisable : renvoie { get(), clear() }
    CD.photoPicker = function (container, max) {
        let photos = [];
        const list = CD.el('div', { class: 'photos', style: 'margin-top:10px' });
        const add = async (input) => {
            for (const f of Array.from(input.files || [])) {
                if (photos.length >= max) { CD.toast(CD.T('photos.max', { n: max })); break; }
                try { photos.push(await CD.compressImage(f)); } catch (e) { CD.toast(CD.T('photos.bad')); }
            }
            input.value = ''; draw();
        };
        const draw = () => {
            list.innerHTML = '';
            photos.forEach((src, i) => list.append(CD.el('div', { class: 'ph' }, CD.el('img', { src, alt: '' }),
                CD.el('button', { type: 'button', 'aria-label': CD.T('remove'), onclick: () => { photos.splice(i, 1); draw(); } }, CD.icon('x')))));
        };
        const cam = CD.el('label', { class: 'btn btn-l btn-sm upl' }, CD.icon('camera'), CD.T('photos.take'), CD.el('input', { type: 'file', accept: 'image/*', capture: 'environment', onchange: (e) => add(e.target) }));
        const pick = CD.el('label', { class: 'btn btn-l btn-sm upl' }, CD.icon('image'), CD.T('photos.pick'), CD.el('input', { type: 'file', accept: 'image/*', multiple: true, onchange: (e) => add(e.target) }));
        container.append(CD.el('div', { class: 'row' }, cam, pick), list);
        return { get: () => photos.slice(), clear: () => { photos = []; draw(); } };
    };

    // ---------- calcul d'une estimation ----------
    // est : réponse de l'IA ; renvoie les lignes de devis et les totaux
    CD.buildLines = function (est) {
        const L = [];
        if (est.hours > 0) L.push({ kind: 'labor', label: CD.T('line.labor') + (est.trade ? ' – ' + est.trade : ''), qty: est.hours, unit: 'h', unitPrice: est.hourlyRate });
        (est.materials || []).forEach((m) => L.push({ kind: 'material', label: m.label, qty: m.qty, unit: m.unit, unitPrice: m.unitPrice }));
        (est.extras || []).forEach((m) => L.push({ kind: 'extra', label: m.label, qty: m.qty, unit: m.unit, unitPrice: m.unitPrice }));
        if (est.travelCost > 0) L.push({ kind: 'travel', label: CD.T('line.travel'), qty: 1, unit: CD.T('unit.flat'), unitPrice: est.travelCost });
        return L;
    };
    CD.totals = function (lines, vatRate) {
        const ht = Math.round(lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0), 0) * 100) / 100;
        const vat = Math.round(ht * (Number(vatRate) || 0)) / 100;
        const by = (k) => lines.filter((l) => l.kind === k).reduce((s, l) => s + l.qty * l.unitPrice, 0);
        return { ht, vat, ttc: Math.round((ht + vat) * 100) / 100, labor: by('labor'), materials: by('material') + by('extra'), travel: by('travel') };
    };

    // ---------- installation de l'application ----------
    CD.installBanner = function () {
        if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
        if (matchMedia('(display-mode: standalone)').matches || navigator.standalone === true) return;
        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const KEY = 'cdInstallHidden';
        try { if (Date.now() - Number(localStorage.getItem(KEY) || 0) < 7 * 864e5) return; } catch (e) {}
        let deferred = null, bar = null;
        const show = () => {
            if (bar || (!deferred && !isIOS)) return;
            bar = CD.el('div', { class: 'pwa-bar' }, CD.el('img', { src: '/icons/icon-192.png', alt: '' }),
                CD.el('div', { class: 't' }, CD.el('b', { text: CD.T('pwa.title') }), CD.el('small', { text: CD.T('pwa.sub') })),
                CD.el('button', { class: 'btn btn-p btn-sm', text: deferred ? CD.T('pwa.install') : CD.T('pwa.how'), onclick: () => {
                    if (!deferred) return iosHelp();
                    deferred.prompt(); deferred.userChoice.finally(() => { bar && bar.remove(); bar = null; }); deferred = null;
                } }),
                CD.el('button', { class: 'x', 'aria-label': '×', text: '×', onclick: () => { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} bar.remove(); bar = null; } }));
            document.body.append(bar); requestAnimationFrame(() => bar.classList.add('on'));
        };
        const iosHelp = () => {
            const m = CD.el('div', { class: 'modal', onclick: (e) => { if (e.target === m) m.remove(); } },
                CD.el('div', { class: 'box' }, CD.el('h3', { text: CD.T('pwa.iosTitle') }),
                    CD.el('ol', {}, CD.el('li', { text: CD.T('pwa.ios1') }), CD.el('li', { text: CD.T('pwa.ios2') }), CD.el('li', { text: CD.T('pwa.ios3') })),
                    CD.el('button', { class: 'btn btn-p btn-block', text: CD.T('ok'), onclick: () => m.remove() })));
            document.body.append(m);
        };
        addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; setTimeout(show, 3000); });
        addEventListener('appinstalled', () => { bar && bar.remove(); });
        if (isIOS) setTimeout(show, 4000);
    };
})();
