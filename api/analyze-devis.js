const express = require('express');
const { GoogleGenAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());

app.post(['/api/analyze-devis', '/'], async (req, res) => {
    try {
        const description = req.body?.description;
        if (!description) {
            return res.status(400).json({ error: "Description manquante" });
        }

        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            return res.status(500).json({ error: "La clé GEMINI_API_KEY est manquante dans Vercel" });
        }

        // 🚀 تهيئة مكتبة جوجل الرسمية بالمفتاح الخاص بك (تدعم الـ AQ تلقائياً)
        const ai = new GoogleGenAI({ apiKey: geminiApiKey.trim() });
        
        // استدعاء النموذج المستقر
        const model = ai.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json", temperature: 0.3 }
        });

        const prompt = `Tu es un métreur expert en plomberie et chauffage en France. Analyse la demande et génère un chiffrage. Renvoyer UNIQUEMENT un objet JSON strict sans balises markdown : {"title": "Titre", "hours": 16, "materials": 2400, "desc": "Description"}\n\nDemand: ${description}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();

        // فك وتمرير الـ JSON الناجح للمتصفح
        return res.json(JSON.parse(responseText));

    } catch (error) {
        return res.status(500).json({ error: "Catch Error", message: error.message });
    }
});

module.exports = app;
