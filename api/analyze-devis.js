const express = require('express');
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
            return res.status(500).json({ error: "Clé manquante" });
        }

        // 🌍 الرابط نظيف تماماً بدون وضع الـ key بالداخل مثل الـ curl
        const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

        const response = await fetch(url, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "X-goog-api-key": geminiApiKey // 🔑 تمرير المفتاح هنا في الهيدر ليتوافق مع رمز AQ
            },
            body: JSON.stringify({
                contents: [{ 
                    parts: [{ 
                        text: `Tu es un métreur expert en plomberie et chauffage en France. Analyse la demande et génère un chiffrage. Renvoyer UNIQUEMENT un objet JSON strict sans balises markdown : {"title": "Titre", "hours": 16, "materials": 2400, "desc": "Description"}\n\nDemand: ${description}` 
                    }] 
                }],
                generationConfig: { temperature: 0.3 }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(500).json({ error: "Erreur Google", details: errorText });
        }

        const data = await response.json();
        const cleanJsonText = data.candidates[0].content.parts[0].text.trim();
        return res.json(JSON.parse(cleanJsonText));

    } catch (error) {
        return res.status(500).json({ error: "Catch Error", message: error.message });
    }
});

module.exports = app;
