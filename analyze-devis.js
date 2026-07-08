// تأكد أن السيرفر يستقبل الطلب على المسار الرئيسي للدالة السحابية مباشرة
app.post(['/api/analyze-devis', '/'], async (req, res) => {
    try {
        const { description } = req.body;

        if (!description) {
            return res.status(400).json({ error: "Description manquante" });
        }

        // كود الاتصال بجوجل جيميناي باستخدام المفتاح السري
        const geminiApiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Tu es un métreur expert en plomberie et chauffage en France. Analyse la demande et génère un chiffrage. Renvoyer UNIQUEMENT un objet JSON strict sans balises markdown : {"title": "Titre", "hours": 16, "materials": 2400, "desc": "Description"}\n\nDemand: ${description}` }] }],
                generationConfig: { responseMimeType: "application/json", temperature: 0.3 }
            })
        });

        const data = await response.json();
        
        // فك تشفير النص العائد من جيميناي وإرساله للواجهة
        const cleanJsonText = data.candidates[0].content.parts[0].text.trim();
        const finalJson = JSON.parse(cleanJsonText);

        return res.json(finalJson);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// تأكد أن السطر الأخير في الملف يصدّر app فقط بدون app.listen
module.exports = app;
