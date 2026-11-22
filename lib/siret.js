// Vérification d'un SIRET auprès de l'API publique « Recherche d'entreprises » (DINUM, gratuite, sans clé).
'use strict';
const API = 'https://recherche-entreprises.api.gouv.fr/search?q=';

function luhnOk(n) {                         // clé de contrôle des SIREN/SIRET (exception : La Poste)
    if (/^356000000/.test(n)) return true;
    let sum = 0;
    for (let i = 0; i < n.length; i++) { let d = +n[n.length - 1 - i]; if (i % 2) { d *= 2; if (d > 9) d -= 9; } sum += d; }
    return sum % 10 === 0;
}

// Renvoie { ok, error?, siret, name, address, active, individual, director }
async function checkSiret(raw) {
    const siret = String(raw || '').replace(/\s+/g, '');
    if (!/^\d{14}$/.test(siret)) return { ok: false, error: 'format' };
    if (!luhnOk(siret)) return { ok: false, error: 'checksum' };
    let data;
    try {
        const r = await fetch(API + siret + '&per_page=1', { headers: { Accept: 'application/json' } });
        if (r.status === 429) return { ok: false, error: 'busy' };
        if (!r.ok) return { ok: false, error: 'unavailable' };
        data = await r.json();
    } catch (e) { return { ok: false, error: 'unavailable' }; }
    const u = (data.results || []).find((x) => x.siren === siret.slice(0, 9));
    if (!u) return { ok: false, error: 'notfound' };
    const et = (u.matching_etablissements || []).find((e) => e.siret === siret) || (u.siege && u.siege.siret === siret ? u.siege : null);
    if (!et) return { ok: false, error: 'notfound' };
    const d = (u.dirigeants || [])[0] || {};
    return {
        ok: true, siret,
        name: u.nom_complet || u.nom_raison_sociale || '',
        address: et.adresse || '',
        active: u.etat_administratif === 'A' && et.etat_administratif === 'A',
        individual: !!(u.complements && u.complements.est_entrepreneur_individuel),
        director: [d.prenoms, d.nom].filter(Boolean).join(' ')
    };
}
module.exports = { checkSiret, luhnOk };
