const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// حل مشكلة الـ OPTIONS نهائياً لعمليات الـ CORS Cross-Origin
app.options('*', cors());

app.use(express.json());

app.get('/', (req, res) => {
    res.send("ChronoDevis Claude 3 API Server is Active!");
});

app.post('/api/analyze-devis', async (req, res) => {
    try {
        const { description } = req.body;

        // هندسة الأوامر الموجهة لـ Claude بالفرنسية للحصول على أدق النتائج
        const systemInstruction = `Tu es un métreur expert en plomberie et chauffage en France.
        Analyse la demande du client et génère un chiffrage technique précis.
        Tu dois impérativement renvoyer UNIQUEMENT un objet JSON strict avec cette structure exacte :
        {
          "title": "Un titre professionnel de la prestation (ex: Rénovation Salle de Bain)",
          "hours": 16,
          "materials": 2400,
          "desc": "Une description technique détaillée, étape par étape selon les normes DTU en français."
        }`;

        // إعدادات الاتصال بـ RapidAPI (Claude 3)
        const rapidApiKey = process.env.RAPIDAPI_KEY || "d22dc61c97mshee25a9065e8cb83p1e39afjsn092d6941ac14"; // المفتاح الخاص بك
        const url = "https://claude-3.p.rapidapi.com/messages";

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-rapidapi-key": rapidApiKey,
                "x-rapidapi-host": "claude-3.p.rapidapi.com"
            },
            body: JSON.stringify({
                model: "claude-3-opus-20240229", // أو "claude-3-sonnet" حسب اشتراكك
                max_tokens: 4000,
                temperature: 0.3,
                system: systemInstruction, // تمرير تعليمات النظام لـ Claude
                messages: [
                    {
                        role: "user",
                        content: description
                    }
                ]
            })
        });

        const data = await response.json();

        // التأكد من استلام النص بشكل صحيح من هيكلية استجابة Claude
        if (data.content && data.content[0] && data.content[0].text) {
            const cleanJsonText = data.content[0].text.trim();
            
            // تحويل النص المستلم إلى كائن JSON حقيقي وإرساله للفرونت إند
            res.json(JSON.parse(cleanJsonText));
        } else {
            console.error("Claude API Error Response:", data);
            res.status(500).json({ error: "Erreur Claude API" });
        }
    } catch (error) {
        console.error("Internal Server Error:", error);
        res.status(500).json({ error: "Internal Error" });
    }
});

module.exports = app;
