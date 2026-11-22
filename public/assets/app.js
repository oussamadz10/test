/* ChronoDevis – application de l'artisan (une seule page, navigation par #ancre). */
(function () {
    'use strict';
    const { T, el, eur, $, toast } = CD;
    const root = $('#root');
    let P = null;            // profil de l'artisan
    let newRequests = 0;

    const TRADES = ['plombier', 'chauffagiste', 'climaticien', 'electricien', 'macon', 'peintre', 'plaquiste', 'carreleur', 'menuisier', 'charpentier', 'couvreur',
        'facadier', 'serrurier', 'vitrier', 'solier', 'cuisiniste', 'paysagiste', 'terrassier', 'piscine', 'domotique', 'ramoneur', 'demenageur', 'nettoyage', 'multiservices', 'autre'];
    const FORMS = ['micro', 'ei', 'eurl', 'sarl', 'sasu', 'sas', 'sa', 'scop', 'autre'];
    const FORM_LABEL = { micro: 'Micro-entreprise', ei: 'Entreprise individuelle', eurl: 'EURL', sarl: 'SARL', sasu: 'SASU', sas: 'SAS', sa: 'SA', scop: 'SCOP', autre: '—' };

    // ---------- langue ----------
    const langSel = $('#lang');
    CD.setLang(CD.lang); langSel.value = CD.lang; CD.applyI18n();
    langSel.onchange = () => { CD.setLang(langSel.value); CD.applyI18n(); if (P) { CD.db('/profiles?id=eq.' + P.id, { method: 'PATCH', body: { lang: CD.lang } }).catch(() => {}); } route(); };
    $('#logout').onclick = async () => { await CD.auth.signOut(); P = null; location.hash = ''; boot(); };

    // ---------- accès (même logique que le serveur) ----------
    function access(p) {
        const paid = ['active', 'past_due'].includes(p.sub_status) && (p.plan === 'essentiel' || p.plan === 'pro');
        if (paid) return { ok: true, plan: p.plan };
        const left = p.trial_ends_at ? Date.parse(p.trial_ends_at) - Date.now() : 0;
        return left > 0 ? { ok: true, plan: 'trial', days: Math.ceil(left / 864e5) } : { ok: false, plan: 'expired' };
    }
    const isFranchise = () => P.vat_regime === 'franchise';

    // ---------- démarrage ----------
    async function boot() {
        const h = CD.auth.fromHash();
        if (h && h.error) toast(h.error, 6000);
        if (!CD.session) { $('#logout').classList.add('hidden'); return authView(new URLSearchParams(location.search).get('signup') ? 'signup' : 'login'); }
        if (h && h.type === 'recovery') return newPasswordView();
        try {
            const rows = await CD.db('/profiles?select=*');
            P = rows && rows[0];
            if (!P) throw new Error(T('err.profile'));
        } catch (e) {
            if (e.code === 'auth') return authView('login');
            root.innerHTML = ''; root.append(el('div', { class: 'wrap', style: 'padding:30px 20px' }, el('div', { class: 'alert err', text: e.message }))); return;
        }
        $('#logout').classList.remove('hidden');
        if (P.lang && P.lang !== CD.lang && !new URLSearchParams(location.search).get('lang')) { CD.setLang(P.lang); langSel.value = P.lang; CD.applyI18n(); }
        if (!P.company_name) return onboardingView();
        if (new URLSearchParams(location.search).get('paid')) { toast(T('billing.thanks'), 5000); history.replaceState(null, '', '/app/' + location.hash); }
        countRequests();
        route();
    }
    addEventListener('hashchange', () => P && P.company_name && route());

    async function countRequests() {
        try { const r = await CD.db('/requests?select=id&status=eq.new'); newRequests = r.length; const b = $('#badge-req'); if (b) { b.textContent = newRequests; b.classList.toggle('hidden', !newRequests); } } catch (e) {}
    }

    // ---------- coquille ----------
    const NAV = [['home', 'home', 'nav.home'], ['new', 'plus', 'nav.new'], ['quotes', 'file', 'nav.quotes'], ['requests', 'inbox', 'nav.requests'], ['page', 'link', 'nav.page'], ['prices', 'tag', 'nav.prices'], ['settings', 'settings', 'nav.settings'], ['billing', 'card', 'nav.billing']];
    function shell(active, ...content) {
        root.innerHTML = '';
        const side = el('nav', { class: 'side no-print' }, NAV.map(([k, ic, t]) => el('a', { href: '#' + k, class: (active === k ? 'on' : '') + (k === 'prices' || k === 'billing' ? ' m-hide' : '') }, CD.icon(ic), el('span', { class: k === 'settings' || k === 'billing' || k === 'page' || k === 'prices' ? 't2' : '', text: T(t) }),
            k === 'requests' ? el('span', { class: 'badge' + (newRequests ? '' : ' hidden'), id: 'badge-req', text: newRequests }) : null)));
        const main = el('main', { class: 'main' }, accessBanner(), ...content);
        root.append(el('div', { class: 'app-shell' }, side, main));
        scrollTo(0, 0);
        return main;
    }
    function accessBanner() {
        const a = access(P);
        if (a.plan === 'trial') return el('div', { class: 'banner trial no-print' }, el('span', { text: T('trial.left', { n: a.days }) }), el('a', { class: 'btn btn-p btn-sm', href: '#billing', text: T('trial.choose') }));
        if (!a.ok) return el('div', { class: 'banner exp no-print' }, el('span', { text: T('trial.over') }), el('a', { class: 'btn btn-p btn-sm', href: '#billing', text: T('trial.choose') }));
        return null;
    }
    function route() {
        const [view, id] = location.hash.replace(/^#/, '').split('/');
        ({ home: homeView, new: () => editorView(null), quotes: quotesView, quote: () => quoteView(id), edit: () => editQuote(id), requests: requestsView, request: () => requestView(id), page: pageView, prices: pricesView, settings: settingsView, billing: billingView }[view] || homeView)();
    }
    const busy = (btn, on, label) => { btn.disabled = on; if (on) { btn.dataset.h = btn.innerHTML; btn.innerHTML = '<span class="spin"></span> ' + CD.esc(label || ''); } else if (btn.dataset.h != null) btn.innerHTML = btn.dataset.h; else btn.textContent = label || ''; };
    const field = (label, input, hint) => el('div', { class: 'field' }, el('label', { class: 'f', text: label }), input, hint ? el('div', { class: 'hint', text: hint }) : null);
    const input = (val, attrs) => el('input', Object.assign({ class: 'in', value: val == null ? '' : val }, attrs || {}));
    const select = (val, opts) => { const s = el('select', { class: 'in' }, opts.map(([v, l]) => el('option', { value: v, text: l }))); s.value = val == null ? '' : String(val); return s; };
    const isPro = () => ['pro', 'trial'].includes(access(P).plan);

    // ---------- bibliothèque de prix (cache) ----------
    let CAT = null;
    async function loadCatalog(force) {
        if (CAT && !force) return CAT;
        try { CAT = await CD.db('/catalog?select=*&order=label.asc&limit=1000'); CAT.ready = true; } catch (e) { CAT = []; CAT.ready = false; }
        return CAT;
    }
    const normLabel = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
    const findCat = (label) => (CAT || []).find((c) => normLabel(c.label) === normLabel(label));
    const KIND_OF_LINE = { labor: 'labor', material: 'material', extra: 'material' };
    async function saveLineToCatalog(l) {
        await loadCatalog();
        if (!CAT.ready) return toast(T('pr.notReady'), 5000);
        if (!String(l.label || '').trim()) return;
        const body = { label: l.label.trim(), unit: l.unit || 'u', unit_price: Number(l.unitPrice) || 0, kind: KIND_OF_LINE[l.kind] || 'other', updated_at: new Date().toISOString() };
        const ex = findCat(l.label);
        try {
            if (ex) { await CD.db('/catalog?id=eq.' + ex.id, { method: 'PATCH', body }); Object.assign(ex, body); toast(T('pr.updatedLine')); }
            else { const r = await CD.db('/catalog', { method: 'POST', body: Object.assign({ user_id: P.id }, body), headers: { Prefer: 'return=representation' } }); CAT.push(r[0]); toast(T('pr.savedLine')); }
        } catch (e) { toast(e.message); }
    }

    // ---------- connexion / inscription ----------
    function authView(mode) {
        root.innerHTML = '';
        const email = input('', { type: 'email', autocomplete: 'email', required: true }), pass = input('', { type: 'password', autocomplete: mode === 'signup' ? 'new-password' : 'current-password', minlength: 8 });
        const err = el('div'), btn = el('button', { class: 'btn btn-p btn-block', type: 'submit', text: T(mode === 'signup' ? 'auth.create' : mode === 'forgot' ? 'auth.sendLink' : 'auth.login') });
        const consent = el('input', { type: 'checkbox', required: true });
        const form = el('form', { class: 'card pad-lg', style: 'max-width:440px;margin:40px auto', onsubmit: async (ev) => {
            ev.preventDefault(); err.innerHTML = ''; busy(btn, true);
            try {
                if (mode === 'signup') {
                    const j = await CD.auth.signUp(email.value.trim(), pass.value, { lang: CD.lang });
                    if (j.access_token) return boot();
                    form.innerHTML = ''; form.append(el('h2', { text: T('auth.checkTitle') }), el('p', { class: 'muted', text: T('auth.checkText', { email: email.value.trim() }) })); return;
                }
                if (mode === 'forgot') { await CD.auth.recover(email.value.trim()); err.append(el('div', { class: 'alert ok', text: T('auth.linkSent') })); busy(btn, false); return; }
                await CD.auth.signIn(email.value.trim(), pass.value); boot();
            } catch (e) { err.append(el('div', { class: 'alert err', text: /Invalid login/i.test(e.message) ? T('auth.bad') : /confirm/i.test(e.message) ? T('auth.confirmFirst') : e.message })); busy(btn, false); }
        } },
            el('h2', { text: T(mode === 'signup' ? 'auth.signupTitle' : mode === 'forgot' ? 'auth.forgotTitle' : 'auth.loginTitle') }),
            mode === 'signup' ? el('p', { class: 'muted small', text: T('auth.signupSub') }) : null,
            err, field(T('f.email'), email), mode !== 'forgot' ? field(T('f.password'), pass, mode === 'signup' ? T('auth.passHint') : null) : null,
            mode === 'signup' ? el('label', { class: 'chk', style: 'margin-bottom:14px' }, consent, el('span', {}, T('auth.accept') + ' ', el('a', { href: '/legal.html#cgv', target: '_blank', text: T('auth.terms') }))) : null,
            btn,
            el('div', { class: 'row between small', style: 'margin-top:16px' },
                mode !== 'login' ? el('a', { href: '#', text: T('auth.haveAccount'), onclick: (e) => { e.preventDefault(); authView('login'); } }) : el('a', { href: '#', text: T('auth.noAccount'), onclick: (e) => { e.preventDefault(); authView('signup'); } }),
                mode === 'login' ? el('a', { href: '#', text: T('auth.forgot'), onclick: (e) => { e.preventDefault(); authView('forgot'); } }) : null));
        if (mode === 'forgot') pass.required = false;
        root.append(el('div', { class: 'wrap' }, form));
    }
    function newPasswordView() {
        root.innerHTML = '';
        const pass = input('', { type: 'password', minlength: 8, required: true, autocomplete: 'new-password' }), btn = el('button', { class: 'btn btn-p btn-block', text: T('auth.save') }), err = el('div');
        root.append(el('div', { class: 'wrap' }, el('form', { class: 'card pad-lg', style: 'max-width:440px;margin:40px auto', onsubmit: async (e) => {
            e.preventDefault(); busy(btn, true);
            try { await CD.auth.updatePassword(pass.value); toast(T('auth.passChanged')); location.hash = ''; boot(); } catch (x) { err.innerHTML = ''; err.append(el('div', { class: 'alert err', text: x.message })); busy(btn, false); }
        } }, el('h2', { text: T('auth.newPass') }), err, field(T('f.password'), pass, T('auth.passHint')), btn)));
    }

    // ---------- première configuration ----------
    function tradeChips(selected) {
        const set = new Set(selected || []);
        const box = el('div', { class: 'row', style: 'gap:8px' });
        TRADES.forEach((t) => {
            const b = el('button', { type: 'button', class: 'btn btn-sm ' + (set.has(t) ? 'btn-p' : 'btn-l'), text: T('trade.' + t), onclick: () => { set.has(t) ? set.delete(t) : set.add(t); b.className = 'btn btn-sm ' + (set.has(t) ? 'btn-p' : 'btn-l'); } });
            box.append(b);
        });
        box.get = () => Array.from(set);
        return box;
    }
    function onboardingView() {
        root.innerHTML = '';
        const name = input(P.company_name, { required: true }), trades = tradeChips(P.trades), form = select(P.legal_form, FORMS.map((f) => [f, T('form.' + f)]));
        const vat = select(P.vat_regime, [['franchise', T('vat.franchise')], ['assujetti', T('vat.assujetti')]]);
        const siret = input(P.siret, { inputmode: 'numeric', maxlength: 17 }), cp = input(P.postal_code, { inputmode: 'numeric', maxlength: 5 }), city = input(P.city), phone = input(P.phone, { type: 'tel' });
        form.onchange = () => { if (form.value !== 'micro' && vat.value === 'franchise') vat.value = 'assujetti'; };
        const btn = el('button', { class: 'btn btn-p btn-lg btn-block', text: T('onb.go') }), err = el('div');
        root.append(el('div', { class: 'wrap narrow', style: 'padding:30px 16px' }, el('form', { class: 'card pad-lg', onsubmit: async (e) => {
            e.preventDefault(); err.innerHTML = '';
            if (!trades.get().length) { err.append(el('div', { class: 'alert err', text: T('onb.pickTrade') })); return; }
            busy(btn, true);
            const slug = (name.value + '-' + (city.value || '')).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 36) || P.slug;
            const patch = { company_name: name.value.trim(), trades: trades.get(), legal_form: form.value, vat_regime: vat.value, siret: siret.value.trim(), postal_code: cp.value.trim(), city: city.value.trim(), phone: phone.value.trim(), lang: CD.lang };
            try {
                await CD.db('/profiles?id=eq.' + P.id, { method: 'PATCH', body: Object.assign({ slug }, patch) }).catch(() => CD.db('/profiles?id=eq.' + P.id, { method: 'PATCH', body: Object.assign({ slug: slug + '-' + P.id.slice(0, 4) }, patch) }));
                boot();
            } catch (x) { err.append(el('div', { class: 'alert err', text: x.message })); busy(btn, false); }
        } },
            el('h2', { text: T('onb.title') }), el('p', { class: 'muted', text: T('onb.sub') }), err,
            field(T('f.company'), name), field(T('f.trades'), trades),
            el('div', { class: 'grid g2' }, field(T('f.legalForm'), form), field(T('f.vat'), vat)),
            el('div', { class: 'grid g2' }, field('SIRET', siret), field(T('f.phone'), phone)),
            el('div', { class: 'grid g2' }, field(T('f.postal'), cp), field(T('f.city'), city)),
            btn)));
    }

    // ---------- accueil ----------
    async function homeView() {
        const main = shell('home', el('h1', { text: T('home.hello', { name: P.company_name }) }));
        const stats = el('div', { class: 'grid g3', style: 'margin:18px 0' });
        main.append(el('div', { class: 'row', style: 'margin:6px 0 4px' }, el('a', { class: 'btn btn-p btn-lg', href: '#new' }, CD.icon('plus'), T('nav.new')), el('a', { class: 'btn btn-l', href: '#page' }, CD.icon('link'), T('home.share'))), stats);
        const dash = el('div', { class: 'card dash', style: 'margin-bottom:18px' });
        const recent = el('div', { class: 'card' }, el('h3', { text: T('home.recent') }), el('div', { class: 'empty' }, el('span', { class: 'spin dk' })));
        main.append(dash, recent);
        dashboard(dash);
        try {
            const month = new Date().toISOString().slice(0, 7);
            const [qs, rs] = await Promise.all([CD.db('/quotes?select=id,number,title,client_name,total_ht,status,created_at&order=created_at.desc&limit=6'), CD.db('/requests?select=id&status=eq.new')]);
            const lim = { trial: 60, essentiel: 40, pro: 400 }[access(P).plan] || 40;
            [[T('home.statQuotes'), qs.length >= 6 ? '6+' : qs.length], [T('home.statReq'), rs.length], [T('home.statAi'), (P.ai_month === month ? P.ai_used : 0) + ' / ' + lim]]
                .forEach(([k, v]) => stats.append(el('div', { class: 'card' }, el('div', { class: 'muted small', text: k }), el('div', { style: 'font-size:1.8rem;font-weight:800', text: v }))));
            recent.lastChild.remove();
            if (!qs.length) recent.append(el('div', { class: 'empty', text: T('home.noQuotes') }));
            qs.forEach((q) => recent.append(quoteItem(q)));
        } catch (e) { recent.lastChild.replaceWith(el('div', { class: 'alert err', text: e.message })); }
    }
    async function dashboard(box) {
        const head = el('div', { class: 'row between' }, el('h3', { style: 'margin:0' }, CD.icon('chart'), ' ', T('db.title')), el('span', { class: 'muted small', text: T('db.sub') }));
        if (!isPro()) {
            box.classList.add('locked');
            box.append(head, el('p', { class: 'muted', style: 'margin:10px 0 14px', text: T('db.locked') }), el('a', { class: 'btn btn-d btn-sm', href: '#billing' }, CD.icon('lock'), T('db.discover')));
            return;
        }
        box.append(head, el('div', { class: 'empty' }, el('span', { class: 'spin dk' })));
        try {
            const now = new Date(), months = [];
            for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push({ key: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'), label: d.toLocaleDateString(CD.lang, { month: 'short' }), q: 0, s: 0 }); }
            const since = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();
            const [qs, rs] = await Promise.all([CD.db('/quotes?select=total_ttc,status,created_at&created_at=gte.' + since + '&limit=5000'), CD.db('/requests?select=status&created_at=gte.' + since + '&limit=5000')]);
            const byKey = Object.fromEntries(months.map((m) => [m.key, m]));
            let pending = 0, acc = 0, decided = 0;
            qs.forEach((q) => {
                const m = byKey[String(q.created_at).slice(0, 7)], v = Number(q.total_ttc) || 0;
                if (m) { m.q += v; if (q.status === 'accepted') m.s += v; }
                if (q.status === 'sent') pending += v;
                if (q.status === 'accepted') acc++;
                if (['sent', 'accepted', 'refused'].includes(q.status)) decided++;
            });
            const cur = months[months.length - 1], won = rs.filter((r) => r.status === 'won').length;
            const kpi = (k, v, sub) => el('div', { class: 'kpi' }, el('div', { class: 'muted small', text: k }), el('div', { class: 'v', text: v }), sub ? el('div', { class: 'xs muted', text: sub }) : null);
            const max = Math.max(1, ...months.map((m) => m.q));
            const bars = el('div', { class: 'bars' }, months.map((m) => el('div', { class: 'bcol', title: m.label + ' · ' + T('db.legendQuoted') + ' ' + eur(m.q) + ' · ' + T('db.legendSigned') + ' ' + eur(m.s) },
                el('div', { class: 'bstack' }, el('div', { class: 'b q', style: 'height:' + Math.round(m.q / max * 100) + '%' }), el('div', { class: 'b s', style: 'height:' + Math.round(m.s / max * 100) + '%' })),
                el('div', { class: 'xs muted', text: m.label }))));
            box.lastChild.remove();
            box.append(el('div', { class: 'kpis' },
                kpi(T('db.signed'), eur(cur.s)), kpi(T('db.quoted'), eur(cur.q)), kpi(T('db.pending'), eur(pending)),
                kpi(T('db.rate'), decided ? Math.round(acc / decided * 100) + ' %' : '—'), kpi(T('db.requests'), String(rs.length), won + ' ' + T('db.won'))),
                bars, el('div', { class: 'legend xs muted' }, el('span', { class: 'lg q' }), T('db.legendQuoted'), el('span', { class: 'lg s' }), T('db.legendSigned')),
                decided ? '' : el('p', { class: 'hint', text: T('db.hint') }));
        } catch (e) { box.lastChild.replaceWith(el('div', { class: 'alert err', text: e.message })); }
    }

    // ---------- bibliothèque de prix ----------
    async function pricesView() {
        const list = el('div', { class: 'card' }, el('div', { class: 'empty' }, el('span', { class: 'spin dk' })));
        const q = input('', { placeholder: T('pr.search'), type: 'search' });
        const nl = input('', { placeholder: T('q.label') }), nu = input('u', { style: 'width:80px' }), np = input('', { inputmode: 'decimal', placeholder: '0,00', style: 'width:110px' });
        const kinds = [['material', T('pr.material')], ['labor', T('pr.labor')], ['other', T('pr.other')]];
        const nk = select('material', kinds);
        const add = el('button', { class: 'btn btn-p', type: 'submit' }, CD.icon('plus'), T('pr.add'));
        const form = el('form', { class: 'card prform', style: 'margin-bottom:16px' }, el('div', { class: 'prrow' }, field(T('q.label'), nl), field(T('q.unit'), nu), field(T('q.pu'), np), field(T('pr.kind'), nk), el('div', { class: 'field' }, el('label', { class: 'f', html: '&nbsp;' }), add)));
        const count = el('span', { class: 'muted small' });
        shell('prices', el('h1', { text: T('nav.prices') }), el('p', { class: 'muted', text: T('pr.sub') }), form, el('div', { class: 'row between', style: 'margin-bottom:10px' }, el('div', { style: 'flex:1;max-width:340px' }, q), count), list);
        const cat = await loadCatalog(true);
        if (!cat.ready) { list.innerHTML = ''; list.append(el('div', { class: 'alert info', text: T('pr.notReady') })); form.classList.add('hidden'); return; }
        const num = (v) => Number(String(v).replace(',', '.')) || 0;
        const patch = (c, body) => CD.db('/catalog?id=eq.' + c.id, { method: 'PATCH', body: Object.assign(body, { updated_at: new Date().toISOString() }) }).then(() => { Object.assign(c, body); toast(T('saved')); }).catch((e) => toast(e.message));
        function draw() {
            list.innerHTML = '';
            const f = normLabel(q.value);
            const rows = CAT.filter((c) => !f || normLabel(c.label).includes(f));
            count.textContent = T('pr.count', { n: CAT.length });
            if (!rows.length) { list.append(el('div', { class: 'empty', text: T('pr.none') })); return; }
            rows.forEach((c) => {
                const k = select(c.kind, kinds); k.onchange = () => patch(c, { kind: k.value });
                list.append(el('div', { class: 'prrow item' },
                    el('input', { class: 'in', value: c.label, onchange: (e) => e.target.value.trim() && patch(c, { label: e.target.value.trim() }) }),
                    el('input', { class: 'in', value: c.unit, style: 'width:80px', onchange: (e) => patch(c, { unit: e.target.value.trim() || 'u' }) }),
                    el('input', { class: 'in', value: Number(c.unit_price), inputmode: 'decimal', style: 'width:110px', onchange: (e) => patch(c, { unit_price: num(e.target.value) }) }),
                    k,
                    el('button', { class: 'btn btn-g btn-sm', type: 'button', title: T('pr.delete'), 'aria-label': T('pr.delete'), onclick: async () => {
                        try { await CD.db('/catalog?id=eq.' + c.id, { method: 'DELETE' }); CAT.splice(CAT.indexOf(c), 1); draw(); } catch (e) { toast(e.message); }
                    } }, CD.icon('trash'))));
            });
        }
        q.oninput = draw;
        form.onsubmit = async (e) => {
            e.preventDefault();
            if (!nl.value.trim()) return nl.focus();
            busy(add, true);
            try {
                const body = { user_id: P.id, label: nl.value.trim(), unit: nu.value.trim() || 'u', unit_price: num(np.value), kind: nk.value };
                const ex = findCat(body.label);
                if (ex) await patch(ex, { unit: body.unit, unit_price: body.unit_price, kind: body.kind });
                else { const r = await CD.db('/catalog', { method: 'POST', body, headers: { Prefer: 'return=representation' } }); CAT.push(r[0]); CAT.sort((a, b) => a.label.localeCompare(b.label)); }
                nl.value = ''; np.value = ''; nl.focus(); draw();
            } catch (x) { toast(x.message); }
            busy(add, false);
        };
        draw();
    }

    const STATUS = { draft: '', sent: 'acc', accepted: 'ok', refused: 'bad' };
    function quoteItem(q) {
        return el('div', { class: 'list-item', onclick: () => { location.hash = 'quote/' + q.id; } },
            el('div', {}, el('div', { style: 'font-weight:700', text: (q.number || '') + ' · ' + (q.title || T('q.untitled')) }), el('div', { class: 'small muted', text: (q.client_name || '—') + ' · ' + new Date(q.created_at).toLocaleDateString() })),
            el('div', { class: 'row' }, el('span', { class: 'pill ' + (STATUS[q.status] || ''), text: T('status.' + q.status) }), el('b', { text: eur(q.total_ht) })));
    }

    // ---------- création / modification d'un devis ----------
    function editorView(existing, prefill) {
        const ex = existing || {}, d = ex.data || {};
        const main = shell(existing ? 'quotes' : 'new', el('h1', { text: existing ? T('q.edit') + ' ' + (ex.number || '') : T('nav.new') }));
        const a = access(P);
        // client
        const cName = input(ex.client_name || (prefill && prefill.client_name)), cEmail = input(ex.client_email || (prefill && prefill.client_email), { type: 'email' }),
            cPhone = input(ex.client_phone || (prefill && prefill.client_phone), { type: 'tel' }), cAddr = input(ex.client_address || (prefill && prefill.client_city));
        main.append(el('div', { class: 'card', style: 'margin-bottom:16px' }, el('h3', { text: T('q.client') }),
            el('div', { class: 'grid g2' }, field(T('f.clientName'), cName), field(T('f.email'), cEmail), field(T('f.phone'), cPhone), field(T('f.clientAddress'), cAddr))));
        // IA
        const desc = el('textarea', { class: 'in', placeholder: T('q.descPh') }); desc.value = (prefill && prefill.description) || '';
        const type = select('reno', [['reno', T('q.reno')], ['neuf', T('q.neuf')], ['depannage', T('q.depannage')]]);
        const gamme = select('Standard', [['Standard', T('q.std')], ['Haut de gamme', T('q.premium')]]);
        const site = input(prefill && prefill.client_city, { placeholder: T('q.sitePh') });
        const photoBox = el('div');
        const picker = CD.photoPicker(photoBox, 5);
        const aiBtn = el('button', { class: 'btn btn-d', type: 'button' }, CD.icon('sparkles'), T('q.analyze')), aiMsg = el('div');
        // dictée vocale (Pro)
        const micHint = el('div', { class: 'hint hidden', text: T('mic.listening') });
        const micBtn = el('button', { class: 'btn btn-l btn-sm mic', type: 'button' });
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        let rec = null;
        const micIdle = () => { micBtn.classList.remove('on'); micBtn.innerHTML = ''; micBtn.append(CD.icon(isPro() ? 'mic' : 'lock'), T('mic.start')); micHint.classList.add('hidden'); rec = null; };
        micIdle();
        micBtn.onclick = () => {
            if (!isPro()) return toast(T('mic.pro'), 4500);
            if (!SR) return toast(T('mic.unsupported'), 6000);
            if (rec) { rec.stop(); return; }
            rec = new SR();
            rec.lang = { fr: 'fr-FR', en: 'en-GB', es: 'es-ES', ar: 'ar-SA' }[CD.lang] || 'fr-FR';
            rec.continuous = true; rec.interimResults = true;
            const base = desc.value ? desc.value.replace(/\s*$/, ' ') : '';
            rec.onresult = (ev) => { let txt = ''; for (let i = 0; i < ev.results.length; i++) txt += ev.results[i][0].transcript; desc.value = base + txt.trim(); };
            rec.onerror = (ev) => { if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') toast(T('mic.denied'), 6000); };
            rec.onend = micIdle;
            try { rec.start(); micBtn.classList.add('on'); micBtn.innerHTML = ''; micBtn.append(CD.icon('stop'), T('mic.stop')); micHint.classList.remove('hidden'); }
            catch (e) { micIdle(); toast(e.message); }
        };
        addEventListener('hashchange', () => { if (rec) rec.stop(); }, { once: true });
        const aiCard = el('div', { class: 'card', style: 'margin-bottom:16px' }, el('h3', { text: T('q.aiTitle') }), el('p', { class: 'muted small', text: T('q.aiSub') }),
            el('div', { class: 'field' }, el('div', { class: 'row between', style: 'margin-bottom:6px' }, el('label', { class: 'f', style: 'margin:0', text: T('q.desc') }), micBtn), desc, micHint), el('div', { class: 'grid g3' }, field(T('q.type'), type), field(T('q.range'), gamme), field(T('q.site'), site)),
            el('div', { class: 'field' }, el('label', { class: 'f', text: T('q.photos') }), a.plan === 'essentiel' ? el('div', { class: 'hint', text: T('q.photosPro') }) : photoBox),
            aiMsg, aiBtn);
        if (!existing) main.append(aiCard);
        // lignes
        let lines = (d.lines || (prefill && prefill.lines) || []).map((l) => Object.assign({}, l));
        let info = { summary: d.summary || (prefill && prefill.summary) || '', steps: d.steps || (prefill && prefill.steps) || [], assumptions: d.assumptions || [], photoFindings: d.photoFindings || (prefill && prefill.photoFindings) || [] };
        const title = input(ex.title || (prefill && prefill.title), { placeholder: T('q.titlePh') });
        const vatSel = select(String(d.vatRate != null ? d.vatRate : (isFranchise() ? 0 : P.default_vat_rate || 20)), isFranchise() ? [['0', T('vat.none')]] : [['20', '20 %'], ['10', '10 %'], ['5.5', '5,5 %'], ['0', '0 %']]);
        const validity = input(d.validityDays || P.quote_validity_days || 30, { type: 'number', min: 1, max: 365 });
        const startDate = input(d.startDate || '', { type: 'date' });
        const tbody = el('tbody'), tot = el('div');
        const summaryBox = el('div', { class: 'small muted' });
        const catList = el('datalist', { id: 'cat-list' });
        loadCatalog().then((c) => { c.forEach((x) => catList.append(el('option', { value: x.label }))); });
        function drawLines() {
            tbody.innerHTML = '';
            lines.forEach((l, i) => {
                const upd = (k, isNum) => (e) => { l[k] = isNum ? Number(String(e.target.value).replace(',', '.')) || 0 : e.target.value; if (k === 'unitPrice' && l.fromCatalog) { l.fromCatalog = false; e.target.closest('tr').querySelector('.in').classList.remove('cat-in'); } drawTotals(); };
                const pick = (e) => { const c = findCat(e.target.value); if (c) { l.label = c.label; l.unit = c.unit; l.unitPrice = Number(c.unit_price); l.fromCatalog = true; if (c.kind === 'labor') l.kind = 'labor'; drawLines(); } };
                tbody.append(el('tr', {},
                    el('td', {}, el('input', { class: 'in' + (l.fromCatalog ? ' cat-in' : ''), value: l.label, list: 'cat-list', title: l.fromCatalog ? T('pr.fromLib') : null, oninput: upd('label'), onchange: pick })),
                    el('td', { style: 'width:80px' }, el('input', { class: 'in', value: l.qty, inputmode: 'decimal', oninput: upd('qty', true) })),
                    el('td', { style: 'width:70px' }, el('input', { class: 'in', value: l.unit, oninput: upd('unit') })),
                    el('td', { style: 'width:100px' }, el('input', { class: 'in', value: l.unitPrice, inputmode: 'decimal', oninput: upd('unitPrice', true) })),
                    el('td', { class: 'r', id: 'lt' + i, text: eur(l.qty * l.unitPrice) }),
                    el('td', { class: 'acts' }, el('button', { class: 'btn btn-g btn-sm', type: 'button', title: T('pr.saveLine'), 'aria-label': T('pr.saveLine'), onclick: () => saveLineToCatalog(l) }, CD.icon('bookmark')),
                        el('button', { class: 'btn btn-g btn-sm', type: 'button', 'aria-label': T('remove'), onclick: () => { lines.splice(i, 1); drawLines(); } }, CD.icon('x')))));
            });
            drawTotals();
        }
        function drawTotals() {
            lines.forEach((l, i) => { const c = document.getElementById('lt' + i); if (c) c.textContent = eur(l.qty * l.unitPrice); });
            const t = CD.totals(lines, Number(vatSel.value));
            tot.innerHTML = '';
            tot.append(el('div', { class: 'sum-row' }, el('span', { text: T('t.ht') }), el('b', { text: eur(t.ht) })),
                isFranchise() ? el('div', { class: 'xs muted', text: T('vat.293b') }) : el('div', { class: 'sum-row' }, el('span', { text: T('t.vat') + ' ' + vatSel.value + ' %' }), el('span', { text: eur(t.vat) })),
                el('div', { class: 'sum-row tot' }, el('span', { text: isFranchise() ? T('t.total') : T('t.ttc') }), el('span', { text: eur(isFranchise() ? t.ht : t.ttc) })));
        }
        function drawSummary() {
            summaryBox.innerHTML = '';
            if (info.summary) summaryBox.append(el('p', { text: info.summary }));
            if (info.photoFindings.length) summaryBox.append(el('p', { html: '<b>' + T('q.photoFindings') + '</b>' }), el('ul', {}, info.photoFindings.map((s) => el('li', { text: s }))));
            if (info.assumptions.length) summaryBox.append(el('p', { html: '<b>' + T('q.assumptions') + '</b>' }), el('ul', {}, info.assumptions.map((s) => el('li', { text: s }))));
        }
        vatSel.onchange = drawTotals;
        const addLine = el('button', { class: 'btn btn-l btn-sm', type: 'button', onclick: () => { lines.push({ kind: 'other', label: '', qty: 1, unit: 'u', unitPrice: 0 }); drawLines(); } }, CD.icon('plus'), T('q.addLine'));
        const saveBtn = el('button', { class: 'btn btn-p btn-lg', type: 'button', text: T('q.save') });
        const linesCard = el('div', { class: 'card' + (lines.length || existing ? '' : ' hidden') },
            el('h3', { text: T('q.lines') }), field(T('q.title'), title), summaryBox, catList,
            el('div', { style: 'overflow-x:auto' }, el('table', { class: 'tbl' }, el('thead', {}, el('tr', {}, el('th', { text: T('q.label') }), el('th', { text: T('q.qty') }), el('th', { text: T('q.unit') }), el('th', { text: T('q.pu') }), el('th', { class: 'r', text: T('q.lineTotal') }), el('th'))), tbody)),
            el('div', { style: 'margin:10px 0 16px' }, addLine),
            el('div', { class: 'grid g3' }, field(T('f.vatRate'), vatSel), field(T('q.validity'), validity), field(T('q.start'), startDate)),
            tot, el('div', { class: 'row', style: 'margin-top:16px' }, saveBtn));
        main.append(linesCard);
        if (!existing) main.append(el('div', { class: 'center', style: 'margin-top:12px' }, el('button', { class: 'btn btn-g btn-sm', type: 'button', text: T('q.manual'), onclick: () => { linesCard.classList.remove('hidden'); if (!lines.length) { lines.push({ kind: 'labor', label: T('line.labor'), qty: 1, unit: 'h', unitPrice: Number(P.hourly_rate) || 50 }); drawLines(); } } })));
        drawLines(); drawSummary();

        aiBtn.onclick = async () => {
            aiMsg.innerHTML = '';
            if (desc.value.trim().length < 8 && !picker.get().length) { aiMsg.append(el('div', { class: 'alert err', text: T('err.describe') })); return; }
            busy(aiBtn, true, T('analyzing'));
            try {
                const est = await CD.api('analyze-devis', { description: desc.value.trim(), images: picker.get(), type: type.options[type.selectedIndex].text, investment: gamme.value, site: site.value, lang: CD.lang }, true);
                if (est.outOfScope) { aiMsg.append(el('div', { class: 'alert info', text: est.message })); return; }
                lines = CD.buildLines(est);
                info = { summary: est.summary, steps: est.steps, assumptions: est.assumptions, photoFindings: est.photoFindings };
                if (!title.value) title.value = est.title;
                if (!isFranchise()) vatSel.value = String(est.suggestedVatRate || P.default_vat_rate || 20);
                linesCard.classList.remove('hidden'); drawLines(); drawSummary();
                aiMsg.append(el('div', { class: 'alert ok', text: T('q.aiDone', { n: lines.length }) + (est.catalogUsed ? ' ' + T('pr.used', { n: est.catalogUsed }) : '') }));
                linesCard.scrollIntoView({ behavior: 'smooth' });
            } catch (e) {
                aiMsg.append(el('div', { class: 'alert err' }, e.message, e.status === 402 ? el('div', {}, el('a', { href: '#billing', text: T('trial.choose') })) : null));
            } finally { busy(aiBtn, false, T('q.analyze')); }
        };
        saveBtn.onclick = async () => {
            if (!lines.length) return toast(T('q.noLines'));
            busy(saveBtn, true);
            const t = CD.totals(lines, Number(vatSel.value));
            const row = { client_name: cName.value.trim(), client_email: cEmail.value.trim(), client_phone: cPhone.value.trim(), client_address: cAddr.value.trim(), title: title.value.trim(),
                data: { lines, vatRate: Number(vatSel.value), validityDays: Number(validity.value) || 30, startDate: startDate.value, summary: info.summary, steps: info.steps, assumptions: info.assumptions, photoFindings: info.photoFindings },
                total_ht: t.ht, total_ttc: isFranchise() ? t.ht : t.ttc, updated_at: new Date().toISOString() };
            try {
                let id = ex.id;
                if (id) await CD.db('/quotes?id=eq.' + id, { method: 'PATCH', body: row });
                else {
                    const number = await CD.db('/rpc/next_quote_number', { method: 'POST', body: {} });
                    const saved = await CD.db('/quotes', { method: 'POST', body: Object.assign({ user_id: P.id, number, request_id: prefill && prefill.request_id || null }, row), headers: { Prefer: 'return=representation' } });
                    id = saved[0].id;
                    if (prefill && prefill.request_id) CD.db('/requests?id=eq.' + prefill.request_id, { method: 'PATCH', body: { status: 'quoted' } }).catch(() => {});
                }
                toast(T('q.saved')); location.hash = 'quote/' + id;
            } catch (e) { toast(e.message, 5000); busy(saveBtn, false, T('q.save')); }
        };
    }
    async function editQuote(id) { try { const r = await CD.db('/quotes?id=eq.' + id + '&select=*'); editorView(r[0]); } catch (e) { toast(e.message); } }

    // ---------- liste et affichage des devis ----------
    async function quotesView() {
        const box = el('div', { class: 'card' }, el('div', { class: 'empty' }, el('span', { class: 'spin dk' })));
        shell('quotes', el('div', { class: 'row between' }, el('h1', { text: T('nav.quotes') }), el('a', { class: 'btn btn-p', href: '#new' }, CD.icon('plus'), T('nav.new'))), box);
        try {
            const qs = await CD.db('/quotes?select=id,number,title,client_name,total_ht,status,created_at&order=created_at.desc&limit=200');
            box.innerHTML = '';
            if (!qs.length) box.append(el('div', { class: 'empty', text: T('home.noQuotes') }));
            qs.forEach((q) => box.append(quoteItem(q)));
        } catch (e) { box.innerHTML = ''; box.append(el('div', { class: 'alert err', text: e.message })); }
    }

    // Devis imprimable (toujours en français : document légal en France)
    function devisDoc(q) {
        const d = q.data || {}, lines = d.lines || [], franchise = isFranchise() || Number(d.vatRate) === 0 && P.vat_regime === 'franchise';
        const t = CD.totals(lines, franchise ? 0 : d.vatRate);
        const created = new Date(q.created_at || Date.now());
        const until = new Date(created.getTime() + (d.validityDays || 30) * 864e5);
        const f = (x) => x ? CD.esc(x) : '';
        const co = [f(P.address), [f(P.postal_code), f(P.city)].filter(Boolean).join(' ')].filter(Boolean).join('<br>');
        const ids = [P.siret ? 'SIRET ' + f(P.siret) : '', P.rcs_rm ? f(P.rcs_rm) : '', P.vat_regime === 'assujetti' && P.vat_number ? 'TVA ' + f(P.vat_number) : ''].filter(Boolean).join(' · ');
        const rows = lines.map((l) => `<tr><td>${f(l.label)}</td><td class="r">${l.qty} ${f(l.unit)}</td><td class="r">${eur(l.unitPrice)}</td><td class="r">${eur(l.qty * l.unitPrice)}</td></tr>`).join('');
        const steps = (d.steps || []).length ? `<p style="margin-top:12px"><b>Détail de l'intervention</b></p><ol style="margin:4px 0 0;padding-inline-start:18px">${d.steps.map((s) => '<li>' + f(s) + '</li>').join('')}</ol>` : '';
        const vatRows = franchise ? `<tr><td colspan="2" style="font-size:10.5px">TVA non applicable, art. 293 B du CGI</td></tr>` : `<tr><td>TVA ${String(d.vatRate).replace('.', ',')} %</td><td class="r">${eur(t.vat)}</td></tr>`;
        const reduced = !franchise && (Number(d.vatRate) === 10 || Number(d.vatRate) === 5.5) ? '<p>Taux réduit de TVA applicable sous réserve de la remise par le client de l\'attestation simplifiée prévue à l\'article 279-0 bis du CGI (travaux dans un logement achevé depuis plus de 2 ans).</p>' : '';
        return `<div class="devis">
  <div style="display:flex;justify-content:space-between;gap:20px;align-items:flex-start">
    <div>${P.logo_url ? `<img src="${f(P.logo_url)}" alt="" style="max-height:60px;max-width:180px;margin-bottom:6px"><br>` : ''}<div class="co">${f(P.company_name)}</div>
      <div>${FORM_LABEL[P.legal_form] || ''}</div><div>${co}</div><div>${[f(P.phone), f(P.contact_email)].filter(Boolean).join(' · ')}</div><div style="font-size:11px;color:#555">${ids}</div></div>
    <div style="text-align:end"><h1>DEVIS</h1><div>N° <b>${f(q.number)}</b></div><div>Date : ${created.toLocaleDateString('fr-FR')}</div><div>Valable jusqu'au : ${until.toLocaleDateString('fr-FR')}</div>${d.startDate ? `<div>Début prévu : ${new Date(d.startDate).toLocaleDateString('fr-FR')}</div>` : ''}</div>
  </div>
  <div class="boxes"><div class="bx"><b>Objet</b><br>${f(q.title)}${d.summary ? `<div style="color:#555;margin-top:4px">${f(d.summary)}</div>` : ''}</div>
    <div class="bx"><b>Client</b><br>${f(q.client_name) || '—'}<br>${f(q.client_address)}<br>${[f(q.client_phone), f(q.client_email)].filter(Boolean).join(' · ')}</div></div>
  <table><thead><tr><th>Désignation</th><th class="r">Quantité</th><th class="r">Prix unitaire HT</th><th class="r">Total HT</th></tr></thead><tbody>${rows}</tbody></table>
  <table class="tot"><tr><td>Total HT</td><td class="r">${eur(t.ht)}</td></tr>${vatRows}<tr class="g"><td>${franchise ? 'Net à payer' : 'Total TTC'}</td><td class="r">${eur(franchise ? t.ht : t.ttc)}</td></tr></table>
  ${steps}
  <div class="legal">
    <p><b>Conditions de paiement :</b> ${f(P.payment_terms)}</p>
    <p>Devis gratuit. En cas de retard de paiement, pénalités au taux d'intérêt légal majoré de 10 points ; pour les clients professionnels, indemnité forfaitaire de 40 € pour frais de recouvrement (art. L441-10 du Code de commerce).</p>
    ${reduced}
    ${P.insurance ? `<p><b>Assurance professionnelle :</b> ${f(P.insurance)}</p>` : ''}
    ${P.mediator ? `<p><b>Médiateur de la consommation :</b> ${f(P.mediator)}</p>` : ''}
  </div>
  <div class="sign"><div>L'entreprise</div><div>Le client : date, signature et mention manuscrite « Devis reçu avant l'exécution des travaux, bon pour accord »</div></div>
</div>`;
    }
    async function quoteView(id) {
        const main = shell('quotes', el('div', { class: 'empty' }, el('span', { class: 'spin dk' })));
        try {
            const q = (await CD.db('/quotes?id=eq.' + id + '&select=*'))[0];
            if (!q) throw new Error(T('q.notFound'));
            main.innerHTML = ''; main.append(accessBanner() || '');
            const st = select(q.status || 'draft', ['draft', 'sent', 'accepted', 'refused'].map((s) => [s, T('status.' + s)]));
            st.style.width = 'auto';
            st.onchange = () => CD.db('/quotes?id=eq.' + id, { method: 'PATCH', body: { status: st.value } }).then(() => toast(T('saved'))).catch((e) => toast(e.message));
            const mail = 'mailto:' + encodeURIComponent(q.client_email || '') + '?subject=' + encodeURIComponent('Devis ' + q.number + ' – ' + P.company_name) +
                '&body=' + encodeURIComponent(T('q.mailBody', { name: q.client_name || '', number: q.number, title: q.title, total: eur(q.total_ttc), company: P.company_name }));
            main.append(el('div', { class: 'row between no-print', style: 'margin-bottom:14px' },
                el('a', { class: 'btn btn-g btn-sm', href: '#quotes' }, CD.icon('back', 'flip'), T('nav.quotes')),
                el('div', { class: 'row' }, st,
                    el('button', { class: 'btn btn-p btn-sm', onclick: () => { const o = document.title; document.title = 'Devis ' + q.number; print(); setTimeout(() => { document.title = o; }, 500); } }, CD.icon('printer'), T('q.pdf')),
                    el('a', { class: 'btn btn-l btn-sm', href: mail }, CD.icon('mail'), T('q.send')),
                    el('a', { class: 'btn btn-l btn-sm', href: '#edit/' + id }, CD.icon('pencil'), T('q.editBtn')),
                    el('button', { class: 'btn btn-l btn-sm', onclick: async () => {
                        const number = await CD.db('/rpc/next_quote_number', { method: 'POST', body: {} });
                        const c = Object.assign({}, q); delete c.id; delete c.created_at; c.number = number; c.status = 'draft';
                        const s = await CD.db('/quotes', { method: 'POST', body: c, headers: { Prefer: 'return=representation' } }); location.hash = 'quote/' + s[0].id;
                    } }, CD.icon('copy'), T('q.duplicate')),
                    el('button', { class: 'btn btn-bad btn-sm', 'aria-label': T('q.delete'), onclick: async () => { if (!confirm(T('q.confirmDelete'))) return; await CD.db('/quotes?id=eq.' + id, { method: 'DELETE' }); location.hash = 'quotes'; } }, CD.icon('trash')))),
                (!P.siret || !P.address || !P.insurance) ? el('div', { class: 'alert info no-print' }, T('q.missingInfo') + ' ', el('a', { href: '#settings', text: T('nav.settings') })) : '',
                el('div', { html: devisDoc(q) }));
        } catch (e) { main.innerHTML = ''; main.append(el('div', { class: 'alert err', text: e.message })); }
    }

    // ---------- demandes clients ----------
    async function requestsView() {
        const box = el('div', { class: 'card' }, el('div', { class: 'empty' }, el('span', { class: 'spin dk' })));
        shell('requests', el('h1', { text: T('nav.requests') }), el('p', { class: 'muted', text: T('req.sub') }), box);
        try {
            const rs = await CD.db('/requests?select=*&order=created_at.desc&limit=200');
            box.innerHTML = '';
            if (!rs.length) box.append(el('div', { class: 'empty' }, T('req.none') + ' ', el('a', { href: '#page', text: T('home.share') })));
            rs.forEach((r) => box.append(el('div', { class: 'list-item', onclick: () => { location.hash = 'request/' + r.id; } },
                el('div', {}, el('div', { style: 'font-weight:700', text: (r.estimate && r.estimate.title) || r.description.slice(0, 60) || '—' }),
                    el('div', { class: 'small muted', text: (r.client_name || r.client_email) + ' · ' + (r.client_city || '') + ' · ' + new Date(r.created_at).toLocaleString() })),
                el('div', { class: 'row' }, el('span', { class: 'pill ' + (r.status === 'new' ? 'acc' : r.status === 'won' ? 'ok' : ''), text: T('rs.' + r.status) }),
                    r.estimate && r.estimate.totalHt ? el('b', { text: eur(r.estimate.totalHt) }) : null))));
        } catch (e) { box.innerHTML = ''; box.append(el('div', { class: 'alert err', text: e.message })); }
    }
    async function requestView(id) {
        const main = shell('requests', el('div', { class: 'empty' }, el('span', { class: 'spin dk' })));
        try {
            const r = (await CD.db('/requests?id=eq.' + id + '&select=*'))[0];
            if (!r) throw new Error(T('q.notFound'));
            if (r.status === 'new') { CD.db('/requests?id=eq.' + id, { method: 'PATCH', body: { status: 'contacted' } }).then(countRequests).catch(() => {}); r.status = 'contacted'; }
            const e = r.estimate || {};
            const st = select(r.status, ['new', 'contacted', 'quoted', 'won', 'lost'].map((s) => [s, T('rs.' + s)])); st.style.width = 'auto';
            st.onchange = () => CD.db('/requests?id=eq.' + id, { method: 'PATCH', body: { status: st.value } }).then(() => toast(T('saved')));
            main.innerHTML = '';
            main.append(el('a', { class: 'btn btn-g btn-sm', href: '#requests' }, CD.icon('back', 'flip'), T('nav.requests')),
                el('div', { class: 'card', style: 'margin-top:12px' },
                    el('div', { class: 'row between' }, el('h2', { text: e.title || T('req.request') }), st),
                    e.kind === 'visit' ? el('span', { class: 'pill acc', text: T('req.visit') }) : null,
                    el('p', { class: 'muted small', text: new Date(r.created_at).toLocaleString() }),
                    el('div', { class: 'grid g2' },
                        el('div', {}, el('b', { text: T('q.client') }), el('div', { text: r.client_name || '—' }), el('div', {}, el('a', { href: 'mailto:' + r.client_email, text: r.client_email })),
                            r.client_phone ? el('div', {}, el('a', { href: 'tel:' + r.client_phone, text: r.client_phone })) : null, el('div', { text: r.client_city })),
                        el('div', {}, el('b', { text: T('req.estimate') }), el('div', { style: 'font-size:1.6rem;font-weight:800', text: e.totalHt ? eur(e.totalHt) + ' HT' : '—' }), e.investment ? el('div', { class: 'small muted', text: e.investment }) : null)),
                    el('h3', { style: 'margin-top:16px', text: T('q.desc') }), el('p', { style: 'white-space:pre-line', text: r.description || '—' }),
                    (e.photoFindings || []).length ? el('div', {}, el('b', { text: T('q.photoFindings') + ' (' + r.photos_count + ')' }), el('ul', {}, e.photoFindings.map((s) => el('li', { text: s })))) : null,
                    el('div', { class: 'row', style: 'margin-top:16px' },
                        el('button', { class: 'btn btn-p', onclick: () => editorView(null, { request_id: r.id, client_name: r.client_name, client_email: r.client_email, client_phone: r.client_phone, client_city: r.client_city,
                            description: r.description, title: e.title, summary: e.summary, steps: e.steps, photoFindings: e.photoFindings, lines: e.lines }) }, CD.icon('file'), T('req.makeQuote')),
                        r.client_phone ? el('a', { class: 'btn btn-l', href: 'tel:' + r.client_phone }, CD.icon('phone'), T('req.call')) : null,
                        el('a', { class: 'btn btn-l', href: 'mailto:' + r.client_email }, CD.icon('mail'), T('req.reply')))));
        } catch (x) { main.innerHTML = ''; main.append(el('div', { class: 'alert err', text: x.message })); }
    }

    // ---------- page client ----------
    function pageView() {
        const link = location.origin + '/p/' + P.slug;
        const slug = input(P.slug, { pattern: '[a-z0-9-]{3,40}' }), on = el('input', { type: 'checkbox' }); on.checked = P.public_page_enabled !== false;
        const color = input(P.accent_color || '#f97316', { type: 'color', style: 'height:46px;padding:4px' });
        const logoPrev = el('div'); let logo = P.logo_url || '';
        const drawLogo = () => { logoPrev.innerHTML = ''; if (logo) logoPrev.append(el('img', { src: logo, alt: '', style: 'max-height:60px;margin-top:8px' }), ' ', el('button', { class: 'btn btn-g btn-sm', type: 'button', text: T('remove'), onclick: () => { logo = ''; drawLogo(); } })); };
        const pro = access(P).plan !== 'essentiel';
        const logoIn = el('input', { type: 'file', accept: 'image/*', onchange: async (e) => { try { logo = await CD.compressImage(e.target.files[0], 360, 0.85); drawLogo(); } catch (x) { toast(T('photos.bad')); } } });
        const save = el('button', { class: 'btn btn-p', text: T('saveBtn') });
        const main = shell('page', el('h1', { text: T('nav.page') }), el('p', { class: 'muted', text: T('page.sub') }),
            el('div', { class: 'card', style: 'margin-bottom:16px' }, el('label', { class: 'f', text: T('page.link') }),
                el('div', { class: 'row' }, el('input', { class: 'in', value: link, readonly: true, style: 'flex:1;min-width:220px' }),
                    el('button', { class: 'btn btn-d', text: T('copy'), onclick: () => navigator.clipboard.writeText(link).then(() => toast(T('copied'))) }),
                    navigator.share ? el('button', { class: 'btn btn-l', text: T('share'), onclick: () => navigator.share({ title: P.company_name, url: link }).catch(() => {}) }) : null,
                    el('a', { class: 'btn btn-l', href: link, target: '_blank', text: T('page.open') })),
                el('p', { class: 'hint', text: T('page.tips') })),
            el('div', { class: 'card' }, el('label', { class: 'chk', style: 'margin-bottom:14px' }, on, el('span', { text: T('page.enabled') })),
                field(T('page.slug'), slug, T('page.slugHint')),
                pro ? el('div', { class: 'grid g2' }, field(T('page.color'), color), el('div', { class: 'field' }, el('label', { class: 'f', text: T('page.logo') }), logoIn, logoPrev)) : el('div', { class: 'hint', text: T('page.proBrand') }),
                save));
        drawLogo();
        save.onclick = async () => {
            const s = slug.value.trim().toLowerCase();
            if (!/^[a-z0-9-]{3,40}$/.test(s)) return toast(T('page.slugBad'));
            busy(save, true);
            try {
                const body = { slug: s, public_page_enabled: on.checked };
                if (pro) Object.assign(body, { accent_color: color.value, logo_url: logo });
                await CD.db('/profiles?id=eq.' + P.id, { method: 'PATCH', body });
                Object.assign(P, body); toast(T('saved')); pageView();
            } catch (e) { toast(/duplicate|unique/i.test(e.message) ? T('page.slugTaken') : e.message); busy(save, false, T('saveBtn')); }
        };
        return main;
    }

    // ---------- paramètres ----------
    function settingsView() {
        const F = {};
        const mk = (k, attrs) => (F[k] = input(P[k], attrs));
        const trades = tradeChips(P.trades);
        const form = select(P.legal_form, FORMS.map((f) => [f, T('form.' + f)])), vat = select(P.vat_regime, [['franchise', T('vat.franchise')], ['assujetti', T('vat.assujetti')]]);
        const vatRate = select(String(P.default_vat_rate || 20), [['20', '20 %'], ['10', '10 %'], ['5.5', '5,5 %']]);
        const terms = el('textarea', { class: 'in', style: 'min-height:70px' }); terms.value = P.payment_terms || '';
        const save = el('button', { class: 'btn btn-p btn-lg', text: T('saveBtn') });
        const sec = (title, ...kids) => el('div', { class: 'card', style: 'margin-bottom:16px' }, el('h3', { text: title }), ...kids);
        shell('settings', el('h1', { text: T('nav.settings') }),
            el('div', { class: 'row m-only', style: 'margin-bottom:14px' }, el('a', { class: 'btn btn-l btn-sm', href: '#prices' }, CD.icon('tag'), T('nav.prices')), el('a', { class: 'btn btn-l btn-sm', href: '#billing' }, CD.icon('card'), T('nav.billing'))),
            sec(T('set.company'), el('div', { class: 'grid g2' }, field(T('f.company'), mk('company_name')), field(T('f.legalForm'), form), field('SIRET', mk('siret')), field(T('f.rcs'), mk('rcs_rm'), T('f.rcsHint')),
                field(T('f.vat'), vat), field(T('f.vatNumber'), mk('vat_number')), field(T('f.vatDefault'), vatRate), field(T('f.insurance'), mk('insurance'), T('f.insuranceHint')))),
            sec(T('set.contact'), el('div', { class: 'grid g2' }, field(T('f.address'), mk('address')), field(T('f.postal'), mk('postal_code')), field(T('f.city'), mk('city')), field(T('f.phone'), mk('phone', { type: 'tel' })),
                field(T('f.contactEmail'), mk('contact_email', { type: 'email' }), T('f.contactHint')), field(T('f.website'), mk('website')))),
            sec(T('f.trades'), trades),
            sec(T('set.pricing'), el('p', { class: 'hint', text: T('set.pricingHint') }), el('div', { class: 'grid g3' }, field(T('f.hourly'), mk('hourly_rate', { type: 'number', min: 0, step: '0.5', placeholder: 'IA' })),
                field(T('f.travel'), mk('travel_fee', { type: 'number', min: 0, placeholder: 'IA' })), field(T('f.radius'), mk('service_radius_km', { type: 'number', min: 1 })))),
            sec(T('set.quotes'), el('div', { class: 'grid g2' }, field(T('q.validity'), mk('quote_validity_days', { type: 'number', min: 1 })), field(T('f.mediator'), mk('mediator'), T('f.mediatorHint'))), field(T('f.terms'), terms)),
            el('div', { class: 'row' }, save),
            sec(T('set.account'), el('div', { class: 'row' },
                el('button', { class: 'btn btn-l', text: T('set.changePass'), onclick: async () => { try { await CD.auth.recover(P.email); toast(T('auth.linkSent'), 5000); } catch (e) { toast(e.message); } } }),
                el('button', { class: 'btn btn-bad', text: T('set.delete'), onclick: async () => {
                    const c = prompt(T('set.deleteConfirm')); if (c !== 'SUPPRIMER') return;
                    try { await CD.api('account', { action: 'delete', confirm: 'SUPPRIMER' }, true); await CD.auth.signOut(); location.href = '/'; } catch (e) { toast(e.message); }
                } }))));
        save.onclick = async () => {
            busy(save, true);
            const n = (v) => v === '' ? null : Number(v);
            const body = { legal_form: form.value, vat_regime: vat.value, default_vat_rate: Number(vatRate.value), trades: trades.get(), payment_terms: terms.value.trim() };
            ['company_name', 'siret', 'rcs_rm', 'vat_number', 'insurance', 'address', 'postal_code', 'city', 'phone', 'contact_email', 'website', 'mediator'].forEach((k) => { body[k] = F[k].value.trim(); });
            body.hourly_rate = n(F.hourly_rate.value); body.travel_fee = n(F.travel_fee.value);
            body.service_radius_km = n(F.service_radius_km.value) || 50; body.quote_validity_days = n(F.quote_validity_days.value) || 30;
            try { await CD.db('/profiles?id=eq.' + P.id, { method: 'PATCH', body }); Object.assign(P, body); toast(T('saved')); }
            catch (e) { toast(e.message); }
            busy(save, false, T('saveBtn'));
        };
    }

    // ---------- abonnement ----------
    async function billingView() {
        const a = access(P);
        let yearly = false;
        const plans = el('div', { class: 'grid g2', style: 'margin-top:16px' });
        const status = el('div', { class: 'card', style: 'margin-bottom:16px' });
        shell('billing', el('h1', { text: T('nav.billing') }), status,
            el('div', { class: 'tog' }, el('button', { class: 'on', text: T('monthly'), onclick: (e) => { yearly = false; tog(e.target); } }), el('button', { text: T('yearly') + ' -20 %', onclick: (e) => { yearly = true; tog(e.target); } })), plans);
        function tog(b) { b.parentNode.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); drawPlans(); }
        const PL = { essentiel: { m: 19, y: 182, f: ['plan.e1', 'plan.e2', 'plan.e5', 'plan.e3', 'plan.e4'] }, pro: { m: 39, y: 374, f: ['plan.p1', 'plan.p2', 'plan.p5', 'plan.p6', 'plan.p3', 'plan.p4'] } };
        function drawPlans() {
            plans.innerHTML = '';
            Object.entries(PL).forEach(([k, p]) => {
                const current = a.plan === k;
                const b = el('button', { class: 'btn btn-block ' + (k === 'pro' ? 'btn-p' : 'btn-d'), text: current ? T('plan.current') : T('plan.choose'), disabled: current });
                b.onclick = async () => { busy(b, true); try { const r = await CD.api('billing', { action: 'checkout', plan: k, interval: yearly ? 'year' : 'month' }, true); location.href = r.url; } catch (e) { toast(e.message, 5000); busy(b, false, T('plan.choose')); } };
                plans.append(el('div', { class: 'card pad-lg price' + (k === 'pro' ? ' best' : '') }, el('h3', { text: k === 'pro' ? 'Pro' : 'Essentiel' }),
                    el('div', {}, el('span', { class: 'amt', text: yearly ? p.y : p.m }), ' ', el('span', { class: 'muted small', text: yearly ? T('perYear') : T('perMonth') })),
                    el('ul', {}, p.f.map((x) => el('li', { text: T(x) }))), b));
            });
        }
        drawPlans();
        const label = a.plan === 'trial' ? T('trial.left', { n: a.days }) : a.ok ? T('plan.active', { plan: a.plan === 'pro' ? 'Pro' : 'Essentiel' }) : T('trial.over');
        status.append(...[el('h3', { text: label }),
            (P.current_period_end && a.ok && a.plan !== 'trial') ? el('p', { class: 'muted small', text: T('plan.renew', { date: new Date(P.current_period_end).toLocaleDateString() }) }) : null,
            P.stripe_customer_id ? el('button', { class: 'btn btn-l', text: T('plan.manage'), onclick: async (e) => { busy(e.target, true); try { location.href = (await CD.api('billing', { action: 'portal' }, true)).url; } catch (x) { toast(x.message); busy(e.target, false, T('plan.manage')); } } }) : null].filter(Boolean));
    }

    CD.installBanner();
    boot();
})();
