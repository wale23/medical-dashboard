# Diagramme de Cas d'Utilisation - Système de Gestion de Cabinet Médical

## Vue d'ensemble

Ce diagramme représente tous les cas d'utilisation du système avec les acteurs principaux : **Patient**, **Médecin** et **Administrateur**.

---

## Représentation visuelle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SYSTÈME DE GESTION                                   │
│                    CABINET MÉDICAL                                      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────┐
│   PATIENT   │
└──────┬──────┘
       │
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-01 : Se connecter                            │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-02 : Consulter les disponibilités de tous les médecins
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-03 : Prendre un rendez-vous                  │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-04 : Modifier un rendez-vous                 │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-05 : Annuler un rendez-vous                  │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-06 : Consulter son dossier médical           │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-07 : Consulter l'historique des consultations│
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-08 : Consulter les prescriptions             │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-09 : Consulter les factures                  │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-10 : Payer une facture                       │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       └──────┤  UC-11 : Consulter son profil                    │
              └──────────────────────────────────────────────────┘

┌─────────────┐
│     USER    │
└──────┬──────┘
       │
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-12 : Se connecter                            │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-13 : Consulter ses rendez-vous               │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-11 : Consulter son profil                    │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-14 : Gérer les disponibilités                │
       │      │      ├── UC-14.1 : Définir une disponibilité par date et heure
       │      │      ├── UC-14.2 : Modifier une disponibilité    │
       │      │      ├── UC-14.3 : Supprimer une disponibilité   │
       │      │      └── UC-14.4 : Marquer une disponibilité comme indisponible
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-15 : Gérer les patients                      │
       │      │      └── UC-15.2 : Consulter un patient          │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-16 : Effectuer une consultation              │
       │      │      ├── UC-16.1 : Enregistrer une consultation  │
       │      │      ├── UC-16.2 : Rédiger un diagnostic         │
       │      │      └── UC-16.3 : Ajouter des observations      │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-17 : Créer une prescription                  │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-18 : Mettre à jour un dossier médical        │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       └──────┤  UC-19 : Gérer les rendez-vous                   │
              │      ├── UC-19.2 : Marquer un rendez-vous terminé│
              │      └── UC-19.3 : Marquer un rendez-vous absent │
              └──────────────────────────────────────────────────┘

┌──────────────┐
│ ADMINISTRATEUR│
│  (Rôle Admin)│
└──────┬───────┘
       │
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-21 : Se connecter (comme admin)              │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-11 : Consulter son profil                    │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-22 : Gérer les comptes médecins              │
       │      │      ├── UC-22.1 : Créer un compte médecin       │
       │      │      ├── UC-22.2 : Consulter les médecins        │
       │      │      └── UC-22.3 : Modifier un médecin           │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-23 : Gérer les dossiers patients             │
       │      │      ├── UC-23.1 : Créer un patient               │
       │      │      ├── UC-23.2 : Consulter tous les patients   │
       │      │      └── UC-23.3 : Modifier un dossier médical   │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-24 : Gérer la facturation                    │
       │      │      ├── UC-24.1 : Consulter toutes les factures │
       │      │      ├── UC-24.2 : Créer une facture              │
       │      │      ├── UC-24.3 : Modifier une facture          │
       │      │      ├── UC-24.4 : Valider un paiement           │
       │      │      └── UC-24.5 : Générer des rapports          │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-25 : Gérer les horaires                      │
       │      │      └── UC-25.1 : Consulter tous les horaires   │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-26 : Consulter les statistiques              │
       │      │      ├── UC-26.1 : Statistiques des rendez-vous  │
       │      │      ├── UC-26.2 : Statistiques financières      │
       │      │      └── UC-26.3 : Statistiques des consultations│
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       └──────┤  UC-28 : Gérer les rendez-vous (admin)           │
              │      ├── UC-28.1 : Créer un rendez-vous           │
              │      ├── UC-28.2 : Confirmer un rendez-vous en attente
              │      ├── UC-28.3 : Rejeter un rendez-vous en attente
              │      ├── UC-28.4 : Modifier un rendez-vous planifié/confirmé
              │      └── UC-28.5 : Supprimer un rendez-vous planifié/confirmé
              └──────────────────────────────────────────────────┘

