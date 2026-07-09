const express = require('express');
const https = require('https');
const app = express();

app.use(express.json());

app.post(['/api/analyze-devis', '/'], (req, res) => {
    try {
        const description = req.body?.description || "";
        if (!description) {
            return res.status(400).json({ error: "Description manquante" });
        }

        const geminiApiKey = process.env.GEMINI_API_KEY;

        // دالة الحساب الاحتياطي الفوري (تُستدعى في حال فشل جوجل أو وجود حظر)
        const runFallback = () => {
            let hours = 12;
            let materials = 850;
            let title = "Installation & Maintenance Standard";
            let desc = "Analyse technique pour votre projet de plomberie/CVC.";
            
            const text = description.toLowerCase();

            if (text.includes('pompe à chaleur') || text.includes('pac') || text.includes('fioul')) {
                title = "Remplacement Chaudière par Pompe à Chaleur (PAC)";
                hours = 52; 
                materials = 9500; 
                desc = "Remplacement complet de chaudière fioul par une PAC Air-Eau Atlantic. Comprend la dépose, le désembouage hydrodynamique obligatoire des radiateurs en fonte, les raccordements hydrauliques isolés, le circuit électrique dédié (courbe D) et la mise en service thermique conforme aux normes.";
            } else if (text.includes('salle de bain') || text.includes('douche')) {
                title = "Rénovation Complète Salle de Bain";
                hours = 28;
                materials = 2200;
                desc = "Dépose des anciens sanitaires, création d'une douche à l'italienne avec étanchéité SPEC, modification des réseaux cuivre/PVC et pose des nouveaux équipements.";
            } else if (text.includes('fuite') || text.includes('recherche')) {
                title = "Recherche de Fuite & Réparation d'Urgence";
                hours = 4;
                materials = 150;
                desc = "Déplacement, détection thermique de la fuite encastrée, ouverture du support, réparation du tube cuivre/per et remise en eau avec contrôle de pession.";
            }

            return res.json({ title, hours, materials, desc });
        };

        // إذا كان المفتاح موجوداً، نتصل بجوجل عبر https المدمجة والمستقرة
        if (geminiApiKey) {
            const payload = JSON.stringify({
                contents: [{ 
                    parts: [{ 
                        text: `Tu es un métreur expert en plomberie et chauffage en France. Calcule de manière réaliste le temps (hours) et le coût des fournitures (materials HT). Renvoyer UNIQUEMENT un objet JSON strict sans markdown : {"title": "Nom du projet", "hours": 0, "materials": 0, "desc": "Explication technique"}\n\nDemand: ${description}` 
                    }] 
                }],
                generationConfig: { temperature: 0.3, responseMimeType: "application/json" }
            });

            const options = {
                hostname: 'generativelanguage.googleapis.com',
                path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey.trim()}`,
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
                            // إذا ردت جوجل بـ 403 أو حظر، ننتقل فوراً للاحتياطي دون الانهيار بـ 500
                            return runFallback();
                        }
                    } catch (e) {
                        return runFallback();
                    }
                });
            });

            googleReq.on('error', () => { return runFallback(); });
            googleReq.write(payload);
            googleReq.end();

        } else {
            return runFallback();
        }

    } catch (error) {
        // حماية نهائية مطلقة
        return res.json({
            title: "Estimation ChronoDevis AI",
            hours: 12,
            materials: 850,
            desc: "Estimation réalisée sur la base des tarifs forfaitaires de plomberie en vigueur."
        });
    }
});

module.exports = app;
