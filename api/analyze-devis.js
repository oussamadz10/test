// ChronoDevis AI – analyse d'une demande de travaux (plomberie, chauffage, sanitaire, VMC).
// Fonction serverless Vercel (Node 18+, aucune dépendance).
//
// Clé IA (variables d'environnement Vercel) :
//   GROQ_API_KEY   – clé Groq (gsk_...)        – gratuit, très rapide
//   GEMINI_API_KEY – clé Google AI Studio (AIza... ou AQ....) – ou une clé Groq (gsk_), détectée automatiquement
'use strict';

const GROQ_MODELS = ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'llama-3.1-8b-instant'];
const GROQ_VISION_MODELS = ['meta-llama/llama-4-scout-17b-16e-instruct', 'meta-llama/llama-4-maverick-17b-128e-instruct'];
const GEMINI_MODELS = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash'];

const SYSTEM_PROMPT = `Tu es un métreur-économiste expert en plomberie, chauffage, sanitaire, climatisation et VMC, qui chiffre
pour un artisan indépendant basé à Valence (Drôme, 26). C'est toi qui fixes tout le prix, selon ton expertise et les prix
actuels du marché français : le temps de main d'œuvre, le taux horaire HT de l'artisan, les frais de déplacement et le
prix HT de chaque fourniture (prix professionnels de négoce). Tiens compte de la gamme demandée (standard ou premium),
de la technicité du chantier (dépannage, installation, PAC, gaz…) et de la distance depuis Valence.
Sois réaliste : ni sous-estimé, ni gonflé.

Si des photos sont jointes, analyse-les attentivement : type d'équipement, marque/modèle si lisible, âge et état apparent,
matériaux (cuivre, PER, multicouche, PVC…), fuites, corrosion, accessibilité, contraintes de pose. Sers-t'en pour affiner
le chiffrage et décris ce que tu vois dans "photoFindings". Si une photo ne montre rien d'utile, dis-le.

Règles :
- Adapte à la description et aux photos (surface, nombre d'équipements, accès, état existant). Si l'information manque,
  prends une hypothèse moyenne et indique-la dans "assumptions".
- "hours" = heures de main d'œuvre totales sur site (tests d'étanchéité et mise en service compris).
- "hourlyRate" = taux horaire HT appliqué pour ce chantier dans la Drôme pour la gamme choisie.
- "travelCost" = total HT des déplacements pour toute la durée du chantier, selon la distance indiquée.
- Fournitures : en gamme premium, choisis des marques et modèles haut de gamme et chiffre-les à leur prix réel.
- Liste les fournitures principales avec quantité et prix unitaire HT. Pas de main d'œuvre dans les fournitures.
- Les étapes suivent les DTU (60.1, 60.11, 65.x, 68.3) et la réglementation (gaz, fluides frigorigènes, électricité) quand c'est pertinent.
- Si la demande ne concerne pas la plomberie, le chauffage, le sanitaire, la climatisation ou la VMC, renvoie
  {"outOfScope": true, "message": "explication courte"}.
- Réponds en français, UNIQUEMENT avec un objet JSON valide, sans markdown.

Format exact :
{
  "title": "Intitulé professionnel de la prestation",
  "summary": "2 à 3 phrases claires pour le client",
  "photoFindings": ["Ce que montrent les photos …"],
  "hours": 0,
  "hourlyRate": 0,
  "travelCost": 0,
  "steps": ["Étape 1 …", "Étape 2 …"],
  "materials": [{"label": "Fourniture", "qty": 1, "unit": "u", "unitPrice": 0}],
  "assumptions": ["Hypothèse retenue …"],
  "needsVisit": true,
  "confidence": "haute | moyenne | faible"
}`;

// ---- limitation simple par IP (protège la clé IA contre les abus) ----
const hits = new Map();
function limited(ip) {
    const now = Date.now(), win = 10 * 60 * 1000, max = 15;
    const arr = (hits.get(ip) || []).filter((t) => now - t < win);
    arr.push(now);
    hits.set(ip, arr);
    if (hits.size > 5000) hits.clear();
    return arr.length > max;
}

function readBody(req) {
    if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
    if (typeof req.body === 'string') { try { return Promise.resolve(JSON.parse(req.body)); } catch (e) { return Promise.resolve({}); } }
    return new Promise((resolve) => {
        let raw = '';
        req.on('data', (c) => { raw += c; if (raw.length > 20000) req.destroy(); });
        req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch (e) { resolve({}); } });
        req.on('error', () => resolve({}));
    });
}

function parseJson(text) {
    const t = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '');
    try { return JSON.parse(t); } catch (e) { /* fall through */ }
    const a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a >= 0 && b > a) return JSON.parse(t.slice(a, b + 1));
    throw new Error('Réponse IA illisible');
}

async function askGroq(key, user, images) {
    let last;
    const content = images.length ? [{ type: 'text', text: user }, ...images.map((im) => ({ type: 'image_url', image_url: { url: 'data:' + im.mime + ';base64,' + im.data } }))] : user;
    for (const model of (images.length ? GROQ_VISION_MODELS : GROQ_MODELS)) {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
            body: JSON.stringify({
                model, temperature: 0.2, response_format: { type: 'json_object' },
                messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content }]
            })
        });
        const text = await r.text();
        if (r.ok) return { ai: parseJson(JSON.parse(text).choices[0].message.content), engine: 'groq/' + model };
        last = new Error('Groq ' + r.status + ' (' + model + '): ' + text.slice(0, 200));
        if (r.status === 401 || r.status === 403) throw last;          // mauvaise clé : inutile d'insister
    }
    throw last;
}

