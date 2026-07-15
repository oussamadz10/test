const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/generative-ai'); // استدعاء المكتبة الرسمية
const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send("ChronoDevis Gemini SDK Server is Active!");
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

        // تهيئة اتصال Google AI باستخدام المكتبة الرسمية والمفتاح الآمن
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });

        // استدعاء النموذج مع التكوين المناسب وإجبار مخرجات الـ JSON
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: description,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: 'application/json',
                temperature: 0.35
            }
        });

        const resultText = response.text;

        if (resultText) {
            const cleanJsonText = resultText.trim();
            res.json(JSON.parse(cleanJsonText));
        } else {
            res.status(500).json({ error: "Erreur Gemini", details: "No valid response text returned." });
        }
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: "Internal Error", message: error.message });
    }
});

module.exports = app;
