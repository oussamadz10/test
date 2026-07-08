const express = require('express');
const app = express();

app.use(express.json());

app.post(['/api/analyze-devis', '/'], async (req, res) => {
    try {
        const description = req.body?.description;

        if (!description) {
            return res.status(400).json({ error: "Description manquante dans le body" });
        }

        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            return res.status(500).json({ error: "La clé GEMINI_API_KEY est manquante" });
        }

        // 🌍 الرابط المستقر v1
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

        // 🚀 إرسال الطلب بالصيغة المعتمدة رسمياً
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ 
                    parts: [{ 
                        text: `Tu es un métreur expert en plomberie et chauffage en France. Analyse la demande et génère un chiffrage. Renvoyer UNIQUEMENT un objet JSON strict sans balises markdown : {"title": "Titre", "hours": 16, "materials": 2400, "desc": "Description"}\n\nDemand: ${description}` 
                    }] 
                }],
                generationConfig: { 
                    response_mime_type: "application/json", 
                    temperature: 0.3 
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(500).json({ error: "Erreur réponse Google Gemini", details: errorText });
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
            return res.status(500).json({ error: "Réponse vide de Gemini" });
        }

        const cleanJsonText = data.candidates[0].content.parts[0].text.trim();
        const finalJson = JSON.parse(cleanJsonText);

        return res.json(finalJson);

    } catch (error) {
        return res.status(500).json({ error: "Catch Error", message: error.message });
    }
});

module.exports = app;