```

---

## Détail des Cas d'Utilisation

### ACTEUR 1 : PATIENT

**Note importante** : Les patients ne peuvent pas créer leur propre compte. Ils sont créés par l'administrateur ou un médecin. Le patient reçoit ensuite ses identifiants pour se connecter.

#### UC-01 : Se connecter
**Description** : Le patient se connecte à son compte  
**Préconditions** : Le patient a un compte créé par l'admin/médecin et a reçu ses identifiants  
**Scénario principal** :
1. Le patient saisit son email (ou téléphone) et son mot de passe
2. Le système vérifie les identifiants
3. Le système authentifie le patient
4. Le patient accède à son espace personnel

---

#### UC-02 : Consulter les disponibilités de tous les médecins
**Description** : Le patient consulte les disponibilités de tous les médecins du cabinet  
**Scénario principal** :
1. Le patient accède à la page "Disponibilités"
2. Le système affiche toutes les disponibilités disponibles de tous les médecins
3. Le patient peut filtrer par médecin (optionnel)
4. Le patient voit les créneaux disponibles avec les informations du médecin (nom, spécialité)
5. Le système affiche uniquement les disponibilités marquées comme "disponibles"

---

#### UC-03 : Prendre un rendez-vous
**Description** : Le patient prend un rendez-vous avec un médecin  
**Préconditions** : Le patient est connecté et le créneau est disponible  
**Scénario principal** :
1. Le patient sélectionne un médecin
2. Le patient choisit une date et heure disponible
3. Le patient saisit le motif de consultation (optionnel)
4. Le système vérifie la disponibilité
5. Le système vérifie que le médecin a des disponibilités définies
6. Le système calcule automatiquement la durée du rendez-vous à partir de la disponibilité du médecin
7. Le système crée le rendez-vous
8. Le système envoie une confirmation
9. Le rendez-vous est créé avec le statut "en_attente" (si créé par patient) ou "planifié" (si créé par admin)

**Inclusions** : UC-02 (Consulter les disponibilités)

**Scénarios alternatifs** :
- 5a. Le médecin n'a pas de disponibilités définies → Le système empêche la création du rendez-vous

---

#### UC-04 : Modifier un rendez-vous
**Description** : Le patient modifie un rendez-vous existant  
**Préconditions** : Le patient a un rendez-vous planifié  
**Scénario principal** :
1. Le patient consulte ses rendez-vous
2. Le patient sélectionne un rendez-vous à modifier
3. Le patient choisit une nouvelle date/heure
4. Le système vérifie la disponibilité
5. Le système met à jour le rendez-vous
6. Le système envoie une confirmation

---

#### UC-05 : Annuler un rendez-vous
**Description** : Le patient annule un rendez-vous  
**Préconditions** : Le patient a un rendez-vous actif  
**Scénario principal** :
1. Le patient consulte ses rendez-vous
2. Le patient sélectionne un rendez-vous à annuler
3. Le patient saisit la raison de l'annulation (optionnel)
4. Le système met à jour le statut à "annulé"
5. Le créneau redevient disponible
6. Le système envoie une confirmation d'annulation

---

#### UC-06 : Consulter son dossier médical
**Description** : Le patient consulte son dossier médical  
**Préconditions** : Le patient est connecté  
**Scénario principal** :
1. Le patient accède à son dossier médical
2. Le système affiche les informations (allergies, antécédents, groupe sanguin, etc.)
3. Le système affiche l'historique médical

---

#### UC-07 : Consulter l'historique des consultations
**Description** : Le patient consulte son historique de consultations  
**Scénario principal** :
1. Le patient accède à l'historique
2. Le système affiche uniquement les consultations du patient connecté
3. Le patient peut consulter les détails d'une consultation
4. Le système affiche le diagnostic, les observations, prescriptions, factures, etc.
5. Le patient peut voir les informations du médecin qui a effectué la consultation

---

#### UC-08 : Consulter les prescriptions
**Description** : Le patient consulte ses prescriptions  
**Scénario principal** :
1. Le patient accède à ses prescriptions
2. Le système affiche la liste des prescriptions
3. Le patient peut voir les détails (médicaments, instructions, dates)

---

#### UC-09 : Consulter les factures
**Description** : Le patient consulte ses factures  
**Scénario principal** :
1. Le patient accède à ses factures
2. Le système affiche la liste des factures
3. Le patient peut voir les détails et le statut de paiement

---

#### UC-10 : Payer une facture
**Description** : Le patient paie une facture en attente  
**Préconditions** : Le patient a une facture avec le statut "en_attente"  
**Scénario principal** :
1. Le patient sélectionne une facture à payer
2. Le patient choisit le mode de paiement
3. Le patient confirme le paiement
4. Le système met à jour le statut à "payée"
5. Le système enregistre la date de paiement
6. Le système génère un reçu

**Inclusions** : UC-09 (Consulter les factures)

---

#### UC-11 : Consulter son profil
**Description** : Le patient consulte son profil personnel  
**Préconditions** : Le patient est connecté  
**Scénario principal** :
1. Le patient accède à son profil
2. Le système affiche ses informations personnelles
3. Le système affiche son dossier médical complet (allergies, antécédents, vaccinations, etc.)
4. Le patient peut voir toutes ses informations médicales

---

### ACTEUR 2 : USER (Médecin/Admin)

#### UC-12 : Se connecter
**Description** : Le médecin se connecte à son compte  
**Préconditions** : Le médecin a un compte actif  
**Scénario principal** :
1. Le médecin saisit son email et son mot de passe
2. Le système vérifie les identifiants et le rôle
3. Le système authentifie le médecin
4. Le médecin accède à son espace de travail

---

#### UC-13 : Consulter ses rendez-vous
**Description** : Le médecin consulte ses rendez-vous  
**Scénario principal** :
1. Le médecin accède à son planning
2. Le système affiche ses rendez-vous (jour/semaine/mois)
3. Le médecin peut filtrer par date ou statut
4. Le système affiche les détails (patient, heure, motif)

---

#### UC-14 : Gérer les disponibilités
**Description** : Le médecin gère ses horaires de disponibilité

##### UC-14.1 : Définir une disponibilité par date et heure
1. Le médecin accède à la gestion des disponibilités
2. Le médecin sélectionne une date spécifique
3. Le médecin définit l'heure de début et l'heure de fin
4. Le médecin définit la durée de consultation (en minutes)
5. Le médecin peut marquer la disponibilité comme "disponible" ou "indisponible"
6. Le médecin peut ajouter des notes (optionnel)
7. Le système enregistre la disponibilité avec `estException: true` et `dateSpecifique`

##### UC-14.2 : Modifier une disponibilité
1. Le médecin sélectionne une disponibilité existante
2. Le médecin modifie les heures ou le jour
3. Le système met à jour la disponibilité

##### UC-14.3 : Supprimer une disponibilité
1. Le médecin sélectionne une disponibilité
2. Le médecin confirme la suppression
3. Le système supprime la disponibilité

##### UC-14.4 : Marquer une disponibilité comme indisponible
1. Le médecin crée une disponibilité
2. Le médecin décoche la case "Disponible"
3. Le système enregistre la disponibilité avec `estDisponible: false`
4. La disponibilité apparaît dans la liste avec le statut "Indisponible"

---

#### UC-15 : Gérer les patients
**Description** : Le médecin consulte les dossiers patients

##### UC-15.2 : Consulter un patient
1. Le médecin recherche un patient (nom, téléphone, etc.)
2. Le système affiche les résultats
3. Le médecin sélectionne un patient
4. Le système affiche toutes les informations du patient

---

#### UC-16 : Effectuer une consultation
**Description** : Le médecin effectue et enregistre une consultation

##### UC-16.1 : Enregistrer une consultation
1. Le médecin sélectionne un rendez-vous terminé
2. Le médecin crée une consultation associée
3. Le système crée la consultation avec les informations de base

##### UC-16.2 : Rédiger un diagnostic
1. Le médecin accède à la consultation
2. Le médecin saisit le diagnostic
3. Le système enregistre le diagnostic

##### UC-16.3 : Ajouter des observations
1. Le médecin saisit les observations cliniques
2. Le médecin peut ajouter l'examen clinique
3. Le médecin peut ajouter des recommandations
4. Le système enregistre toutes les informations

**Extensions** : UC-17 (Créer une prescription), UC-20 (Générer une facture)

---

#### UC-17 : Créer une prescription
**Description** : Le médecin crée une prescription pour un patient  
**Préconditions** : Une consultation a été effectuée  
**Scénario principal** :
1. Le médecin accède à une consultation
2. Le médecin crée une prescription
3. Le médecin ajoute les médicaments (nom, dosage, fréquence, durée)
4. Le médecin ajoute des instructions
5. Le système génère la prescription avec un statut "active"
6. Le système lie la prescription à la consultation

**Inclusions** : UC-16 (Effectuer une consultation)

---

#### UC-18 : Mettre à jour un dossier médical
**Description** : Le médecin met à jour le dossier médical d'un patient  
**Scénario principal** :
1. Le médecin consulte le dossier médical d'un patient
2. Le médecin met à jour les informations (allergies, antécédents, etc.)
3. Le médecin peut ajouter des vaccinations
4. Le médecin peut ajouter des examens biologiques
5. Le système enregistre les modifications

---

#### UC-19 : Gérer les rendez-vous
**Description** : Le médecin gère le statut de ses rendez-vous

##### UC-19.2 : Marquer un rendez-vous terminé
1. Le médecin termine la consultation
2. Le médecin marque le rendez-vous comme "terminé"
3. Le système met à jour le statut

##### UC-19.3 : Marquer un rendez-vous absent
1. Le patient ne s'est pas présenté
2. Le médecin marque le rendez-vous comme "absent"
3. Le système met à jour le statut

---

### ACTEUR 3 : ADMINISTRATEUR

#### UC-21 : Se connecter (comme admin)
**Description** : L'administrateur se connecte avec les droits admin  
**Préconditions** : Le médecin a le rôle "admin"  
**Scénario principal** :
1. L'admin se connecte avec ses identifiants
2. Le système vérifie le rôle "admin"
3. L'admin accède à l'interface d'administration

---

#### UC-22 : Gérer les comptes médecins
**Description** : L'administrateur gère les comptes des médecins

##### UC-22.1 : Créer un compte médecin
1. L'admin accède à la gestion des médecins
2. L'admin crée un nouveau compte
3. L'admin définit le rôle (médecin ou admin)
4. Le système crée le compte

##### UC-22.2 : Consulter les médecins
1. L'admin consulte la liste des médecins
2. Le système affiche tous les médecins avec leurs informations

##### UC-22.3 : Modifier un médecin
1. L'admin sélectionne un médecin
2. L'admin modifie les informations
3. Le système met à jour le compte

---

#### UC-23 : Gérer les dossiers patients
**Description** : L'administrateur gère tous les dossiers patients

##### UC-23.1 : Créer un patient
1. L'admin accède à la gestion des patients
2. L'admin crée un nouveau patient
3. L'admin saisit les informations du patient (nom, prénom, date de naissance, téléphone, email, numéro SS, etc.)
4. L'admin peut définir un mot de passe pour le patient (optionnel)
5. Le système valide les données (unicité du téléphone, email, numéro SS)
6. Le système crée le patient et le dossier médical associé
7. Le système génère un identifiant unique
8. Le patient peut ensuite se connecter avec ses identifiants

**Scénarios alternatifs** :
- 5a. Le téléphone, email ou numéro SS existe déjà → message d'erreur
- 5b. Les données sont invalides → affichage d'un message d'erreur

##### UC-23.2 : Consulter tous les patients
1. L'admin accède à la liste complète des patients
2. Le système affiche tous les patients avec possibilité de recherche/filtre

##### UC-23.3 : Modifier un dossier médical
1. L'admin sélectionne un patient
2. L'admin modifie le dossier médical
3. Le système enregistre les modifications


---

#### UC-24 : Gérer la facturation
**Description** : L'administrateur gère la facturation globale

##### UC-24.1 : Consulter toutes les factures
1. L'admin accède à la facturation
2. Le système affiche toutes les factures avec filtres
3. L'admin peut voir le patient, la consultation associée, le montant, le statut de paiement

##### UC-24.2 : Créer une facture
1. L'admin accède à une consultation
2. L'admin crée une facture pour la consultation
3. L'admin définit le montant de la consultation
4. Le système calcule le montant total (avec TVA si applicable)
5. Le système génère un numéro de facture unique
6. Le système crée la facture avec le statut "en_attente"

##### UC-24.3 : Modifier une facture
1. L'admin sélectionne une facture
2. L'admin modifie le statut de paiement, le mode de paiement, la date de paiement, ou les notes
3. Le système met à jour la facture

##### UC-24.4 : Valider un paiement
1. L'admin consulte une facture
2. L'admin valide un paiement effectué
3. L'admin sélectionne le mode de paiement
4. Le système met à jour le statut à "payée"
5. Le système enregistre la date de paiement

##### UC-24.5 : Générer des rapports
1. L'admin sélectionne une période
2. Le système génère un rapport financier
3. Le système exporte le rapport (PDF/Excel)

---

#### UC-25 : Gérer les horaires
**Description** : L'administrateur peut consulter tous les horaires

##### UC-25.1 : Consulter tous les horaires
1. L'admin accède aux horaires de tous les médecins
2. Le système affiche un calendrier global

---

#### UC-26 : Consulter les statistiques
**Description** : L'administrateur consulte les statistiques du cabinet

##### UC-26.1 : Statistiques des rendez-vous
- Nombre de rendez-vous par période
- Taux de présence/absence
- Médecins les plus sollicités

##### UC-26.2 : Statistiques financières
- Chiffre d'affaires par période
- Factures payées/impayées
- Évolution des revenus

##### UC-26.3 : Statistiques des consultations
- Nombre de consultations par type
- Diagnostiques les plus fréquents
- Activité par médecin

---

---

#### UC-28 : Gérer les rendez-vous (admin)
**Description** : L'administrateur gère tous les rendez-vous du cabinet

##### UC-28.1 : Créer un rendez-vous
1. L'admin accède à la gestion des rendez-vous
2. L'admin sélectionne un patient et un médecin
3. L'admin choisit une date et heure
4. Le système vérifie que le médecin a des disponibilités définies
5. Le système calcule automatiquement la durée à partir de la disponibilité du médecin
6. Le système crée le rendez-vous avec le statut "planifié"

##### UC-28.2 : Confirmer un rendez-vous en attente
1. L'admin consulte un rendez-vous avec le statut "en_attente"
2. L'admin clique sur l'icône de confirmation
3. Le système met à jour le statut à "confirme"

##### UC-28.3 : Rejeter un rendez-vous en attente
1. L'admin consulte un rendez-vous avec le statut "en_attente"
2. L'admin clique sur l'icône de rejet
3. Le système met à jour le statut à "annule"

##### UC-28.4 : Modifier un rendez-vous planifié/confirmé
1. L'admin sélectionne un rendez-vous avec le statut "planifie" ou "confirme"
2. L'admin clique sur l'icône d'édition
3. L'admin modifie les informations (date, heure, patient, médecin, motif)
4. Le système vérifie la disponibilité
5. Le système met à jour le rendez-vous

##### UC-28.5 : Supprimer un rendez-vous planifié/confirmé
1. L'admin sélectionne un rendez-vous avec le statut "planifie" ou "confirme"
2. L'admin clique sur l'icône de suppression
3. L'admin confirme la suppression
4. Le système supprime le rendez-vous

---

## Relations entre les cas d'utilisation

### Inclusion (<<include>>)
- **UC-03** inclut **UC-02** : Prendre un rendez-vous nécessite de consulter les disponibilités
- **UC-10** inclut **UC-09** : Payer une facture nécessite de consulter les factures
- **UC-17** inclut **UC-16** : Créer une prescription nécessite une consultation
- **UC-28.1** inclut **UC-02** : Créer un rendez-vous (admin) nécessite de consulter les disponibilités

### Extension (<<extend>>)
- **UC-17** étend **UC-16** : Après une consultation, on peut créer une prescription

### Généralisation
- Tous les acteurs peuvent se connecter (généralisation du cas d'utilisation "Se connecter")
- Tous les acteurs peuvent consulter leur profil (UC-11)

---

## Résumé par acteur

| Acteur | Nombre de cas d'utilisation |
|--------|----------------------------|
| **Patient** | 11 cas d'utilisation |
| **Médecin** | 8 cas d'utilisation principaux (+ sous-cas) |
| **Administrateur** | 7 cas d'utilisation principaux (+ sous-cas) |
| **TOTAL** | **26 cas d'utilisation principaux** |

---

## Remarques importantes

1. **Création de compte patient** : Les patients ne peuvent pas créer leur propre compte. Ils sont créés uniquement par l'administrateur ou un médecin via UC-23.1. Le patient reçoit ensuite ses identifiants pour se connecter.
2. **Sécurité** : Tous les cas d'utilisation nécessitent une authentification (sauf création de compte médecin/admin via register)
3. **Permissions** : L'administrateur hérite de tous les droits du médecin
4. **Traçabilité** : Toutes les actions importantes sont enregistrées (createdAt, updatedAt)
5. **Intégrité** : Les suppressions en cascade garantissent la cohérence des données

