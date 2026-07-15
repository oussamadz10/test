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
    res.send("ChronoDevis Gemini Server is Active!");
});

app.post('/api/analyze-devis', async (req, res) => {
    try {
        const { description } = req.body;

        const systemInstruction = `Tu es un métreur expert en plomberie et chauffage en France, certifié RGE.
        Analyse la demande du client avec une rigueur absolue et génère un chiffrage technique ultra-précis.
        Tu dois impérativement renvoyer UNIQUEMENT un objet JSON strict avec cette structure exacte :
        {
          "title": "Un titre professionnel de la prestation (ex: Rénovation Complète de Salle de Bain)",
          "hours": 16,
          "materials": 2400,
          "desc": "Analyse technique exhaustive étape par étape selon les normes DTU françaises. Détaille les matériaux requis (ex: type de collecteurs, tuyaux multicouches, vannes, isolants) et décris chaque étape d'exécution (dépose, préparation des supports, raccordements, tests d'étanchéité sous pression, finitions)."
        }`;

        const geminiApiKey = process.env.GEMINI_API_KEY;

        if (!geminiApiKey) {
            return res.status(500).json({ error: "Configuration Error", message: "GEMINI_API_KEY is missing in Vercel settings." });
        }

        // تم التحديث إلى الإصدار المستقر v1 لضمان دعم موديل gemini-1.5-flash بدون مشاكل
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: description }] }],
                systemInstruction: { parts: [{ text: systemInstruction }] },
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.35
                }
            })
        });

        const data = await response.json();

        // فحص الأخطاء القادمة من جوجل وطباعتها
        if (data.error) {
            console.error("Gemini API Error Detail:", data.error);
            return res.status(500).json({ error: "Gemini API Error", details: data.error.message });
        }

        if (data.candidates && data.candidates[0].content.parts[0].text) {
            const cleanJsonText = data.candidates[0].content.parts[0].text.trim();
            res.json(JSON.parse(cleanJsonText));
        } else {
            res.status(500).json({ error: "Erreur Gemini", details: "No valid response format returned from server." });
        }
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: "Internal Error", message: error.message });
    }
});

module.exports = app;
