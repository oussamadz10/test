const express = require('express');
const cors = require('cors');
const app = express();

// إعدادات CORS لضمان استقبال وإرسال البيانات مع المتصفح والمواقع دون أي حظر أمني
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// توثيق تشغيل السيرفر عند فتحه بالمتصفح مباشرة لمنع خطأ Not Found
app.get('/', (req, res) => {
    res.send("ChronoDevis AI Backend Cloud Server is running perfectly!");
});

app.post('/api/analyze-devis', async (req, res) => {
    try {
        const { description } = req.body;

        // صياغة أمر هندسي صارم يضمن عودة البيانات كـ JSON سليم ومنطقي
        const systemPrompt = `Tu es un métreur expert en plomberie et chauffage/CVC en France.
        Analyse la demande du client et renvoie UNIQUEMENT un objet JSON strict, sans texte explicatif avant ou après.
        Structure attendue :
        {
          "title": "Titre professionnel court de l'intervention",
          "hours": 3,
          "materials": 150,
          "desc": "Description technique normée de la prestation en français."
        }`;

        // 🛠️ تم تصحيح رابط الـ URL الرسمي هنا بدقة لمنع خطأ ENOTFOUND:
        const response = await fetch("https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1", {
            headers: { 
                "Authorization": "Bearer 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",
                "Content-Type": "application/json" 
            },
            method: "POST",
            body: JSON.stringify({ inputs: `<s>[SYS] ${systemPrompt} [/SYS] Client demande : ${description} </s>` }),
        });

        const result = await response.json();
        
        // التحقق من وصول الرد على شكل مصفوفة أو نص مباشرة
        let generatedText = "";
        if (Array.isArray(result) && result[0]) {
            generatedText = result[0].generated_text || JSON.stringify(result[0]);
        } else if (result.generated_text) {
            generatedText = result.generated_text;
        } else {
            generatedText = JSON.stringify(result);
        }
        
        // استخراج كائن الـ JSON النظيف فقط لضمان عدم انهيار دالة Parse
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            res.json(JSON.parse(jsonMatch[0]));
        } else {
            res.status(500).json({ error: "Format de réponse IA invalide.", raw: generatedText });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur interne du serveur cloud." });
    }
});

// التصدير الإلزامي لمنصة Vercel لضمان استقرار السيرفر
module.exports = app;
