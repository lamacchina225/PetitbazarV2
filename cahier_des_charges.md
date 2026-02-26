📒 Cahier des charges – Site e-commerce dropshipping « PetitBazar »
Beau design modern style apple minimaliste, zalando
1. Objectif du projet
Créer un site e-commerce dropshipping moderne, ergonomique et optimisé mobile, dédié à la vente de produits tendance provenant de Shein, Taobao, AliExpress et Temu, à destination de la Côte d’Ivoire.
Inscription avec email ou Numero de telephone.
Si client non loggé demander login une fois qu'il essaie de mettre un article au panier.
Formulaire d'inscription: Nom, Prenom, numero, mail, ville, commune
2. Contexte métier
Nom du projet : PetitBazar
Public cible : Clients résidant à Abidjan, Côte d’Ivoire
Livraison : Unique sur Abidjan (2500 FCFA), communes au choix
Import produits : Principaux sites (Shein, Taobao, AliExpress, Temu)
Pub & Réseaux : Tiktok, Instagram, Snapchat, Facebook, WhatsApp
3. Fonctionnalités principales
Côté client
Navigation fluide, catalogue produits catégorisé
Ajout panier, checkout simple (login/signup par numéro téléphone)
Paiement : Mobile Money cinetpay (Wave, Orange…), strip CB
Saisie commune Abidjan, indications livraison
Suivi commandes (notifications, email/SMS)
Côté gestionnaire (Rôle « gestion »)
Dashboard réception colis (envoi admin → gestion Abidjan)
Validation réception colis (notifie admin)
Gestion commandes clients (statuts : attente, livraison, livré)
Notifications push/email selon actions
Côté admin (Rôle « admin »)
Dashboard complet (CA, alertes, export)
Création/gestion produits (CRUD, promos, fournisseurs)
Création comptes gestionnaires
Création d’envois groupés vers Abidjan (notif gestionnaire)
Alertes push et mail (nouvelles commandes, réceptions)
Gestion rôles & logs
Visualisation rapports financiers
4. Recuperation des articles.
Etan du dropshipping, les articles doivent être ceux qui sont sur aliexpress, shein, dhgate, taobao etc...
mets moi en place tout le systeme pour récuperer les articles avec leur images et tout ce qu'il faut a afficher sur mon site
4. Flux
commande payée par le client → Déclenchement  automatique d'une tache (nouvelle commande) au role admin (l'étape ou je contacte directement le vendeur reel aliexpress ou shein ou temu pour commander l'article chez eux) et moi l'admin je mets la commande en statut "commandé chez fournisseur" ce statut n'est pas visible par le client, puis le compte admin met a jour en statut en "→ abidjan" quand le colis arrive a la boite de transit chinoise (ça pourrait être plusieurs commandes clients donc cree la possibilité de choisir les commandes que je depose chez le transporteur une fois que je choisis le statut "→ abidjan" une fois fait ça (déclencher automatiquement tache chez compte gestion (colis → abidjan) avec un bouton détail qui contient les numéros de commande qui sont contenu dans le colis
quuand le colis arrive à abidjan c'est au tour du compte gestion qui met à jour avec les statuts visibles aussi par les clients cette fois ci. en preparation, en livraison, livré
6. Rôles et accès
Admin : Accès total (d2m/(Pixel2026!))
Gestionnaire : Accès gestion commandes/réceptions (Crées par admin)
Client : Achat, suivi, notifications
8. Contraintes & exigences
Toutes les livraisons limitées à Abidjan
Adresse exportateur Paris à définir ultérieurement
Backend évolutif pour d’autres villes/pays
Sécurité et confidentialité (RGPD/Côte d’Ivoire)
9. api
CINETPAY

API: <REDACTED> SITE_ID: <REDACTED> Secret Key: <REDACTED>

Pour les tests je publirai sur vercel dans un premier temp et base de donnée neon prostgre

