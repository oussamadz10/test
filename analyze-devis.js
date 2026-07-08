const express = require('express');
const app = express();

app.use(express.json());

// 🎯 ضبط استقبال الطلب على المسار الرئيسي للدالة السحابية مباشرة
app.post(['/api/analyze-devis', '/'], async (req, res) => {
    try {
        const { description } = req.body;

        if (!description) {
            return res.status(400).json({ error: "Description manquante" });
        }

        // 🔒 استدعاء المفتاح السري بأمان من خزنة Vercel
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            return res.status(500).json({ error: "Configuration API manquante" });
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

        // 🚀 الاتصال بخوادم جوجل جيميناي
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Tu es un métreur expert en plomberie et chauffage en France. Analyse la demande et génère un chiffrage. Renvoyer UNIQUEMENT un objet JSON strict sans balises markdown : {"title": "Titre", "hours": 16, "materials": 2400, "desc": "Description"}\n\nDemand: ${description}` }] }],
                generationConfig: { responseMimeType: "application/json", temperature: 0.3 }
            })
        });

        const data = await response.json();
        
        // فحص بنية رد جيميناي وفك التشفير بأمان
        if (!data.candidates || !data.candidates[0].content.parts[0].text) {
            throw new Error("Réponse Gemini invalide");
        }

        const cleanJsonText = data.candidates[0].content.parts[0].text.trim();
        const finalJson = JSON.parse(cleanJsonText);

        // إرسال كائن JSON حقيقي وموثق إلى المتصفح
        return res.json(finalJson);

    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

// ⚠️ القاتل الصامت: يجب إزالة app.listen(3000) تماماً وتصدير الموديول فقط
module.exports = app;
