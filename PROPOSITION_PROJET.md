# Proposition de Projet : Système de Gestion de Cabinet Médical

## Vue d'ensemble
Application web fullstack (React + Node.js/Express) pour la gestion complète d'un cabinet médical, incluant la prise de rendez-vous, la gestion des dossiers patients et le suivi des consultations.

---

## Architecture du Modèle de Données (8 Entités Principales)

### 1. **Patient**
Stocke les informations des patients.
- `id` (UUID, Primary Key)
- `nom` (String, requis)
- `prenom` (String, requis)
- `dateNaissance` (Date, requis)
- `sexe` (Enum: 'M', 'F', 'Autre')
- `telephone` (String, requis, unique)
- `email` (String, unique)
- `adresse` (String)
- `numeroSS` (String, unique) - Numéro de sécurité sociale
- `groupeSanguin` (String, optionnel)
- `allergies` (Text, optionnel)
- `antecedents` (Text, optionnel)
- `createdAt` (Date)
- `updatedAt` (Date)

**Relations :**
- Un Patient a plusieurs Rendez-vous (One-to-Many)
- Un Patient a plusieurs Consultations (One-to-Many)
- Un Patient a un Dossier Médical (One-to-One)
- Un Patient a plusieurs Factures (One-to-Many)

---

### 2. **User**
Informations des utilisateurs du cabinet (médecins et administrateurs).
- `id` (UUID, Primary Key)
- `nom` (String, requis)
- `prenom` (String, requis)
- `specialite` (String, requis) - Ex: "Cardiologie", "Pédiatrie", "Médecine générale"
- `numeroOrdre` (String, requis, unique) - Numéro d'ordre des médecins
- `telephone` (String, requis)
- `email` (String, requis, unique)
- `motDePasse` (String, hashé) - Pour l'authentification
- `userRole` (Enum: 'medecin', 'admin')
- `photo` (String, URL) - Photo de profil
- `createdAt` (Date)
- `updatedAt` (Date)

**Relations :**
- Un Utilisateur a plusieurs Rendez-vous (One-to-Many)
- Un Utilisateur a plusieurs Consultations (One-to-Many)
- Un Utilisateur a plusieurs Disponibilités (One-to-Many)
- Un Utilisateur a plusieurs Prescriptions (One-to-Many)

---

### 3. **RendezVous (Appointment)**
Gestion des rendez-vous.
- `id` (UUID, Primary Key)
- `patientId` (UUID, Foreign Key → Patient)
- `userId` (UUID, Foreign Key → User)
- `dateHeure` (DateTime, requis)
- `duree` (Integer) - Durée en minutes (défaut: 30)
- `statut` (Enum: 'planifie', 'confirme', 'annule', 'termine', 'absent')
- `motif` (String) - Raison du rendez-vous
- `notes` (Text) - Notes pré-consultation
- `raisonAnnulation` (String, optionnel) - Si annulé
- `createdAt` (Date)
- `updatedAt` (Date)

**Relations :**
- Un Rendez-vous appartient à un Patient (Many-to-One)
- Un Rendez-vous appartient à un Médecin (Many-to-One)
- Un Rendez-vous peut générer une Consultation (One-to-One)

---

### 4. **Consultation**
Suivi détaillé des consultations.
- `id` (UUID, Primary Key)
- `rendezVousId` (UUID, Foreign Key → RendezVous, unique)
- `patientId` (UUID, Foreign Key → Patient)
- `userId` (UUID, Foreign Key → User)
- `dateConsultation` (DateTime, requis)
- `motifConsultation` (String)
- `examenClinique` (Text) - Résultats de l'examen
- `diagnostic` (Text) - Diagnostic établi
- `observations` (Text) - Observations du médecin
- `recommandations` (Text) - Recommandations au patient
- `prochainRendezVous` (Date, optionnel) - Date de suivi si nécessaire
- `createdAt` (Date)
- `updatedAt` (Date)

**Relations :**
- Une Consultation appartient à un Rendez-vous (One-to-One)
- Une Consultation appartient à un Patient (Many-to-One)
- Une Consultation appartient à un Médecin (Many-to-One)
- Une Consultation peut avoir plusieurs Prescriptions (One-to-Many)
- Une Consultation peut générer une Facture (One-to-One)

---

### 5. **DossierMedical (MedicalRecord)**
Dossier médical complet du patient.
- `id` (UUID, Primary Key)
- `patientId` (UUID, Foreign Key → Patient, unique)
- `groupeSanguin` (String)
- `allergies` (Text)
- `antecedents` (Text) - Antécédents médicaux
- `antecedentsFamiliaux` (Text)
- `traitementsEnCours` (Text)
- `vaccinations` (JSON) - Historique des vaccinations
- `examenBiologiques` (JSON) - Résultats d'examens biologiques
- `historiqueChirurgical` (Text)
- `notesGenerales` (Text)
- `createdAt` (Date)
- `updatedAt` (Date)

**Relations :**
- Un Dossier Médical appartient à un Patient (One-to-One)

---

### 6. **Prescription**
Prescriptions médicales délivrées.
- `id` (UUID, Primary Key)
- `consultationId` (UUID, Foreign Key → Consultation)
- `userId` (UUID, Foreign Key → User)
- `patientId` (UUID, Foreign Key → Patient)
- `datePrescription` (Date, requis)
- `medicaments` (JSON) - Array d'objets: { nom, dosage, frequence, duree }
- `instructions` (Text) - Instructions particulières
- `dateDebut` (Date)
- `dateFin` (Date)
- `statut` (Enum: 'active', 'terminee', 'annulee')
- `createdAt` (Date)
- `updatedAt` (Date)

