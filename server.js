const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// دالة سحرية لتطهير النص ومحو أي همزات فرنسية (é, è, à, ç) لضمان مطابقة الكلمات بدقة
function cleanAccents(text) {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

app.get('/', (req, res) => {
    res.send("ChronoDevis Google Gemini Cloud Server is running perfectly!");
});

app.post('/api/analyze-devis', async (req, res) => {
    try {
        const { description } = req.body;
        
        // تطهير النص وتحويله لأحرف صغيرة ومحو الهمزات تماماً
        const textLower = description ? cleanAccents(description.toLowerCase()) : "";

        const systemInstruction = `Tu es un métreur expert en plomberie et chauffage en France.
        Analyse la demande du client et renvoie UNIQUEMENT un objet JSON strict.
        Structure attendue :
        {
          "title": "Titre court professionnel de l'intervention",
          "hours": 3,
          "materials": 150,
          "desc": "Description technique normée de la prestation en français."
        }`;

        const geminiApiKey = "AQ.Ab8RN6KbEqIzSLisXYLnOTLiu5ECmNHovKf57fTGrS-0UkmIGw";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

        let aiResponse = null;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `Demande du client : ${description}` }] }],
                    systemInstruction: { parts: [{ text: systemInstruction }] },
                    generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
                })
            });

            const data = await response.json();
            
            if (data.candidates && data.candidates[0].content.parts[0].text) {
                const cleanJsonText = data.candidates[0].content.parts[0].text.trim();
                aiResponse = JSON.parse(cleanJsonText);
            }
        } catch (aiError) {
            console.error("Gemini API Error, switching to fallback:", aiError);
        }

        // صمام الأمان الذكي والمطور (يفحص النصوص بعد تطهيرها من الهمزات تماماً)
        if (!aiResponse) {
            let exactHours = 3; let exactMaterials = 120; let internalTitle = "Intervention Technique Hydro-Sanitaire";
            let fallbackDesc = "Installation et mise en conformité des réseaux selon les normes DTU en vigueur.";

            if (textLower.includes('chaudiere') || textLower.includes('pac') || textLower.includes('chauffage') || textLower.includes('condensation')) {
                exactHours = 16; 
                exactMaterials = 2400; 
                internalTitle = "Remplacement Chaudière à Condensation / PAC"; 
                fallbackDesc = "Dépose de l'ancien générateur thermique, nettoyage du réseau par désembouage, pose de la nouvelle chaudière à condensation haute performance, raccordements ventouse et mise en service.";
            }
            else if (textLower.includes('flexible') || textLower.includes('pommeau')) { exactHours = 1; exactMaterials = 25; internalTitle = "Remplacement Flexible de Douche"; fallbackDesc = "Dépose du flexible défectueux et pose d'un flexible professionnel inox avec joints neufs."; }
            else if (textLower.includes('joint') || textLower.includes('siphon')) { exactHours = 1; exactMaterials = 15; internalTitle = "Reprise d'étanchéité / Siphon"; fallbackDesc = "Nettoyage των filetages, remplacement des joints d'étanchéité et tests de mise en eau."; }
            else if (textLower.includes('suspendu')) { exactHours = 7; exactMaterials = 420; internalTitle = "Installation Pack WC Suspendu"; fallbackDesc = "Fixation du bâti-support WC suspendu, raccordements encastrés et coffrage technique d'habillage."; }
            else if (textLower.includes('wc') || textLower.includes('toilette')) { exactHours = 3; exactMaterials = 180; internalTitle = "Installation Pack WC Standard"; fallbackDesc = "Pose au sol d'un pack WC complet, raccordement eau propre et évacuation PVC."; }
            else if (textLower.includes('seche serviette')) { exactHours = 4; exactMaterials = 250; internalTitle = "Pose Radiateur Sèche-Serviettes"; fallbackDesc = "Fixation murale, raccordement sur circuit de chauffage et mise en service avec purge."; }

            aiResponse = { title: internalTitle, hours: exactHours, materials: exactMaterials, desc: fallbackDesc };
        }

        res.json(aiResponse);

    } catch (error) {
        console.error(error);
        res.json({
            title: "Intervention Technique CVC",
            hours: 14,
            materials: 1800,
            desc: "Travaux d'installation et ajustement thermique sous les normes NF."
        });
    }
});

module.exports = app;
