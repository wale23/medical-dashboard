# Système de Gestion de Cabinet Médical

Projet semestriel fullstack (React + Node.js) pour la gestion complète d'un cabinet médical.

## 📋 Documentation

- **[PROPOSITION_PROJET.md](./PROPOSITION_PROJET.md)** - Proposition détaillée complète
- **[RESUME_PROPOSITION.md](./RESUME_PROPOSITION.md)** - Résumé pour présentation
- **[DIAGRAMME_RELATIONS.md](./DIAGRAMME_RELATIONS.md)** - Diagramme des relations entre entités
- **[README_INSTALLATION.md](./README_INSTALLATION.md)** - Guide d'installation et utilisation

## 🎯 Vue d'ensemble

Cette application permet de gérer :
- ✅ Prise de rendez-vous en ligne (avec validation automatique des disponibilités)
- ✅ Gestion des dossiers patients
- ✅ Suivi des consultations médicales
- ✅ Prescriptions électroniques
- ✅ Facturation automatique (création et gestion par l'admin)
- ✅ Gestion des disponibilités des médecins (par date et heure spécifique)
- ✅ Consultation des disponibilités pour les patients
- ✅ Gestion des rendez-vous par l'admin (création, confirmation, rejet, modification, suppression)
- ✅ Accès aux consultations et profil pour les patients

## 📊 Modèle de Données

Le système comprend **8 entités principales** :

1. **Patient** - Informations des patients
2. **User** - Utilisateurs du cabinet (Médecins et Administrateurs)
3. **RendezVous** - Gestion des rendez-vous
4. **Consultation** - Suivi des consultations
5. **DossierMedical** - Dossiers médicaux complets
6. **Prescription** - Prescriptions médicales
7. **Facture** - Gestion de la facturation
8. **Disponibilite** - Horaires et disponibilités

## 🛠️ Stack Technologique

### Backend
- Node.js + Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT (Authentification)

### Frontend
- React 18 + Vite
- TypeScript
- TailwindCSS
- React Query
- React Router
- Zustand (State Management)

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Installation

1. **Installer les dépendances backend :**
```bash
cd backend
npm install
```

2. **Installer les dépendances frontend :**
```bash
cd frontend
npm install
```

3. **Configurer la base de données :**
   - Créer une base de données PostgreSQL
   - Copier `backend/env.example` vers `backend/.env` et configurer `DATABASE_URL`

4. **Initialiser la base de données :**
```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

5. **Lancer l'application :**

   Terminal 1 (Backend) :
```bash
cd backend
npm run dev
```

   Terminal 2 (Frontend) :
```bash
cd frontend
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

> **Pour plus de détails, consultez [README_INSTALLATION.md](./README_INSTALLATION.md)**

## 📁 Structure du Projet

```
final-project/
├── backend/                 # API Node.js/Express
│   ├── src/
│   │   ├── config/         # Configuration
│   │   ├── controllers/    # Contrôleurs
│   │   ├── middleware/     # Middlewares
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
│   │   ├── store/          # État global
│   │   ├── types/          # Types TypeScript
│   │   └── App.tsx         # Composant principal
│   └── package.json
│
└── README.md
```

## ✅ Respect des Exigences

- ✅ **6-8 entités principales** : 8 entités bien définies
- ✅ **Fullstack React/Node.js** : Stack moderne et performante
- ✅ **Prise de rendez-vous** : Module complet de gestion
- ✅ **Gestion des dossiers patients** : Dossiers médicaux détaillés
- ✅ **Suivi des consultations** : Historique et enregistrement complet

---

**Note** : Ce projet respecte les exigences du sujet avec 6-8 entités principales (8 entités proposées).