**Relations :**
- Une Prescription appartient à une Consultation (Many-to-One)
- Une Prescription appartient à un Médecin (Many-to-One)
- Une Prescription appartient à un Patient (Many-to-One)

---

### 7. **Facture (Invoice)**
Gestion de la facturation.
- `id` (UUID, Primary Key)
- `consultationId` (UUID, Foreign Key → Consultation, unique)
- `patientId` (UUID, Foreign Key → Patient)
- `numeroFacture` (String, requis, unique) - Ex: "FAC-2024-001"
- `dateFacture` (Date, requis)
- `montantConsultation` (Decimal, requis)
- `montantTotal` (Decimal, requis)
- `tva` (Decimal) - TVA si applicable
- `statutPaiement` (Enum: 'en_attente', 'payee', 'partiellement_payee', 'impayee')
- `modePaiement` (Enum: 'especes', 'carte', 'cheque', 'virement', null)
- `datePaiement` (Date, optionnel)
- `notes` (Text)
- `createdAt` (Date)
- `updatedAt` (Date)

**Relations :**
- Une Facture appartient à une Consultation (One-to-One)
- Une Facture appartient à un Patient (Many-to-One)

---

### 8. **Disponibilite (Availability)**
Gestion des disponibilités et horaires des médecins.
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key → User)
- `jourSemaine` (Integer, 0-6) - 0=Dimanche, 1=Lundi, ..., 6=Samedi
- `heureDebut` (Time, requis)
- `heureFin` (Time, requis)
- `dureeConsultation` (Integer) - Durée par consultation en minutes
- `dateSpecifique` (Date, optionnel) - Pour les exceptions (dates spécifiques)
- `estException` (Boolean, défaut: false) - Si c'est une exception aux horaires réguliers
- `estDisponible` (Boolean, défaut: true)
- `notes` (String) - Ex: "Congé annuel", "Formation"
- `createdAt` (Date)
- `updatedAt` (Date)

**Relations :**
- Une Disponibilité appartient à un Médecin (Many-to-One)

---

## Résumé des Relations

```
Patient (1) ────< (N) RendezVous
Patient (1) ────< (N) Consultation
Patient (1) ──── (1) DossierMedical
Patient (1) ────< (N) Facture

User (1) ────< (N) RendezVous
User (1) ────< (N) Consultation
User (1) ────< (N) Disponibilite
User (1) ────< (N) Prescription

RendezVous (1) ──── (1) Consultation

Consultation (1) ────< (N) Prescription
Consultation (1) ──── (1) Facture
```

---

## Fonctionnalités Principales

### Module Rendez-vous
- Prise de rendez-vous en ligne (patients)
- Gestion des rendez-vous (médecins/admin)
- Consultation des disponibilités en temps réel
- Notifications (email/SMS) de confirmation et rappel
- Annulation et modification de rendez-vous

### Module Dossiers Patients
- Création et mise à jour des dossiers médicaux
- Historique médical complet
- Gestion des allergies et antécédents
- Vaccinations et examens biologiques
- Recherche et filtrage avancés

### Module Consultations
- Enregistrement des consultations
- Diagnostic et examens cliniques
- Prescriptions électroniques
- Historique des consultations par patient
- Export des données médicales

### Module Facturation
- Génération automatique de factures
- Suivi des paiements
- Statistiques financières
- Export des factures (PDF)

### Module Administration
- Gestion des médecins
- Gestion des horaires et disponibilités
- Statistiques et rapports
- Gestion des utilisateurs

---

## Stack Technologique Proposée

### Backend
- **Node.js** + **Express.js** - Framework backend
- **TypeScript** - Typage statique
- **Prisma** ou **TypeORM** - ORM pour la gestion de la base de données
- **PostgreSQL** ou **MySQL** - Base de données relationnelle
- **JWT** - Authentification et autorisation
- **bcrypt** - Hashage des mots de passe
- **Nodemailer** - Envoi d'emails
- **Express Validator** - Validation des données

### Frontend
- **React 18** - Bibliothèque UI
- **TypeScript** - Typage statique
- **React Router** - Gestion des routes
- **TailwindCSS** - Styling
- **React Query / TanStack Query** - Gestion des données serveur
- **Axios** - Requêtes HTTP
- **React Hook Form** - Gestion des formulaires
- **Zod** - Validation des schémas
- **date-fns** - Manipulation des dates

### Outils
- **ESLint** + **Prettier** - Qualité de code
- **Vitest** ou **Jest** - Tests unitaires
- **Docker** (optionnel) - Containerisation

---

## Structure du Projet

```
final-project/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── utils/
│   │   └── app.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── App.tsx
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

---

## Points d'Attention et Bonnes Pratiques

1. **Sécurité** : Protection des données médicales sensibles (RGPD), chiffrement des données
2. **Validation** : Validation stricte côté client et serveur
3. **Gestion d'erreurs** : Messages d'erreur clairs et logging approprié
4. **Tests** : Tests unitaires et d'intégration pour les fonctionnalités critiques
5. **Documentation** : API documentée (Swagger/OpenAPI)
6. **UX/UI** : Interface intuitive et responsive
7. **Performance** : Optimisation des requêtes, pagination, cache si nécessaire

---

## Prochaines Étapes

1. Validation de la proposition par le professeur/encadrant
2. Configuration de l'environnement de développement
3. Mise en place de la structure du projet
4. Création du schéma de base de données
5. Développement itératif par modules
6. Tests et déploiement


