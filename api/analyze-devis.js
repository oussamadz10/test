const express = require('express');
const https = require('https');
const app = express();

app.use(express.json());

app.post(['/api/analyze-devis', '/'], (req, res) => {
    const description = req.body?.description || "";
    if (!description) {
        return res.status(400).json({ error: "Description manquante" });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
        return res.status(500).json({ error: "La clé GEMINI_API_KEY est manquante dans Vercel" });
    }

    const payload = JSON.stringify({
        contents: [{ 
            parts: [{ 
                text: `Tu es un métreur expert en plomberie et chauffage en France. Analyse le texte du client et décide TOI-MÊME de manière totalement libre, logique et réaliste du nombre d'heures requises (hours) et du coût des fournitures (materials HT). Sois ultra-précis selon le contexte. Renvoyer UNIQUEMENT un objet JSON strict sans balises markdown, sans texte explicatif avant ou après : {"title": "Nom du projet", "hours": 0, "materials": 0, "desc": "Explication technique complète du chiffrage"}\n\nDemand: ${description}` 
            }] 
        }],
        generationConfig: { 
            temperature: 0.2, 
            responseMimeType: "application/json" 
        }
    });

    const options = {
        hostname: 'generativelanguage.googleapis.com',
        // 🌍 التحديث هنا: تم تعديل المسار بدقة ليتوافق مع الموديل المستقر والمفتاح الجديد
        path: `/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey.trim()}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    };

    const googleReq = https.request(options, (googleRes) => {
        let data = '';
        googleRes.on('data', (chunk) => { data += chunk; });
        googleRes.on('end', () => {
            try {
                if (googleRes.statusCode === 200) {
                    const parsedData = JSON.parse(data);
                    const aiText = parsedData.candidates[0].content.parts[0].text.trim();
                    return res.json(JSON.parse(aiText));
                } else {
                    return res.status(googleRes.statusCode).json({ error: "Google Gemini Error", details: data });
                }
            } catch (e) {
                return res.status(500).json({ error: "JSON Parse Error", details: data });
            }
        });
    });

    googleReq.on('error', (error) => {
        return res.status(500).json({ error: "HTTP Request Error", message: error.message });
    });

    googleReq.write(payload);
    googleReq.end();
});

module.exports = app;
