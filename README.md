# 🏪 PetitBazar - E-commerce Dropshipping Platform

Une plateforme e-commerce dropshipping moderne et complète dédiée à la vente de produits tendance en Côte d'Ivoire, avec un système sophistiqué de gestion de commandes et de livraisons.

## 🎯 Vue d'ensemble

PetitBazar est un site e-commerce dropshipping moderne au design minimaliste (inspiration Apple/Zalando) qui permet :

- **Clients** : Acheter des produits importés de Shein, AliExpress, Taobao et Temu
- **Gestionnaires** : Gérer les livraisons à Abidjan
- **Administrateurs** : Gérer complètement la plateforme

## 🛠️ Stack Technologique

### Frontend
- **Next.js 14** - Framework React moderne
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styles moderne et minimaliste
- **React Query** - Gestion des données
- **React Hook Form** - Gestion des formulaires
- **Zustand** - État global simple

### Backend
- **Next.js API Routes** - Endpoints RESTful
- **Prisma ORM** - Gestion de la base de données
- **NextAuth.js** - Authentification sécurisée
- **bcryptjs** - Hashage des mots de passe

### Base de données
- **PostgreSQL** (Neon) - Base de données relationnelle

### Paiements
- **Stripe** - Paiements par carte bancaire
- **Cinetpay** - Mobile Money (Wave, Orange Money)

## 📋 Prérequis

- Node.js 18+
- npm ou yarn
- PostgreSQL (Neon)
- Compte Stripe
- Compte Cinetpay

## 🚀 Installation

### 1. Cloner le repo
```bash
git clone <repo>
cd petitbazarv2-app
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configuration des variables d'environnement
Créez un fichier `.env.local` à la racine du projet :

```env
# Database - PostgreSQL (Neon)
DATABASE_URL="postgresql://user:password@db.neondb.io:5432/petitbazar"

# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxx"
STRIPE_SECRET_KEY="sk_test_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"

# Cinetpay Configuration
CINETPAY_API_KEY="your-cinetpay-api-key"
CINETPAY_SITE_ID="your-cinetpay-site-id"
CINETPAY_SECRET_KEY="your-cinetpay-secret-key"
NEXT_PUBLIC_CINETPAY_ENDPOINT="https://api.cinetpay.com"

# Email Configuration (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@petitbazar.ci"

# Admin Credentials
ADMIN_EMAIL="admin@petitbazar.ci"
ADMIN_PASSWORD="change-me"
```

### 4. Configuration de la base de données
```bash
# Générer le client Prisma
npm run db:generate

# Créer et migrer la base de données
npm run db:push

# Optionnel : ouvrir Prisma Studio pour vérifier
npm run db:studio
```

### 5. Lancer l'application
```bash
npm run dev
```

Accédez à l'application sur `http://localhost:3000`

## 📁 Structure du projet

```
.
├── app/                          # Pages Next.js et API routes
│   ├── api/                      # Endpoints API
│   │   ├── auth/                 # Authentication
│   │   ├── cart/                 # Shopping cart
│   │   ├── orders/               # Order management
│   │   └── products/             # Product management
│   ├── admin/                    # Admin dashboard
│   ├── gestionnaire/             # Manager dashboard
│   ├── login/                    # Login page
│   ├── register/                 # Registration page
│   ├── products/                 # Product listing
│   ├── cart/                     # Shopping cart
│   └── checkout/                 # Checkout process
├── components/                   # Composants réutilisables
│   ├── auth/                     # Formulaires d'auth
│   ├── products/                 # Composants produits
│   ├── admin/                    # Composants admin
│   └── providers/                # Providers (auth, etc.)
├── lib/                          # Utilitaires et config
│   ├── auth.ts                   # Configuration NextAuth
│   └── prisma.ts                 # Client Prisma
├── prisma/                       # Schéma et migrations
│   ├── schema.prisma             # Modèles de données
│   └── seed.ts                   # Données d'exemple
├── types/                        # Définitions TypeScript
└── public/                       # Fichiers statiques
```

## 🔐 Authentification et Rôles

### Admin
- **Email** : admin@petitbazar.ci
- **Mot de passe** : change-me
- **Accès** : Tableau de bord complet, gestion produits, commandes, utilisateurs, expéditions

### Gestionnaire
- Créé par l'admin
- Gestion des colis et livraisons à Abidjan

### Client
- Inscription email/téléphone
- Achat de produits
- Suivi des commandes

## 📊 Flux de commande

1. **Client passe commande** → Produit ajouté au panier
2. **Paiement** → Via Stripe ou Cinetpay
3. **Admin reçoit notification** → Commande marquée "commandé chez fournisseur"
4. **Admin crée expédition** → Groupe les commandes pour Abidjan
5. **Gestionnaire reçoit tâche** → Met à jour statut de livraison
6. **Client reçoit notification** → Suivi en temps réel
7. **Livraison** → Commande marquée "Livré"

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion

### Cart
- `GET /api/cart` - Récupérer le panier
- `POST /api/cart` - Ajouter au panier
- `PUT /api/cart` - Mettre à jour quantité
- `DELETE /api/cart/[productId]` - Supprimer du panier

### Orders
- `GET /api/orders` - Récupérer les commandes
- `POST /api/orders` - Créer une commande
- `GET /api/orders/[orderId]` - Détails de la commande
- `PUT /api/orders/[orderId]` - Mettre à jour le statut

### Products (Admin)
- `GET /api/products` - Lister les produits
- `POST /api/products` - Créer un produit
- `PUT /api/products/[productId]` - Modifier un produit
- `DELETE /api/products/[productId]` - Supprimer un produit

## 💳 Intégration Paiements

### Stripe
Configuration pour les paiements par carte bancaire internatio ↩️nales.

### Cinetpay
Configuration pour Mobile Money (Wave, Orange Money) en Afrique de l'Ouest.

## 📱 Responsive Design

L'application est entièrement responsive et optimisée pour :
- Desktop (1920px+)
- Tablette (768px - 1919px)
- Mobile (< 768px)

## 🚢 Déploiement

### Sur Vercel

1. Connectez le repo GitHub à Vercel
2. Configurez les variables d'environnement
3. Déployez automatiquement

```bash
# Ou déployer manuellement
npm run build
npm start
```

## 📝 Tâches Restantes

- [ ] Intégration API Cinetpay complète
- [ ] Scraping automatique des produits (AliExpress, Shein, etc.)
- [ ] Système de notifications push
- [ ] Rapports financiers et analytics
- [ ] Gestion des retours/échanges
- [ ] Système de coupons/promotions
- [ ] Intégration WhatsApp/SMS
- [ ] Support multilingue
- [ ] Tests automatisés

## 👨‍💻 Développement

### Exécuter les migrations

```bash
npm run db:push
```

### Accéder à Prisma Studio

```bash
npm run db:studio
```

### Générer les migrations

```bash
npx prisma migrate dev --name <migration_name>
```

## 📞 Support

Pour toute question ou problème, contactez : contact@petitbazar.ci

## 📄 Licence

Propriétaire - D2M 2024

## 🙏 Remerciements

- Design inspiré par Apple et Zalando
- Produits de Shein, AliExpress, Taobao, Temu
- Livraisons à Abidjan, Côte d'Ivoire

