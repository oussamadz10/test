const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.get('/', (req, res) => {
    res.send("ChronoDevis Gemini Pure AI Server is Live!");
});

app.post('/api/analyze-devis', async (req, res) => {
    try {
        const { description } = req.body;

        // أمر التوجيه (Prompt): نطلب من جوجل كتابة التقرير والساعات بحرية تامة وبأسلوب خبير فرنسي
        const systemInstruction = `Tu es un métreur expert en plomberie et chauffage en France. 
        Analise la demande du client et rédige une réponse textuelle claire, détaillée et ultra professionnelle en français. 
        Donne ton estimation d'expert pour le temps nécessaire en heures et le coût des matériaux, rédigé naturellement dans ton texte. 
        Ne renvoie pas de code JSON, rédigé simplement un rapport textuel pro structuré avec des tirets ou des paragraphes.`;

        const geminiApiKey = "AQ.Ab8RN6KbEqIzSLisXYLnOTLiu5ECmNHovKf57fTGrS-0UkmIGw";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Voici ma demande : ${description}` }] }],
                systemInstruction: { parts: [{ text: systemInstruction }] },
                generationConfig: { temperature: 0.7 } // رفع درجة الحرارة ليعطي إجابات إبداعية وحرة كلياً
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0].content.parts[0].text) {
            // إرسال النص الصافي المولد من جوجل مباشرة دون أي قيود أو تعديل
            res.json({ text: data.candidates[0].content.parts[0].text });
        } else {
            res.status(500).json({ error: "Erreur de réponse de l'IA" });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = app;
