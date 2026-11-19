// ChronoDevis – moteur d'estimation IA pour tous les métiers du bâtiment et de l'artisanat.
'use strict';

const GROQ_MODELS = ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'llama-3.1-8b-instant'];
const GROQ_VISION_MODELS = ['meta-llama/llama-4-scout-17b-16e-instruct', 'meta-llama/llama-4-maverick-17b-128e-instruct'];
const GEMINI_MODELS = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash'];

const TRADES = {
    plombier: 'plomberie / sanitaire', chauffagiste: 'chauffage / pompe à chaleur / chaudière', climaticien: 'climatisation / ventilation (VMC)',
    electricien: 'électricité', macon: 'maçonnerie / gros œuvre', peintre: 'peinture / revêtements muraux', plaquiste: 'plâtrerie / isolation intérieure',
    carreleur: 'carrelage / faïence', menuisier: 'menuiserie (portes, fenêtres, agencement)', charpentier: 'charpente', couvreur: 'couverture / zinguerie',
    facadier: 'façade / ravalement / ITE', serrurier: 'serrurerie / métallerie', vitrier: 'vitrerie', solier: 'sols (parquet, PVC, résine)',
    cuisiniste: 'pose de cuisines / salles de bain', paysagiste: 'paysagisme / espaces verts', terrassier: 'terrassement / VRD', piscine: 'piscines',
    domotique: 'domotique / courants faibles / alarme', ramoneur: 'ramonage / poêles', demenageur: 'déménagement', nettoyage: 'nettoyage / entretien',
    multiservices: 'multiservices / petits travaux', autre: 'autre métier artisanal'
};
const LEGAL_FORMS = {
    micro: 'micro-entreprise', ei: 'entreprise individuelle (régime réel)', eurl: 'EURL', sarl: 'SARL', sasu: 'SASU', sas: 'SAS', sa: 'SA', scop: 'SCOP', autre: 'autre forme'
};

const SYSTEM_PROMPT = `Tu es un métreur-économiste expert de tous les métiers du bâtiment et de l'artisanat en France
(plomberie, chauffage, électricité, maçonnerie, peinture, menuiserie, couverture, carrelage, plâtrerie, serrurerie, paysagisme, etc.).
Tu prépares une estimation de devis pour l'entreprise décrite dans le contexte. C'est toi qui fixes le prix, selon ton expertise et
les prix actuels du marché français dans la région indiquée : temps de main d'œuvre, taux horaires, frais de déplacement et prix HT
de chaque fourniture (prix professionnels). Si l'entreprise a indiqué son propre taux horaire ou ses frais de déplacement, utilise-les.
Tiens compte de la gamme demandée, de la technicité, de la région et de la distance. Sois réaliste : ni sous-estimé, ni gonflé.

Si des photos sont jointes, analyse-les : équipement, matériaux, dimensions apparentes, état, accès, contraintes. Décris ce que tu
vois dans "photoFindings" ; si une photo n'apporte rien, dis-le.

Règles :
- Adapte à la description et aux photos. Si l'information manque, prends une hypothèse moyenne et indique-la dans "assumptions".
- "hours" = heures de main d'œuvre totales sur site (toutes personnes confondues, essais et nettoyage compris).
- "hourlyRateStandard" et "hourlyRatePremium" = taux horaires HT pour CE chantier, gamme standard et premium ; le premium est toujours supérieur.
- "travelCost" = total HT des déplacements pour toute la durée du chantier.
- "materials" = fournitures et matériaux principaux avec quantité, unité (u, m, m², m³, kg, lot, forfait…) et prix unitaire HT. Pas de main d'œuvre dedans.
  En gamme premium, choisis des marques et produits haut de gamme à leur prix réel.
- "extras" = autres postes éventuels (location de matériel, évacuation des gravats, échafaudage…) avec prix HT.
- "steps" = déroulé de l'intervention selon les règles de l'art, DTU et normes applicables au métier.
- "suggestedVatRate" = taux de TVA français applicable si l'entreprise y est assujettie : 20, 10 (rénovation d'un logement de plus de 2 ans)
  ou 5.5 (travaux de rénovation énergétique éligibles).
- Si la demande n'est pas une prestation artisanale ou de travaux, renvoie {"outOfScope": true, "message": "explication courte"}.
- Réponds dans la langue demandée (champ "Langue"), UNIQUEMENT avec un objet JSON valide, sans markdown.

Format exact :
{
  "title": "Intitulé professionnel de la prestation",
  "trade": "métier principal concerné",
  "summary": "2 à 3 phrases claires pour le client",
  "photoFindings": ["…"],
  "hours": 0,
  "hourlyRateStandard": 0,
  "hourlyRatePremium": 0,
  "travelCost": 0,
  "materials": [{"label": "…", "qty": 1, "unit": "u", "unitPrice": 0}],
  "extras": [{"label": "…", "qty": 1, "unit": "forfait", "unitPrice": 0}],
  "steps": ["…"],
  "assumptions": ["…"],
  "suggestedVatRate": 20,
  "needsVisit": true,
  "confidence": "haute | moyenne | faible"
}`;

