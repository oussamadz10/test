const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// 1. جعل السيرفر يعرض ملفات الموقع تلقائياً من مجلد public
app.use(express.static(path.join(__dirname, 'public')));

// 2. استقبال طلبات تحليل المقايسة من جوجل جيميناي المدفوع والسريع
app.post('/api/analyze-devis', async (req, res) => {
    try {
        const { description } = req.body;

        const systemInstruction = `Tu es un métreur expert en plomberie et chauffage en France.
        Analyse la demande du client et génère un chiffrage technique précis.
        Tu dois impérativement renvoyer UNIQUEMENT un objet JSON strict :
        {
          "title": "Un titre professionnel de la prestation",
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
                generationConfig: { responseMimeType: "application/json", temperature: 0.3 }
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

// 3. 🛠️ توجيه النطاق الرئيسي لفتح ملف index.html المدمج فوراً بدلاً من النص القديم
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app;
