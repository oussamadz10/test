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
                        text: `Tu es un métreur expert en plomberie et chauffage (CVC) en France. Calcule de manière totalement libre et réaliste le temps de travail total nécessaire (en heures) et le coût estimé des fournitures (en euros HT) pour la demande suivante. Sois cohérent avec les tarifs du marché français. Renvoyer UNIQUEMENT un objet JSON strict sans balises markdown, sans texte explicatif avant ou après. L'objet doit avoir exactement cette structure : {"title": "Nom du projet", "hours": 0, "materials": 0, "desc": "Explication technique complète du chiffrage"}\n\nDemand: ${description}` 
                    }] 
                }],
                generationConfig: { 
                    temperature: 0.4,
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(500).json({ error: "Google Gemini Error", details: errorText });
        }

        const data = await response.json();
        const aiText = data.candidates[0].content.parts[0].text.trim();
        return res.json(JSON.parse(aiText));

    } catch (error) {
        return res.status(500).json({ error: "Server Catch Error", message: error.message });
    }
});

module.exports = app;
