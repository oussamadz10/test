const express = require('express');
const app = express();

// 🛠️ دالة مخصصة وصارمة للتحكم في الـ CORS والـ Preflight لضمان العمل على Netlify
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // التعامل الفوري مع طلبات OPTIONS التمهيدية (Preflight) لمنع خطأ 404
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());

app.get('/', (req, res) => {
    res.send("ChronoDevis Gemini Cloud Server is Active!");
});

app.post('/api/analyze-devis', async (req, res) => {
    try {
        const { description } = req.body;

        const systemInstruction = `Tu es un métreur expert en plomberie et chauffage en France.
        Analyse la demande du client et génère un chiffrage technique précis.
        Tu dois impérativement renvoyer UNIQUEMENT un objet JSON strict avec cette structure exacte :
        {
          "title": "Un titre professionnel de la prestation (ex: Rénovation Salle de Bain)",
          "hours": 16,
          "materials": 2400,
          "desc": "Une description technique détaillée, étape par étape selon les normes DTU en français."
        }`;

        const geminiApiKey = "AQ.Ab8RN6KbEqIzSLisXYLnOTLiu5ECmNHovKf57fTGrS-0UkmIGw";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: description }] }],
                systemInstruction: { parts: [{ text: systemInstruction }] },
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.3
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
