# Guide d'Installation - Cabinet Médical

Ce guide vous explique comment installer et lancer le projet de gestion de cabinet médical.

## Prérequis

- **Node.js** (version 18 ou supérieure)
- **npm** ou **yarn**
- **PostgreSQL** (version 14 ou supérieure)
- **Git**

## Installation

### 1. Installation des dépendances

#### Backend

```bash
cd backend
npm install
```

#### Frontend

```bash
cd frontend
npm install
```

### 2. Configuration de la base de données

1. Créer une base de données PostgreSQL :

```sql
CREATE DATABASE cabinet_medical;
```

2. Configurer les variables d'environnement du backend :

Créez un fichier `.env` dans le dossier `backend/` avec le contenu suivant :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/cabinet_medical?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
```

Remplacez `user` et `password` par vos identifiants PostgreSQL.

### 3. Initialisation de la base de données

```bash
cd backend

# Générer le client Prisma
npm run prisma:generate

# Créer les migrations
npm run prisma:migrate

# (Optionnel) Ouvrir Prisma Studio pour visualiser la base de données
npm run prisma:studio
```

### 4. Création des utilisateurs par défaut

Exécutez le script de seed pour créer des comptes de démonstration :

```bash
cd backend
npm run prisma:seed
```

Cela créera deux comptes :
- **Admin**: `admin@cabinet.com` / `admin123`
- **Médecin**: `medecin@cabinet.com` / `medecin123`

## Lancement de l'application

### Backend (Terminal 1)

```bash
cd backend
npm run dev
```

Le serveur backend sera accessible sur `http://localhost:5000`

### Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

L'application frontend sera accessible sur `http://localhost:3000`

## Structure du Projet

```
final-project/
├── backend/                 # API Node.js/Express
│   ├── src/
│   │   ├── config/         # Configuration (database, etc.)
│   │   ├── controllers/    # Contrôleurs (logique métier)
│   │   ├── middleware/     # Middlewares (auth, errors)
│   │   ├── routes/         # Routes API
│   │   └── index.ts        # Point d'entrée
│   ├── prisma/
│   │   └── schema.prisma   # Schéma de base de données
│   └── package.json
│
├── frontend/               # Application React
│   ├── src/
│   │   ├── components/     # Composants React
│   │   ├── pages/          # Pages de l'application
│   │   ├── services/       # Services API
│   │   ├── store/          # État global (Zustand)
│   │   ├── types/          # Types TypeScript
│   │   └── App.tsx         # Composant principal
│   └── package.json
│
└── README.md
```

## Scripts disponibles

### Backend

- `npm run dev` - Lance le serveur en mode développement
- `npm run build` - Compile le TypeScript
- `npm run start` - Lance le serveur compilé
- `npm run prisma:generate` - Génère le client Prisma
- `npm run prisma:migrate` - Crée/applique les migrations
- `npm run prisma:studio` - Ouvre Prisma Studio

### Frontend

- `npm run dev` - Lance le serveur de développement
- `npm run build` - Compile l'application pour la production
- `npm run preview` - Prévisualise la version de production
- `npm run lint` - Vérifie le code avec ESLint

## Utilisation

1. Accédez à `http://localhost:3000`
2. Connectez-vous avec un compte médecin
3. Explorez les différentes fonctionnalités :
   - Gestion des patients
   - Prise de rendez-vous
   - Consultations
   - Prescriptions
   - Facturation

## API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription (création de compte médecin)

### Patients
- `GET /api/patients` - Liste des patients
- `GET /api/patients/:id` - Détails d'un patient
- `POST /api/patients` - Créer un patient
- `PUT /api/patients/:id` - Modifier un patient
- `DELETE /api/patients/:id` - Supprimer un patient

### Rendez-vous
- `GET /api/rendez-vous` - Liste des rendez-vous
- `GET /api/rendez-vous/:id` - Détails d'un rendez-vous
- `POST /api/rendez-vous` - Créer un rendez-vous
- `PUT /api/rendez-vous/:id` - Modifier un rendez-vous
- `DELETE /api/rendez-vous/:id` - Supprimer un rendez-vous

### Consultations
- `GET /api/consultations` - Liste des consultations
- `GET /api/consultations/:id` - Détails d'une consultation
- `POST /api/consultations` - Créer une consultation
- `PUT /api/consultations/:id` - Modifier une consultation

Et bien d'autres endpoints pour les autres entités...

## Notes

- Assurez-vous que PostgreSQL est en cours d'exécution avant de lancer le backend
- Le frontend utilise un proxy pour communiquer avec le backend (configuré dans `vite.config.ts`)
- Les tokens JWT sont stockés dans le localStorage du navigateur

## Support

Pour toute question ou problème, consultez la documentation ou contactez l'équipe de développement.

