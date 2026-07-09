const express = require('express');
const https = require('https');
const app = express();

app.use(express.json());

app.post(['/api/analyze-devis', '/'], (req, res) => {
    // 🧠 قراءة مرنة ومحسنة لتفادي خطأ 400 تحت أي ظرف
    const description = req.body?.description || req.body?.textDescription || req.body?.text || "";
    
    if (!description || description.trim() === "") {
        return res.status(400).json({ error: "Description manquante ou mal formee dans le body" });
    }

    const groqApiKey = process.env.GEMINI_API_KEY;
    if (!groqApiKey) {
        return res.status(500).json({ error: "La cle API est manquante dans Vercel" });
    }

    const payload = JSON.stringify({
        model: "llama3-70b-8192",
        messages: [{
            role: "user",
            content: `Tu es un métreur expert en plomberie et chauffage en France. Analyse le texte du client et décide du nombre d'heures requises (hours) et du coût des fournitures (materials HT). Renvoyer UNIQUEMENT un objet JSON strict sans balises markdown, sans texte explicatif avant ou après : {"title": "Nom du projet", "hours": 0, "materials": 0, "desc": "Explication technique complète"}\n\nDemand: ${description}`
        }],
        temperature: 0.2,
        response_format: { type: "json_object" }
    });

    const options = {
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqApiKey.trim()}`,
            'Content-Length': Buffer.byteLength(payload)
        }
    };

    const groqReq = https.request(options, (groqRes) => {
        let data = '';
        groqRes.on('data', (chunk) => { data += chunk; });
        groqRes.on('end', () => {
            try {
                if (groqRes.statusCode === 200) {
                    const parsedData = JSON.parse(data);
                    const aiText = parsedData.choices[0].message.content.trim();
                    return res.json(JSON.parse(aiText));
                } else {
                    return res.status(groqRes.statusCode).json({ error: "Groq API Error", details: data });
                }
            } catch (e) {
                return res.status(500).json({ error: "JSON Parse Error", details: data });
            }
        });
    });

    groqReq.on('error', (error) => {
        return res.status(500).json({ error: "HTTP Request Error", message: error.message });
    });

    groqReq.write(payload);
    groqReq.end();
});

module.exports = app;