const LANG_NAMES = { fr: 'français', en: 'anglais', es: 'espagnol', ar: 'arabe' };

function parseJson(t) {
    t = String(t || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '');
    try { return JSON.parse(t); } catch (e) { /* suite */ }
    const a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a >= 0 && b > a) return JSON.parse(t.slice(a, b + 1));
    throw new Error('Réponse IA illisible');
}

async function askGroq(key, user, images) {
    let last;
    const content = images.length ? [{ type: 'text', text: user }, ...images.map((im) => ({ type: 'image_url', image_url: { url: 'data:' + im.mime + ';base64,' + im.data } }))] : user;
    for (const model of (images.length ? GROQ_VISION_MODELS : GROQ_MODELS)) {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
            body: JSON.stringify({ model, temperature: 0.2, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content }] })
        });
        const t = await r.text();
        if (r.ok) return { ai: parseJson(JSON.parse(t).choices[0].message.content), engine: 'groq/' + model };
        last = new Error('Groq ' + r.status + ' (' + model + '): ' + t.slice(0, 200));
        if (r.status === 401 || r.status === 403) throw last;
    }
    throw last;
}

async function askGemini(key, user, images) {
    let last;
    for (const model of GEMINI_MODELS) {
        const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
                contents: [{ role: 'user', parts: [{ text: user }, ...images.map((im) => ({ inline_data: { mime_type: im.mime, data: im.data } }))] }],
                generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
            })
        });
        const t = await r.text();
        if (r.ok) {
            const parts = (((JSON.parse(t).candidates || [])[0] || {}).content || {}).parts || [];
            return { ai: parseJson(parts.map((p) => p.text || '').join('')), engine: 'google/' + model };
        }
        last = new Error('Gemini ' + r.status + ' (' + model + '): ' + t.slice(0, 200));
        if ((r.status === 400 && /API key/i.test(t)) || r.status === 401 || r.status === 403) throw last;
    }
    throw last;
}

const num = (v, min, max, def) => { const n = Number(String(v).replace(',', '.')); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def; };
const str = (v, max) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
const list = (a, n, max) => (Array.isArray(a) ? a : []).slice(0, n).map((x) => str(x, max)).filter(Boolean);
const lines = (a, n) => (Array.isArray(a) ? a : []).slice(0, n).map((m) => ({
    label: str(m.label, 140), qty: num(m.qty, 0, 100000, 1), unit: str(m.unit, 12) || 'u', unitPrice: Math.round(num(m.unitPrice, 0, 200000, 0) * 100) / 100
})).filter((m) => m.label);

// Nettoie la réponse et applique les réglages de l'entreprise (taux, déplacement)
function clean(ai, opts) {
    if (ai && ai.outOfScope) return { outOfScope: true, message: str(ai.message, 300) || 'Demande hors du champ des travaux.' };
    const n = (v) => { const x = Number(String(v).replace(',', '.')); return Number.isFinite(x) && x >= 15 && x <= 250 ? x : null; };
    let std = n(ai.hourlyRateStandard) || n(ai.hourlyRate) || 55;
    let pre = Math.max(n(ai.hourlyRatePremium) || 0, Math.ceil(std * 1.15));
    if (opts.hourlyRate > 0) { std = opts.hourlyRate; pre = Math.max(pre, Math.ceil(std * 1.15)); }
    const vat = [20, 10, 5.5].includes(Number(ai.suggestedVatRate)) ? Number(ai.suggestedVatRate) : 20;
    return {
        title: str(ai.title, 140) || 'Prestation',
        trade: str(ai.trade, 60),
        summary: str(ai.summary, 700),
        photoFindings: list(ai.photoFindings, 8, 300),
        hours: Math.round(num(ai.hours, 0.5, 2000, 4) * 2) / 2,
        hourlyRateStandard: Math.round(std), hourlyRatePremium: Math.round(pre),
        hourlyRate: Math.round(opts.premium ? pre : std),
        travelCost: opts.travelFee >= 0 && opts.travelFee !== null && opts.travelFee !== undefined ? opts.travelFee : Math.round(num(ai.travelCost, 0, 20000, 0)),
        materials: lines(ai.materials, 40),
        extras: lines(ai.extras, 10),
        steps: list(ai.steps, 20, 300),
        assumptions: list(ai.assumptions, 10, 220),
        suggestedVatRate: vat,
        needsVisit: ai.needsVisit !== false,
        confidence: ['haute', 'moyenne', 'faible'].includes(String(ai.confidence).toLowerCase()) ? String(ai.confidence).toLowerCase() : 'moyenne'
    };
}

