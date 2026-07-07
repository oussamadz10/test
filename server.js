const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.get('/', (req, res) => {
    res.send("ChronoDevis Gemini Pure Freedom Server is Live!");
});

app.post('/api/analyze-devis', async (req, res) => {
    try {
        const { description } = req.body;

        // طلب تقرير حر بالكامل من جوجل جيميناي دون التدخل في حساباته
        const systemInstruction = `Tu es un métreur expert en plomberie et CVC en France.
        Analyse la demande du client et estime LIBREMENT selon ton intelligence le nombre d'heures et le coût du matériel HT.
        Tu dois impérativement renvoyer UNIQUEMENT un objet JSON strict avec cette structure exacte :
        {
          "title": "Un titre professionnel court de la prestation",
          "hours": (met ici ton estimation libre d'heures sous forme de NOMBRE ENTIER),
          "materials": (met ici ton estimation libre du coût matériel HT sous forme de NOMBRE ENTIER),
          "desc": "Rédige ici ton rapport d'expert complet, détaillé, étape par étape et ultra professionnel en français."
        }`;

        const geminiApiKey = "AQ.Ab8RN6KbEqIzSLisXYLnOTLiu5ECmNHovKf57fTGrS-0UkmIGw";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Demande de travaux : ${description}` }] }],
                systemInstruction: { parts: [{ text: systemInstruction }] },
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.7 // درجة حرارة مرتفعة ليعطيك إجابة حرة وإبداعية تماماً كمنصة جيميناي الرسمية
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
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = app;
