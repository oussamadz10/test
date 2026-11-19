// ChronoDevis AI – analyse d'une demande de travaux (plomberie, chauffage, sanitaire, VMC).
// Fonction serverless Vercel (Node 18+, aucune dépendance).
//
// Clé IA (variables d'environnement Vercel) :
//   GROQ_API_KEY   – clé Groq (gsk_...)        – gratuit, très rapide
//   GEMINI_API_KEY – clé Google AI (AIza...)   – ou une clé Groq, détectée automatiquement
'use strict';

const GROQ_MODELS = ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'llama-3.1-8b-instant'];
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash'];

const SYSTEM_PROMPT = `Tu es un métreur-économiste expert en plomberie, chauffage, sanitaire et VMC, qui chiffre pour un artisan
indépendant basé à Valence (Drôme, 26). Tu estimes de façon réaliste le temps de main d'œuvre et les fournitures HT
aux prix professionnels constatés en France (négoce type Cedeo, Point P, Richardson).

Repères indicatifs (fournitures HT / main d'œuvre) pour rester cohérent :
- Remplacement chauffe-eau électrique 200 L : 450–750 € / 3–4 h
- Remplacement chaudière gaz à condensation : 2 200–3 500 € / 8–12 h
- Pompe à chaleur air/eau 8–11 kW (remplacement chaudière) : 6 000–9 500 € / 16–28 h
- Climatisation / PAC air/air monosplit : 900–1 600 € / 6–8 h
- VMC simple flux hygro B (maison) : 250–500 € / 4–6 h ; VMC double flux : 2 500–4 500 € / 16–24 h
- Recherche et réparation de fuite accessible : 20–90 € / 1–3 h
- Remplacement WC (posé ou suspendu) : 200–650 € / 2–5 h
- Plomberie + sanitaires d'une salle de bain complète (hors carrelage) : 2 500–5 500 € / 24–40 h
- Désembouage circuit de chauffage (8 radiateurs) : 150–300 € / 4–6 h
- Remplacement d'un radiateur : 150–500 € / 2–3 h

Règles :
- Adapte à la description (surface, nombre d'équipements, accès, état existant). Si l'information manque,
  prends une hypothèse moyenne et indique-la dans "assumptions".
- "hours" = heures de main d'œuvre totales sur site (tests d'étanchéité et mise en service compris).
- Liste les fournitures principales avec quantité et prix unitaire HT réalistes. Pas de main d'œuvre dans les fournitures.
- Les étapes suivent les DTU (60.1, 60.11, 65.x, 68.3) et la réglementation (gaz, fluides frigorigènes, électricité) quand c'est pertinent.
- Si la demande ne concerne pas la plomberie, le chauffage, le sanitaire, la climatisation ou la VMC, renvoie
  {"outOfScope": true, "message": "explication courte"}.
- Réponds en français, UNIQUEMENT avec un objet JSON valide, sans markdown.

Format exact :
{
  "title": "Intitulé professionnel de la prestation",
  "summary": "2 à 3 phrases claires pour le client",
  "hours": 0,
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

async function askGroq(key, user) {
    let last;
    for (const model of GROQ_MODELS) {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
            body: JSON.stringify({
                model, temperature: 0.2, response_format: { type: 'json_object' },
                messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: user }]
            })
        });
        const text = await r.text();
        if (r.ok) return parseJson(JSON.parse(text).choices[0].message.content);
        last = new Error('Groq ' + r.status + ' (' + model + '): ' + text.slice(0, 200));
        if (r.status === 401 || r.status === 403) throw last;          // mauvaise clé : inutile d'insister
    }
    throw last;
}

async function askGemini(key, user) {
    let last;
    for (const model of GEMINI_MODELS) {
        const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + encodeURIComponent(key), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
                contents: [{ role: 'user', parts: [{ text: user }] }],
                generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
            })
        });
        const text = await r.text();
        if (r.ok) {
            const parts = (((JSON.parse(text).candidates || [])[0] || {}).content || {}).parts || [];
            return parseJson(parts.map((p) => p.text || '').join(''));
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
    if (description.length < 8) return res.status(400).json({ error: 'Décrivez vos travaux en quelques mots.' });

    const context = [
        body.type ? 'Type : ' + str(body.type, 60) : '',
        body.investment ? 'Gamme souhaitée : ' + str(body.investment, 40) : ''
    ].filter(Boolean).join('\n');
    const user = (context ? context + '\n' : '') + 'Demande du client : ' + description;

    const groqKey = process.env.GROQ_API_KEY || (/^gsk_/.test(process.env.GEMINI_API_KEY || '') ? process.env.GEMINI_API_KEY : '');
    const geminiKey = /^AIza/.test(process.env.GEMINI_API_KEY || '') ? process.env.GEMINI_API_KEY : '';
    if (!groqKey && !geminiKey) return res.status(500).json({ error: 'Clé IA manquante (GROQ_API_KEY ou GEMINI_API_KEY) dans Vercel.' });

    const errors = [];
    for (const [name, fn, key] of [['groq', askGroq, groqKey], ['gemini', askGemini, geminiKey]]) {
        if (!key) continue;
        try { return res.status(200).json(clean(await fn(key.trim(), user))); }
        catch (e) { errors.push(e.message); console.error('[analyze-devis] ' + name + ': ' + e.message); }
    }
    return res.status(502).json({ error: "Le service d'analyse est momentanément indisponible.", detail: errors.join(' | ').slice(0, 400) });
};
