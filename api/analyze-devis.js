const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send("ChronoDevis Gemini Pure AI Server is Active!");
});

app.post('/api/analyze-devis', async (req, res) => {
    try {
        const { description } = req.body;

        // هندسة أوامر فائقة الدقة لـ Gemini ليعطيك أدق التفاصيل التقنية الفرنسية (DTU)
        const systemInstruction = `Tu es un métreur expert en plomberie et chauffage en France, certifié RGE.
        Analyse la demande du client avec une rigueur absolue et génère un chiffrage technique ultra-précis.
        Tu dois impérativement renvoyer UNIQUEMENT un objet JSON strict avec cette structure exacte :
        {
          "title": "Un titre professionnel de la prestation (ex: Rénovation Complète de Salle de Bain)",
          "hours": 16,
          "materials": 2400,
          "desc": "Analyse technique exhaustive étape par étape selon les normes DTU françaises. Détaille les matériaux requis (ex: type de collecteurs, tuyaux multicouches, vannes, isolants) et décris chaque étape d'exécution (dépose, préparation des supports, raccordements, tests d'étanchéité sous pression, finitions)."
        }`;

        // مفتاح الـ API الخاص بك لـ Gemini (مستقر ومجاني للتجربة)
        const geminiApiKey = "AQ.Ab8RN6KbEqIzSLisXYLnOTLiu5ECmNHovKf57fTGrS-0UkmIGw";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: description }] }],
                systemInstruction: { parts: [{ text: systemInstruction }] },
                generationConfig: {
                    responseMimeType: "application/json", // إجبار Gemini على إخراج JSON نظيف
                    temperature: 0.35 // درجة حرارة مثالية للالتزام بالتعليمات والدقة الفنية
                }
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0].content.parts[0].text) {
            const cleanJsonText = data.candidates[0].content.parts[0].text.trim();
            res.json(JSON.parse(cleanJsonText));
        } else {
            res.status(500).json({ error: "Erreur Gemini" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Error" });
    }
});

module.exports = app;
