# -*- coding: utf-8 -*-
# Articles du blog ChronoDevis (français). Corps en HTML simple, FAQ en (question, réponse).
DATE = '2026-11-25'
DATE_FR = '25 novembre 2026'

POSTS = [
dict(
slug='mentions-obligatoires-devis-artisan',
title="Mentions obligatoires d'un devis d'artisan en 2026 : la check-list complète",
short="Mentions obligatoires d'un devis",
desc="Toutes les mentions obligatoires d'un devis d'artisan en 2026 : identité, prix détaillé, TVA, validité, assurance décennale, rétractation. Check-list et FAQ.",
lead="Un devis incomplet, c'est un client qui hésite, un litige plus difficile à gagner et, en cas de contrôle, une amende. Voici la liste des informations à faire figurer sur chaque devis, avec les pièges les plus fréquents.",
read=7,
body='''
<h2>Le devis est-il obligatoire ?</h2>
<p>Pour les prestations de <strong>dépannage, réparation et entretien</strong> dans le bâtiment et l'équipement de la maison (plomberie, chauffage, électricité, maçonnerie, menuiserie, serrurerie, couverture, etc.), l'arrêté du 24 janvier 2017 impose un devis détaillé <strong>dès le premier euro</strong>, remis au client avant toute intervention, y compris en cas d'urgence. L'ancien seuil de 150 € TTC a été supprimé.</p>
<p>Pour les autres travaux, le devis n'est pas toujours imposé par un texte, mais le Code de la consommation oblige à informer le client du prix et des caractéristiques de la prestation avant qu'il s'engage. Dans les faits, le devis écrit est la meilleure façon de le prouver.</p>

<h2>La check-list des mentions</h2>
<h3>1. Le document lui-même</h3>
<ul>
<li>Le mot <strong>« Devis »</strong> et un numéro unique.</li>
<li>La <strong>date de rédaction</strong>.</li>
<li>La <strong>durée de validité</strong> de l'offre (par exemple 30 ou 90 jours).</li>
<li>Le <strong>caractère gratuit ou payant</strong> du devis, et son prix s'il est payant.</li>
</ul>
<h3>2. Votre entreprise</h3>
<ul>
<li>Nom et prénom (ou dénomination), nom commercial le cas échéant, et statut : par exemple « Entrepreneur individuel » ou « EI ».</li>
<li>Adresse, téléphone et adresse e-mail.</li>
<li>Numéros <strong>SIREN / SIRET</strong> et immatriculation (RNE, mention RCS ou métiers selon l'activité).</li>
<li>Numéro de TVA intracommunautaire si vous facturez la TVA.</li>
</ul>
<h3>3. Le client et le chantier</h3>
<ul>
<li>Nom et adresse du client.</li>
<li>Adresse du lieu d'exécution s'il est différent.</li>
<li>Date de début prévue et durée estimée des travaux.</li>
</ul>
<h3>4. Le prix, ligne par ligne</h3>
<ul>
<li>Le <strong>décompte détaillé</strong> de chaque prestation et fourniture : désignation, quantité, unité, prix unitaire.</li>
<li>La <strong>main-d'œuvre</strong> : taux horaire et temps estimé, ou forfait.</li>
<li>Les <strong>frais de déplacement</strong> s'il y en a.</li>
<li>Le total <strong>HT</strong>, le ou les <strong>taux de TVA</strong> et le total <strong>TTC</strong>. En franchise en base, indiquez « TVA non applicable, art. 293 B du CGI » et un montant net.</li>
<li>Les conditions de paiement : acompte éventuel, échéances, moyens acceptés.</li>
</ul>
<h3>5. L'assurance</h3>
<p>Si votre métier impose une assurance professionnelle (c'est le cas de la <strong>garantie décennale</strong> pour la plupart des travaux du bâtiment), le devis doit mentionner l'assurance souscrite, les coordonnées de l'assureur et la couverture géographique du contrat. Dans le bâtiment, l'attestation d'assurance est aussi à joindre aux devis et factures.</p>
<h3>6. Selon les cas</h3>
<ul>
<li><strong>Devis signé hors de vos locaux</strong> (chez le client, après un appel ou par internet) : l'information sur le <strong>droit de rétractation de 14 jours</strong> et le formulaire type de rétractation. Voir notre guide <a href="/blog/devis-signe-retractation-acompte/">devis signé et rétractation</a>.</li>
<li><strong>Dépannage et réparation</strong> : l'indication que le client peut conserver les pièces ou appareils remplacés.</li>
<li>Les coordonnées du <strong>médiateur de la consommation</strong> auquel vous adhérez (sur le devis, vos conditions générales ou votre site).</li>
<li>L'espace de signature du client, avec la date et la mention « Devis reçu avant l'exécution des travaux ».</li>
</ul>

<h2>Les erreurs qui coûtent cher</h2>
<ul>
<li><strong>Un forfait global sans détail</strong> : en cas de désaccord, impossible de prouver ce qui était inclus.</li>
<li><strong>Pas de durée de validité</strong> : le client peut accepter votre prix des mois plus tard, alors que les matériaux ont augmenté.</li>
<li><strong>Un taux de TVA mal choisi</strong> (10 %, 5,5 % ou 20 %) : c'est vous qui payez la différence en cas de redressement.</li>
<li><strong>Oublier l'assurance</strong> : c'est l'une des premières choses que regarde un client prudent, et un contrôle DGCCRF peut la sanctionner.</li>
</ul>
<p>Avec <a href="/app/?signup=1">ChronoDevis</a>, ces mentions sont reprises automatiquement depuis vos paramètres (SIRET vérifié, statut, TVA, assurance) sur chaque devis, et le client peut signer en ligne.</p>
''',
faq=[
("Un devis non signé engage-t-il l'artisan ?", "Oui, pendant sa durée de validité. Le devis est une offre : si le client l'accepte dans le délai indiqué, vous devez réaliser les travaux au prix annoncé. D'où l'intérêt d'indiquer une durée de validité raisonnable."),
("Peut-on faire un devis à la main ?", "Oui, s'il contient toutes les mentions obligatoires et qu'il est lisible. Un devis numérique reste plus pratique : numérotation automatique, calculs justes, copie conservée et signature en ligne."),
("Un micro-entrepreneur doit-il indiquer la TVA sur son devis ?", "S'il bénéficie de la franchise en base, il ne facture pas de TVA et doit indiquer « TVA non applicable, art. 293 B du CGI ». S'il dépasse les seuils, il doit facturer la TVA à partir de la date prévue par la loi."),
("Combien de temps conserver un devis ?", "Pour le dépannage et la réparation, l'arrêté de 2017 impose de conserver un exemplaire au moins un an. En pratique, gardez le devis signé avec la facture : il sert de preuve en cas de litige ou de mise en jeu de la garantie décennale."),
("La facture électronique concerne-t-elle les devis ?", "Non, la réforme vise les factures entre entreprises. Les micro-entrepreneurs doivent pouvoir recevoir des factures électroniques depuis le 1er septembre 2026 et devront en émettre à partir du 1er septembre 2027 pour leurs clients professionnels."),
("Que risque un artisan si une mention manque ?", "Une amende administrative en cas de contrôle (information du consommateur, mention d'assurance), et surtout une position plus faible en cas de litige : le juge interprète un document flou en faveur du consommateur."),
],
),

dict(
slug='devis-signe-retractation-acompte',
title="Devis signé chez le client : rétractation de 14 jours, acompte et travaux urgents",
short="Devis signé, rétractation et acompte",
desc="Votre client a signé le devis chez lui : peut-il annuler ? Délai de rétractation de 14 jours, acompte interdit pendant 7 jours, exception des travaux urgents, arrhes ou acompte. FAQ.",
lead="Beaucoup d'artisans font signer le devis sur place, dans la cuisine du client. C'est pratique, mais ce n'est pas un contrat comme les autres : le client peut changer d'avis et vous ne pouvez pas encaisser tout de suite. Voici les règles, simplement.",
read=6,
body='''
<h2>Où le devis est-il signé ? Tout part de là</h2>
<p>Le Code de la consommation distingue deux situations :</p>
<ul>
<li><strong>Signé dans vos locaux</strong> (atelier, boutique) : le devis signé est un contrat ferme. Pas de délai de rétractation légal.</li>
<li><strong>Signé hors établissement</strong> : chez le client, sur un salon, juste après une visite, ou <strong>à distance</strong> (e-mail, internet, téléphone). Le client particulier dispose alors d'un <strong>droit de rétractation de 14 jours</strong>, sans avoir à se justifier.</li>
</ul>
<p>Pour un artisan qui se déplace, c'est donc le cas le plus fréquent.</p>

<h2>Les 14 jours en pratique</h2>
<ul>
<li>Pour une prestation de service, le délai court à partir de la <strong>signature</strong> du devis.</li>
<li>Vous devez informer le client de ce droit et lui remettre le <strong>formulaire de rétractation</strong>. Sinon, le délai est prolongé de <strong>12 mois</strong>.</li>
<li>Le client peut se rétracter par le formulaire ou par toute déclaration claire (lettre recommandée, e-mail).</li>
<li>Vous devez alors rembourser les sommes reçues.</li>
</ul>

<h2>Peut-on encaisser un acompte ?</h2>
<p>Pas tout de suite. Pour un contrat conclu hors établissement, <strong>aucun paiement ne peut être reçu avant 7 jours</strong> à compter de la signature, sous quelque forme que ce soit (chèque, virement, espèces). Un chèque daté du jour mais « à encaisser plus tard » est aussi interdit.</p>
<p>Après ces 7 jours, un acompte est possible, mais il devra être remboursé si le client se rétracte avant la fin des 14 jours.</p>

<h2>L'exception des travaux urgents</h2>
<p>Le droit de rétractation et l'interdiction de paiement ne s'appliquent pas aux <strong>travaux d'entretien ou de réparation à réaliser en urgence</strong> au domicile du client et <strong>expressément demandés par lui</strong> : une fuite d'eau, une panne de chauffage en hiver, une serrure bloquée.</p>
<p>Gardez une trace écrite de la demande d'intervention urgente (SMS, e-mail, mention signée sur le devis) et limitez-vous à ce qui est vraiment urgent. Les travaux en plus relèvent d'un nouveau devis.</p>

<h2>Le client veut que vous commenciez avant 14 jours</h2>
<p>C'est possible, s'il le demande <strong>expressément, par écrit ou sur un support durable</strong>. S'il se rétracte ensuite, il vous doit le montant correspondant au travail déjà fait. Si la prestation est entièrement réalisée avec son accord avant la fin du délai, il ne peut plus se rétracter.</p>

<h2>Acompte ou arrhes : le mot compte</h2>
<p>Entre un professionnel et un particulier, une somme versée d'avance est considérée comme des <strong>arrhes</strong>, sauf si le contrat dit le contraire. Avec des arrhes, le client peut renoncer en perdant la somme, et vous pouvez renoncer en rendant le double. Avec un <strong>acompte</strong>, le contrat est ferme pour les deux. Écrivez donc clairement « acompte » sur le devis si c'est ce que vous voulez.</p>

<p>Avec la <a href="/app/?signup=1">signature en ligne ChronoDevis</a>, la date et l'heure exactes de la signature sont enregistrées, ce qui facilite le calcul des délais de 7 et 14 jours.</p>
''',
faq=[
("Le client a signé le devis chez lui, puis-je commencer demain ?", "Seulement s'il vous le demande expressément par écrit (ou si c'est une réparation urgente qu'il a sollicitée). Sinon, attendez la fin des 14 jours pour éviter de travailler sans être payé."),
("Un devis signé par e-mail ou en ligne ouvre-t-il un droit de rétractation ?", "Oui, si le client est un particulier : c'est un contrat conclu à distance, avec les mêmes 14 jours que pour une signature à domicile."),
("Ces règles s'appliquent-elles quand le client est une entreprise ?", "En principe non, la rétractation protège les consommateurs. Exception : un professionnel de 5 salariés au plus, hors de son activité principale, peut en bénéficier pour un contrat signé hors établissement."),
("Le client se rétracte au 10e jour : que dois-je rembourser ?", "Tout ce qu'il a versé, dans les 14 jours. Si vous aviez commencé à sa demande écrite, vous pouvez retenir le prix du travail déjà réalisé, proportionnellement au total."),
("Que se passe-t-il si j'ai oublié le formulaire de rétractation ?", "Le délai de rétractation est prolongé de 12 mois. Le client pourrait donc annuler bien après la fin du chantier. Joignez toujours le formulaire aux devis signés hors de vos locaux."),
("Le client peut-il annuler un devis signé dans mon atelier ?", "Non, sauf accord entre vous, faute grave de votre part ou clause prévue au contrat. Il reste tenu de payer, et peut être condamné à vous indemniser s'il annule sans raison."),
],
),

dict(
slug='travaux-supplementaires-devis-depasse',
title="Devis dépassé, travaux supplémentaires, devis payant : comment éviter les litiges",
short="Travaux supplémentaires et devis dépassé",
desc="Le chantier coûte plus que prévu ? Travaux supplémentaires, avenant, durée de validité, erreur de prix, devis payant : les règles et les bons réflexes pour l'artisan. FAQ.",
lead="« Ce n'était pas prévu dans le devis » : c'est la phrase qui déclenche la plupart des disputes de fin de chantier. La solution tient en une règle simple : rien ne s'ajoute sans un écrit signé. Voici comment faire.",
read=6,
body='''
<h2>Le devis signé fixe le prix</h2>
<p>Une fois accepté, le devis engage les deux parties sur le contenu et le prix. Pour un <strong>marché à forfait</strong> (un prix global pour un ouvrage défini), le Code civil est strict : vous ne pouvez pas réclamer d'augmentation, ni pour la hausse des matériaux, ni pour des changements, <strong>sauf si ceux-ci ont été autorisés par écrit et leur prix convenu avec le client</strong>.</p>
<p>Concrètement, un supplément oral, même évident, est très difficile à faire payer.</p>

<h2>La bonne méthode : le devis complémentaire (avenant)</h2>
<ol>
<li><strong>Arrêtez-vous</strong> dès que vous découvrez l'imprévu (tuyau corrodé, mur non porteur qui l'est, support à reprendre).</li>
<li><strong>Prenez des photos</strong> et expliquez le problème au client.</li>
<li><strong>Rédigez un devis complémentaire</strong> numéroté, qui fait référence au devis initial, avec le détail et le prix des travaux en plus et le nouveau délai.</li>
<li><strong>Faites-le signer avant</strong> de réaliser les travaux. Une signature en ligne depuis le téléphone suffit et laisse une trace datée.</li>
</ol>
<p>Si le client refuse, vous avez une preuve qu'il a été informé, ce qui protège votre responsabilité pour la suite.</p>

<h2>Prévoir l'imprévu dès le premier devis</h2>
<ul>
<li>Listez ce qui est <strong>exclu</strong> (« reprise de maçonnerie non comprise », « évacuation des gravats en option »).</li>
<li>Indiquez les <strong>hypothèses</strong> de votre prix (« sous réserve de l'état des canalisations encastrées »).</li>
<li>Prévoyez des lignes en <strong>option</strong> chiffrées que le client coche ou non.</li>
<li>Gardez une <strong>durée de validité courte</strong> (1 à 3 mois) si vos prix de matériaux bougent souvent.</li>
</ul>

<h2>Et si vous vous êtes trompé dans votre prix ?</h2>
<p>Une erreur de calcul ou un oubli de ligne vous engage en principe, une fois le devis signé. Seule une erreur grossière et évidente (un zéro manquant, par exemple) peut être discutée. D'où l'intérêt de faire relire ses totaux, ou de laisser un outil faire les calculs.</p>

<h2>Peut-on faire payer un devis ?</h2>
<p>Oui. Le devis est en principe gratuit, mais vous pouvez le facturer, en particulier quand il demande un <strong>déplacement</strong> ou une <strong>étude approfondie</strong> (relevés, plans, diagnostic). Deux conditions : prévenir le client <strong>avant</strong> de l'établir et en indiquer le prix. Beaucoup d'artisans déduisent ensuite ce montant de la facture si le client accepte les travaux.</p>

<p>Dans <a href="/app/?signup=1">ChronoDevis</a>, dupliquez le devis initial pour créer un complémentaire en quelques secondes, puis envoyez le lien de signature au client par SMS ou WhatsApp.</p>
''',
faq=[
("Le client a accepté oralement des travaux en plus, puis refuse de payer. Que faire ?", "Rassemblez toutes les preuves de son accord : SMS, e-mails, messages vocaux, témoins, photos. Un juge peut reconnaître un accord sans devis signé s'il est clairement prouvé, mais c'est incertain. Pour l'avenir, faites toujours signer un complémentaire avant."),
("Quelle durée de validité mettre sur un devis ?", "Aucune durée n'est imposée par la loi, mais elle doit être indiquée. 30 jours pour le dépannage, 1 à 3 mois pour la rénovation, c'est l'usage. Passé ce délai, vous pouvez refaire un devis à jour."),
("Puis-je augmenter mon prix si les matériaux ont augmenté pendant le chantier ?", "Pas sur un devis signé à prix forfaitaire, sauf clause de révision prévue au contrat et acceptée par le client. Protégez-vous avec une durée de validité courte et une clause claire pour les chantiers longs."),
("Un devis payant est-il déductible de la facture ?", "Seulement si vous l'avez prévu : rien ne l'impose. Annoncer « devis de 60 € déduit en cas de commande » rassure le client et filtre les demandes peu sérieuses."),
("Faut-il un nouveau devis pour chaque petit ajout ?", "Pour le dépannage et la réparation, un devis détaillé est exigé dès le premier euro. Pour les autres travaux, un avenant court et signé suffit, mais il doit préciser la prestation et son prix."),
],
),

dict(
slug='client-ne-paie-pas-devis-facture-impayee',
title="Client qui ne répond plus ou ne paie pas : relances, mise en demeure et recours",
short="Client qui ne paie pas",
desc="Devis sans réponse ou facture impayée : comment relancer, rédiger la mise en demeure, calculer les pénalités et saisir le juge (injonction de payer). Délais de prescription. FAQ.",
lead="Deux problèmes empoisonnent la trésorerie des artisans : les devis qui restent sans réponse et les factures qui ne sont jamais réglées. Le premier se traite avec de bonnes relances, le second avec une procédure précise, et des délais à ne pas laisser passer.",
read=7,
body='''
<h2>1. Le devis reste sans réponse</h2>
<p>Un devis envoyé n'est pas un devis vendu. Quelques habitudes simples augmentent nettement le taux de signature :</p>
<ul>
<li><strong>Envoyez vite</strong> : le jour même ou le lendemain de la visite, quand le client est encore motivé.</li>
<li><strong>Relancez à J+3 puis à J+10</strong>, par le canal que le client utilise (SMS, WhatsApp, e-mail). Une question ouverte marche mieux que « avez-vous reçu mon devis ? » : « Souhaitez-vous que j'ajuste une option ? ».</li>
<li><strong>Rappelez la durée de validité</strong> sans pression excessive.</li>
<li><strong>Facilitez la signature</strong> : un lien à ouvrir sur le téléphone, sans imprimer ni scanner.</li>
</ul>

<h2>2. La facture n'est pas payée : la procédure</h2>
<h3>Étape 1 : la relance amiable</h3>
<p>Dès le lendemain de l'échéance, un rappel courtois avec la facture en pièce jointe. Beaucoup de retards sont des oublis.</p>
<h3>Étape 2 : la mise en demeure</h3>
<p>Après une ou deux relances sans effet, envoyez une <strong>mise en demeure par lettre recommandée avec accusé de réception</strong>. Elle indique : la facture concernée, le montant dû, un délai pour payer (8 ou 15 jours) et les suites prévues (saisine du juge). Pour un particulier, elle fait courir les <strong>intérêts au taux légal</strong>.</p>
<h3>Étape 3 : la conciliation (facultative)</h3>
<p>Un <strong>conciliateur de justice</strong>, gratuit, peut aider à trouver un accord, par exemple un paiement en plusieurs fois. C'est souvent rapide pour les petits montants.</p>
<h3>Étape 4 : l'injonction de payer</h3>
<p>Si la créance est certaine (devis signé, travaux faits, facture), l'<strong>injonction de payer</strong> est la voie la plus simple : une requête au tribunal judiciaire, sans audience au départ, avec les justificatifs. Si le juge l'accorde, l'ordonnance doit ensuite être <strong>signifiée par un commissaire de justice</strong> au client, qui peut s'y opposer dans un délai d'un mois.</p>

<h2>Attention au délai de 2 ans</h2>
<p>Contre un <strong>particulier</strong>, vous n'avez que <strong>2 ans</strong> pour agir en paiement (contre 5 ans en général entre professionnels). Et une mise en demeure, même en recommandé, <strong>n'arrête pas ce délai</strong> : il faut une action en justice, comme la signification d'une ordonnance d'injonction de payer. Ne laissez pas traîner un impayé plus de quelques mois.</p>

<h2>Client professionnel : pénalités et indemnité de 40 €</h2>
<p>Entre professionnels, vos factures doivent mentionner le taux des <strong>pénalités de retard</strong> et l'<strong>indemnité forfaitaire de 40 €</strong> pour frais de recouvrement. Ces sommes sont dues de plein droit dès le premier jour de retard, sans relance préalable.</p>

<h2>Prévenir plutôt que guérir</h2>
<ul>
<li>Un <strong>devis signé</strong> et détaillé : c'est la preuve n° 1 devant le juge.</li>
<li>Un <strong>acompte</strong> à la commande (en respectant le délai de 7 jours pour un devis signé chez le client, voir <a href="/blog/devis-signe-retractation-acompte/">notre guide</a>).</li>
<li>Une facture <strong>remise dès la fin des travaux</strong>, avec un procès-verbal de réception si possible.</li>
<li>Des <strong>photos</strong> avant et après chantier.</li>
</ul>
<p>Avec <a href="/app/?signup=1">ChronoDevis</a>, le client signe le devis en ligne : nom, signature, date, heure et empreinte du document sont conservés, ce qui constitue une preuve solide en cas d'impayé.</p>
''',
faq=[
("Au bout de combien de temps relancer un devis ?", "Trois jours après l'envoi pour une première relance, puis une dizaine de jours après. Au-delà de deux relances sans réponse, mieux vaut passer à autre chose et garder le contact pour plus tard."),
("Une mise en demeure par e-mail est-elle valable ?", "Elle peut l'être si elle est claire et que vous prouvez sa réception, mais la lettre recommandée avec accusé de réception reste la référence en cas de procès."),
("Combien coûte une injonction de payer ?", "La requête au tribunal est gratuite. La signification par commissaire de justice est payante (quelques dizaines d'euros), et ces frais peuvent être mis à la charge du débiteur."),
("Puis-je appliquer l'indemnité de 40 € à un particulier ?", "Non, elle est réservée aux factures entre professionnels. Avec un particulier, vous pouvez réclamer les intérêts au taux légal à partir de la mise en demeure, et éventuellement des dommages-intérêts."),
("Le client conteste la qualité des travaux pour ne pas payer. Que faire ?", "Demandez-lui par écrit de préciser les défauts, proposez de constater ensemble sur place et de reprendre ce qui doit l'être. Si le désaccord persiste, la conciliation ou une expertise permettent de trancher. L'injonction de payer est moins adaptée quand la créance est contestée."),
("Puis-je garder le matériel posé tant que le client ne paie pas ?", "Non, vous ne pouvez pas démonter des travaux réalisés pour faire pression. Une clause de réserve de propriété peut concerner des biens livrés non encore installés, mais elle doit avoir été prévue par écrit."),
],
),
]
