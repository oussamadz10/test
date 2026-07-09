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
            return res.status(500).json({ error: "La clé GEMINI_API_KEY est manquante dans Vercel" });
        }

        // 🌍 الرابط المباشر للاتصال بالذكاء الاصطناعي الفعلي
        const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
        
        const response = await fetch(url, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "X-goog-api-key": geminiApiKey.trim()
            },
            body: JSON.stringify({
                contents: [{ 
                    parts: [{ 
                        text: `Tu es un métreur expert en plomberie et chauffage en France. Analyse la demande suivante et génère un chiffrage réel. Renvoyer UNIQUEMENT un objet JSON strict sans balises markdown ni texte autour : {"title": "Titre du projet", "hours": 12, "materials": 1500, "desc": "Explication technique détaillée du chiffrage"}\n\nDemand: ${description}` 
                    }] 
                }],
                generationConfig: { 
                    temperature: 0.2,
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(500).json({ error: "Google Gemini Error", details: errorText });
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
            return res.status(500).json({ error: "Réponse vide de Gemini" });
        }

        const aiText = data.candidates[0].content.parts[0].text.trim();
        
        // إرسال النتيجة الحقيقية القادمة من الذكاء الاصطناعي فوراً للمتصفح
        return res.json(JSON.parse(aiText));

    } catch (error) {
        return res.status(500).json({ error: "Server Catch Error", message: error.message });
    }
});

module.exports = app;
