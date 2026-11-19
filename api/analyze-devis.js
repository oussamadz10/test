// POST /api/analyze-devis – estimation IA d'une prestation.
// Trois modes :
//   1. artisan connecté (Authorization: Bearer <jeton Supabase>) : quota de son abonnement
//   2. page client d'un artisan ({ slug }) : décompté sur le quota de cet artisan
//   3. démo publique de la page d'accueil : 3 essais par heure et par IP
'use strict';
const S = require('../lib/server');
const AI = require('../lib/ai');

module.exports = async (req, res) => {
    if (req.method !== 'POST') return S.send(res, 405, { error: 'Méthode non autorisée' });
    try {
        const body = await S.readJson(req);
        const input = {
            description: S.text(body.description, 2500),
            type: S.str(body.type, 60), investment: S.str(body.investment, 40),
            zone: S.str(body.zone, 60), site: S.str(body.site, 80),
            lang: ['fr', 'en', 'es', 'ar'].includes(body.lang) ? body.lang : 'fr',
            images: []
        };
        let profile = null;
        const slug = S.str(body.slug, 60);
        const user = req.headers.authorization ? await S.getUser(req) : null;

        if (user) {                                                     // 1. artisan connecté
            profile = await S.getProfile(user.id);
            if (!profile) return S.send(res, 403, { error: 'Profil introuvable.' });
            const acc = S.access(profile);
            if (!acc.ok) return S.send(res, 402, { error: 'Votre essai est terminé. Choisissez une formule pour continuer.', code: 'trial_expired' });
            input.images = AI.parseImages(body.images, acc.limits.photos ? 5 : 0);
            if (!(await S.useAiQuota(profile, acc))) return S.send(res, 429, { error: 'Quota mensuel d\'estimations atteint pour votre formule.', code: 'quota' });
        } else if (slug) {                                              // 2. page client
            if (S.rateLimited(req, 6, 3600e3)) return S.send(res, 429, { error: 'Trop de demandes. Réessayez plus tard.' });
            profile = S.sbConfigured() ? await S.getProfileBySlug(slug) : null;
            if (!profile || profile.public_page_enabled === false) return S.send(res, 404, { error: 'Page introuvable.' });
            const acc = S.access(profile);
            if (!acc.ok) return S.send(res, 403, { error: 'Le simulateur de cette entreprise est momentanément indisponible.' });
            input.images = AI.parseImages(body.images, acc.limits.photos ? 3 : 0);
            if (!(await S.useAiQuota(profile, acc))) return S.send(res, 429, { error: 'Le simulateur de cette entreprise est momentanément indisponible.' });
        } else {                                                        // 3. démo
            if (S.rateLimited(req, 3, 3600e3)) return S.send(res, 429, { error: 'Limite de la démo atteinte. Créez votre compte gratuit pour continuer.', code: 'demo_limit' });
            input.images = AI.parseImages(body.images, 1);
        }

        if (input.description.length < 8 && !input.images.length) return S.send(res, 400, { error: 'Décrivez les travaux en quelques mots ou ajoutez une photo.' });
        const out = await AI.estimate(input, profile);
        console.log('[analyze-devis] ' + (user ? 'artisan' : slug ? 'page ' + slug : 'demo') + ' · ' + out.engine + ' · ' + out.ms + ' ms');
        res.setHeader('X-AI-Engine', out.engine);
        return S.send(res, 200, out);
    } catch (e) {
        console.error('[analyze-devis] ' + e.message);
        return S.send(res, e.status && e.status < 600 ? e.status : 500, { error: e.message, detail: e.detail });
    }
};
