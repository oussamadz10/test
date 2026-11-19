# ChronoDevis – mise en service

Plateforme de devis pour artisans : site public (FR/EN/ES/AR), application de l'artisan (`/app/`), page client de chaque artisan (`/p/<adresse>`), abonnement Stripe, essai gratuit de 7 jours sans carte.

## 1. Supabase (comptes et données)
1. Créez un projet sur https://supabase.com (région **Europe**).
2. **SQL Editor → New query** : collez le contenu de `supabase/schema.sql`, puis **Run**.
3. **Authentication → URL Configuration** :
   - Site URL : `https://chronodevisia.fr`
   - Redirect URLs : `https://chronodevisia.fr/app/` et `https://www.chronodevisia.fr/app/`
4. **Project Settings → API** : notez `Project URL`, la clé `anon` et la clé `service_role` (secrète).

## 2. Stripe (paiements)
1. Créez un compte sur https://stripe.com et complétez l'activation (SIRET, IBAN).
2. **Catalogue de produits** : créez 2 produits, chacun avec 2 prix récurrents :
   - *ChronoDevis Essentiel* : 19 € / mois et 182 € / an
   - *ChronoDevis Pro* : 39 € / mois et 374 € / an
   Notez les 4 identifiants `price_...`.
3. **Développeurs → Webhooks → Ajouter un endpoint** : `https://chronodevisia.fr/api/stripe-webhook`
   avec les événements `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Notez le secret `whsec_...`.
4. **Paramètres → Portail client** : activez-le (résiliation, factures, carte).

## 3. Vercel → Settings → Environment Variables
| Nom | Valeur |
|---|---|
| `SUPABASE_URL` | Project URL Supabase |
| `SUPABASE_ANON_KEY` | clé anon |
| `SUPABASE_SERVICE_ROLE_KEY` | clé service_role (secrète) |
| `GEMINI_API_KEY` | clé Google AI Studio (ou `GROQ_API_KEY`) |
| `STRIPE_SECRET_KEY` | `sk_live_...` (ou `sk_test_...` pour tester) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
| `STRIPE_PRICE_ESSENTIEL_MONTH` / `_YEAR` | `price_...` |
| `STRIPE_PRICE_PRO_MONTH` / `_YEAR` | `price_...` |
| `SITE_URL` | `https://chronodevisia.fr` |
| `RESEND_API_KEY` (facultatif) | envoi des notifications par Resend ; sinon FormSubmit |

Puis **Deployments → Redeploy**.

## 4. À compléter
- `public/legal.html` : bloc `EDITOR` (société éditrice, SIREN, adresse, email).
- Gemini : activer la facturation Google AI pour dépasser les quotas gratuits quand le trafic augmente.

## Développement
- Pages publiques : `python3 tools/gen_site.py`
- Traductions de l'application : `python3 tools/i18n_src.py`