function buildPrompt(input, profile) {
    const p = profile || {};
    const ctx = [
        'Langue de la réponse : ' + (LANG_NAMES[input.lang] || 'français'),
        p.trades && p.trades.length ? 'Métier(s) de l\'entreprise : ' + p.trades.map((t) => TRADES[t] || t).join(', ') : 'Métier : à déduire de la demande',
        p.legal_form ? 'Forme juridique : ' + (LEGAL_FORMS[p.legal_form] || p.legal_form) : '',
        p.city || p.postal_code ? 'Siège de l\'entreprise : ' + [p.postal_code, p.city].filter(Boolean).join(' ') + ', France' : 'Région : France',
        p.hourly_rate > 0 ? 'Taux horaire de l\'entreprise : ' + p.hourly_rate + ' € HT' : '',
        p.travel_fee >= 0 && p.travel_fee !== null && p.travel_fee !== undefined ? 'Frais de déplacement de l\'entreprise : ' + p.travel_fee + ' € HT' : '',
        input.type ? 'Type de chantier : ' + str(input.type, 60) : '',
        input.investment ? 'Gamme souhaitée : ' + str(input.investment, 40) : '',
        input.site ? 'Lieu du chantier : ' + str(input.site, 80) : '',
        input.zone ? 'Distance du chantier : ' + str(input.zone, 60) : ''
    ].filter(Boolean).join('\n');
    return ctx + '\nDemande : ' + (input.description || '(aucune description, se baser sur les photos)') +
        (input.images.length ? '\n' + input.images.length + ' photo(s) jointe(s).' : '');
}

function parseImages(arr, max) {
    return (Array.isArray(arr) ? arr : []).slice(0, max).map((im) => {
        const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(im || ''));
        return m && m[2].length < 2.8e6 ? { mime: m[1], data: m[2] } : null;
    }).filter(Boolean);
}

async function estimate(input, profile) {
    const tidy = (k) => String(k || '').trim().replace(/^["']|["']$/g, '');
    const gem = tidy(process.env.GEMINI_API_KEY);
    const groqKey = tidy(process.env.GROQ_API_KEY) || (/^gsk_/.test(gem) ? gem : '');
    const geminiKey = gem && !/^gsk_/.test(gem) ? gem : '';
    if (!groqKey && !geminiKey) throw Object.assign(new Error('Clé IA manquante (GEMINI_API_KEY ou GROQ_API_KEY).'), { status: 500 });
    const user = buildPrompt(input, profile);
    const errors = [];
    for (const [fn, key] of [[askGemini, geminiKey], [askGroq, groqKey]]) {
        if (!key) continue;
        try {
            const t0 = Date.now();
            const out = await fn(key, user, input.images);
            const p = profile || {};
            return Object.assign(clean(out.ai, { premium: /haut|premium/i.test(String(input.investment || '')), hourlyRate: Number(p.hourly_rate) || 0, travelFee: p.travel_fee === null || p.travel_fee === undefined || p.travel_fee === '' ? null : Number(p.travel_fee) }),
                { engine: out.engine, ms: Date.now() - t0 });
        } catch (e) { errors.push(e.message); console.error('[ai] ' + e.message); }
    }
    throw Object.assign(new Error("Le service d'analyse est momentanément indisponible."), { status: 502, detail: errors.join(' | ').slice(0, 400) });
}

module.exports = { estimate, parseImages, TRADES, LEGAL_FORMS };
