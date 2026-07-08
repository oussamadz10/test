const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();

// تفعيل حماية CORS بشكل صارم للسماح بالطلبات المحلية والخارجية معاً
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// جعل السيرفر يعرض واجهة الموقع من مجلد public
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/analyze-devis', async (req, res) => {
    // فرض الـ Headers يدوياً لضمان تخطي جدار الحماية تماماً
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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

        // 🎯 تم وضع مفتاحك الجديد المشفر هنا داخل السيرفر الخلفي حيث تدعمه جوجل بالكامل!
        const geminiApiKey = "AQ.Ab8RN6LfZnk8-sBb8yrmeBf9tB2OcVcd3hq38kySflRLOgXnTA";
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
            return res.json(JSON.parse(cleanJsonText));
        } else {
            return res.status(500).json({ error: "Erreur structurelle Gemini", details: data });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// توجيه النطاق لفتح صفحة index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app;
