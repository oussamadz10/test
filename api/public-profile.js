// GET /api/public-profile?slug=xxx – informations publiques d'un artisan pour sa page client.
'use strict';
const S = require('../lib/server');

module.exports = async (req, res) => {
    try {
        const slug = S.str(new URL(req.url, 'http://x').searchParams.get('slug'), 60);
        if (!slug || !S.sbConfigured()) return S.send(res, 404, { error: 'Page introuvable.' });
        const p = await S.getProfileBySlug(slug);
        if (!p || p.public_page_enabled === false) return S.send(res, 404, { error: 'Page introuvable.' });
        const acc = S.access(p);
        res.setHeader('Cache-Control', 'public, max-age=60');
        return S.send(res, 200, {
            slug: p.slug, active: acc.ok, photos: acc.ok && acc.limits.photos,
            company_name: p.company_name || 'Artisan', trades: p.trades || [], city: p.city, postal_code: p.postal_code,
            phone: p.phone, contact_email: p.contact_email, website: p.website, accent_color: p.accent_color || '#f97316',
            logo_url: p.logo_url, siret: p.siret, legal_form: p.legal_form, address: p.address, insurance: p.insurance,
            vat_regime: p.vat_regime, service_radius_km: p.service_radius_km, lang: p.lang || 'fr'
        });
    } catch (e) { console.error('[public-profile] ' + e.message); return S.send(res, 500, { error: 'Erreur serveur.' }); }
};
