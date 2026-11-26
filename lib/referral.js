// ChronoDevis – parrainage : 1 mois offert au parrain et au filleul.
// Condition : le filleul a payé un abonnement ET vérifié son SIRET (unique, différent de celui du parrain).
// Récompense : crédit sur le solde client Stripe égal au prix mensuel de la formule (Essentiel si aucune),
// déduit automatiquement de la prochaine facture. Parrain : 12 mois offerts au maximum.
'use strict';
const S = require('./server');
const { stripe, ensureCustomer } = require('./stripe');

const MONTH_CENTS = { essentiel: 1900, pro: 3900 };
const MAX_MONTHS = 12;
const isPaid = (p) => ['active', 'past_due'].includes(p.sub_status) && (p.plan === 'essentiel' || p.plan === 'pro');

async function creditMonth(p, why) {
    const customer = await ensureCustomer(p);
    const cents = MONTH_CENTS[isPaid(p) ? p.plan : 'essentiel'];
    await stripe('/customers/' + customer + '/balance_transactions', { amount: -cents, currency: 'eur', description: why, metadata: { user_id: p.id, type: 'referral' } });
    return cents / 100;
}

async function tryReward(refereeId, site) {
    if (!S.env('STRIPE_SECRET_KEY')) return;
    const f = await S.getProfile(refereeId);
    if (!f || !f.referred_by || f.ref_rewarded_at || !isPaid(f) || !f.siret_verified) return;
    const parrain = await S.getProfile(f.referred_by);
    if (!parrain || parrain.id === f.id || (parrain.siret && parrain.siret === f.siret)) return;
    // Réservation atomique : une seule récompense, même si Stripe renvoie l'événement plusieurs fois
    const claimed = await S.sb('/rest/v1/profiles?id=eq.' + encodeURIComponent(f.id) + '&ref_rewarded_at=is.null', {
        method: 'PATCH', body: { ref_rewarded_at: new Date().toISOString() }, headers: { Prefer: 'return=representation' } });
    if (!claimed || !claimed.length) return;

    const who = f.company_name || f.siret_name || f.email;
    let v1;
    try { v1 = await creditMonth(f, 'Parrainage ChronoDevis : 1 mois offert (filleul)'); }
    catch (e) { console.error('[referral] crédit filleul ' + e.message); await S.mailAdmin('Parrainage : crédit à verser à la main', [['Filleul', f.id], ['Erreur', e.message]], site); return; }
    await S.mailTo(f.contact_email || f.email, 'ChronoDevis : 1 mois offert grâce au parrainage', [['Crédit', v1.toFixed(2) + ' €'], ['Utilisation', 'Déduit automatiquement de votre prochaine facture']], site,
        'Bienvenue ! Vous avez été invité par ' + (parrain.company_name || 'un artisan') + ' : votre prochain mois est offert.');

    if ((parrain.ref_earned_months || 0) >= MAX_MONTHS) { console.log('[referral] plafond atteint ' + parrain.id); return; }
    let v2;
    try { v2 = await creditMonth(parrain, 'Parrainage ChronoDevis : 1 mois offert (' + who + ')'); }
    catch (e) { console.error('[referral] crédit parrain ' + e.message); await S.mailAdmin('Parrainage : crédit à verser à la main', [['Parrain', parrain.id], ['Filleul', f.id], ['Erreur', e.message]], site); return; }
    await S.updateProfile(parrain.id, { ref_earned_months: (parrain.ref_earned_months || 0) + 1 });
    await S.mailTo(parrain.contact_email || parrain.email, 'ChronoDevis : vous avez gagné 1 mois offert', [['Filleul', who], ['Crédit', v2.toFixed(2) + ' €'], ['Utilisation', 'Déduit automatiquement de votre prochaine facture']], site,
        'Merci d\'avoir recommandé ChronoDevis ! ' + who + ' vient de s\'abonner : votre prochain mois est offert.');
    console.log('[referral] ' + f.id + ' → ' + parrain.id);
}

module.exports = { tryReward, MAX_MONTHS };
