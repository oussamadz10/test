// POST /api/report { code, message, contact } – signalement d'un document suspect depuis la page de vérification.
'use strict';
const S = require('../lib/server');
module.exports = async (req, res) => {
    if (req.method !== 'POST') return S.send(res, 405, { error: 'Méthode non autorisée' });
    try {
        if (S.rateLimited(req, 5, 3600e3)) return S.send(res, 429, { error: 'Trop de signalements.' });
        const b = await S.readJson(req);
        if (b.website) return S.send(res, 200, { ok: true });
        const r = { verify_code: S.str(b.code, 20).toUpperCase(), message: S.text(b.message, 2000), contact: S.str(b.contact, 160), ip: S.clientIp(req) };
        if (!r.message) return S.send(res, 400, { error: 'Message requis.' });
        if (S.sbConfigured()) await S.sb('/rest/v1/reports', { method: 'POST', body: r });
        await S.mailAdmin('ChronoDevis – document signalé ' + (r.verify_code || ''), [['Code', r.verify_code || '—'], ['Message', r.message], ['Contact', r.contact || '—'], ['IP', r.ip]], S.siteOf(req));
        return S.send(res, 200, { ok: true });
    } catch (e) { console.error('[report] ' + e.message); return S.send(res, 500, { error: 'Envoi impossible.' }); }
};
