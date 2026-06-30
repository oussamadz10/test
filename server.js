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
    res.send("ChronoDevis Gemini Paid Stream Server is live!");
});

app.post('/api/analyze-devis', async (req, res) => {
    // إعلام المتصفح بأن البيانات ستصل بشكل دفق مستمر (Streaming)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        const { description } = req.body;

        const systemInstruction = `Tu es un métreur expert en plomberie, chauffage, sanitaire et VMC en France.
        Analyse la demande du client et génère un chiffrage technique précis.
        Tu dois évaluer de manière réaliste le temps de travail nécessaire (en heures) et le coût des fournitures/matériaux HT (en euros).
        
        Règles de calcul strictes à intégrer logiquement dans ton analyse :
        - Remplacement flexible/douchette ou petit joint : 1 heure, matériel : 15€ à 30€.
        - Remplacement mécanisme de chasse d'eau : 2 heures, matériel : 40€ à 60€.
        - Pose d'un pack WC standard au sol : 3 à 4 heures, matériel : 150€ à 250€.
        - Pose d'un WC suspendu (avec bâti-support) : 7 à 8 heures, matériel : 350€ à 500€.
        - Pose d'un sèche-serviettes : 3 à 5 heures, matériel : 200€ à 400€.
        - Changement de chaudière ou Pompe à Chaleur (PAC) : 14 à 20 heures, matériel : 2000€ à 4500€.
        - Si plusieurs tâches, ADDITIONNE les heures et les matériels de manière logique.

        Tu dois impérativement renvoyer UNIQUEMENT un objet JSON strict avec cette structure exacte :
        {
          "title": "Un titre professionnel et court en français (ex: Remplacement de chaudière à gaz)",
          "hours": (un nombre entier d'heures total calculé),
          "materials": (un nombre entier pour le coût total des matériaux HT),
          "desc": "Une description technique, détaillée, étape par étape selon les normes DTU en français de l'ensemble des prestations."
        }`;

        const geminiApiKey = "AQ.Ab8RN6KbEqIzSLisXYLnOTLiu5ECmNHovKf57fTGrS-0UkmIGw";
        // استخدام رابط البث الحي streamGenerateContent المدعوم الآن بحسابك المشحون
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${geminiApiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `Voici la demande de travaux : ${description}` }]
                }],
                systemInstruction: {
                    parts: [{ text: systemInstruction }]
                },
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.2
                }
            })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            // تمرير الكلمات فوراً إلى موقعك حية وثانية بثانية
            res.write(chunk);
        }
        res.end();

    } catch (error) {
        console.error(error);
        res.end();
    }
});

module.exports = app;