async function askGemini(key, user, images) {
    let last;
    for (const model of GEMINI_MODELS) {
        const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
                contents: [{ role: 'user', parts: [{ text: user }, ...images.map((im) => ({ inline_data: { mime_type: im.mime, data: im.data } }))] }],
                generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
            })
        });
        const text = await r.text();
        if (r.ok) {
            const parts = (((JSON.parse(text).candidates || [])[0] || {}).content || {}).parts || [];
            return { ai: parseJson(parts.map((p) => p.text || '').join('')), engine: 'google/' + model };
        }
        last = new Error('Gemini ' + r.status + ' (' + model + '): ' + text.slice(0, 200));
        if (r.status === 400 && /API key/i.test(text)) throw last;
        if (r.status === 401 || r.status === 403) throw last;
    }
    throw last;
}

const num = (v, min, max, def) => { const n = Number(String(v).replace(',', '.')); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def; };
const str = (v, max) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);

function clean(ai) {
    if (ai && ai.outOfScope) return { outOfScope: true, message: str(ai.message, 300) || "Cette demande ne concerne pas nos métiers." };
    const materials = (Array.isArray(ai.materials) ? ai.materials : []).slice(0, 25).map((m) => ({
        label: str(m.label, 120), qty: num(m.qty, 0, 1000, 1), unit: str(m.unit, 12) || 'u', unitPrice: Math.round(num(m.unitPrice, 0, 30000, 0) * 100) / 100
    })).filter((m) => m.label);
    const matTotal = Math.round(materials.reduce((s, m) => s + m.qty * m.unitPrice, 0) * 100) / 100;
    return {
        title: str(ai.title, 120) || 'Intervention technique',
        summary: str(ai.summary, 600),
        hours: Math.round(num(ai.hours, 1, 400, 8) * 2) / 2,
        hourlyRate: Math.round(num(ai.hourlyRate, 20, 200, 55)),
        travelCost: Math.round(num(ai.travelCost, 0, 5000, 0)),
        photoFindings: (Array.isArray(ai.photoFindings) ? ai.photoFindings : []).slice(0, 8).map((x) => str(x, 300)).filter(Boolean),
        steps: (Array.isArray(ai.steps) ? ai.steps : []).slice(0, 15).map((s) => str(s, 300)).filter(Boolean),
        materialsList: materials,
        materials: matTotal || Math.round(num(ai.materials, 0, 150000, 0)),
        assumptions: (Array.isArray(ai.assumptions) ? ai.assumptions : []).slice(0, 8).map((s) => str(s, 200)).filter(Boolean),
        needsVisit: ai.needsVisit !== false,
        confidence: ['haute', 'moyenne', 'faible'].includes(String(ai.confidence).toLowerCase()) ? String(ai.confidence).toLowerCase() : 'moyenne'
    };
}

module.exports = async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    if (limited(ip)) return res.status(429).json({ error: 'Trop de demandes. Réessayez dans quelques minutes.' });

    const body = await readBody(req);
    const description = str(body.description || body.textDescription || body.text, 2000);
    const images = (Array.isArray(body.images) ? body.images : []).slice(0, 3).map((im) => {
        const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(im || ''));
        return m && m[2].length < 2.8e6 ? { mime: m[1], data: m[2] } : null;
    }).filter(Boolean);
    if (description.length < 8 && !images.length) return res.status(400).json({ error: 'Décrivez vos travaux en quelques mots ou ajoutez une photo.' });

    const context = [
        body.type ? 'Type : ' + str(body.type, 60) : '',
        body.investment ? 'Gamme souhaitée : ' + str(body.investment, 40) : '',
        body.zone ? 'Distance du chantier depuis Valence : ' + str(body.zone, 60) : ''
    ].filter(Boolean).join('\n');
    const user = (context ? context + '\n' : '') + 'Demande du client : ' + (description || '(aucune description, se baser sur les photos)') +
        (images.length ? '\n' + images.length + ' photo(s) jointe(s) du chantier.' : '');

    const tidyKey = (k) => String(k || '').trim().replace(/^["']|["']$/g, '');
    const gem = tidyKey(process.env.GEMINI_API_KEY);
    // Groq : gsk_...   Google AI Studio : AIza... ou nouveau format AQ....
    const groqKey = tidyKey(process.env.GROQ_API_KEY) || (/^gsk_/.test(gem) ? gem : '');
    const geminiKey = gem && !/^gsk_/.test(gem) ? gem : '';
    if (!groqKey && !geminiKey) return res.status(500).json({ error: 'Clé IA manquante : ajoutez GROQ_API_KEY (ou GEMINI_API_KEY) dans Vercel > Settings > Environment Variables.' });

    const errors = [];
    const order = [['gemini', askGemini, geminiKey], ['groq', askGroq, groqKey]];
    for (const [name, fn, key] of order) {
        if (!key) continue;
        try {
            const t0 = Date.now();
            const out = await fn(key.trim(), user, images);
            const ms = Date.now() - t0;
            console.log('[analyze-devis] answered by ' + out.engine + ' in ' + ms + ' ms');
            res.setHeader('X-AI-Engine', out.engine);
            return res.status(200).json(Object.assign(clean(out.ai), { engine: out.engine, ms }));
        }
        catch (e) { errors.push(e.message); console.error('[analyze-devis] ' + name + ': ' + e.message); }
    }
    return res.status(502).json({ error: "Le service d'analyse est momentanément indisponible.", detail: errors.join(' | ').slice(0, 400) });
};
