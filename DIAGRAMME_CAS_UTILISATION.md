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
       ├──────┤  UC-01 : Créer un compte                         │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-02 : Se connecter                            │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-03 : Consulter les disponibilités            │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-04 : Prendre un rendez-vous                  │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-05 : Modifier un rendez-vous                 │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-06 : Annuler un rendez-vous                  │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-07 : Consulter son dossier médical           │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-08 : Consulter l'historique des consultations│
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-09 : Consulter les prescriptions             │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-10 : Consulter les factures                  │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       └──────┤  UC-11 : Payer une facture                       │
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
       ├──────┤  UC-14 : Gérer les disponibilités                │
       │      │      ├── UC-14.1 : Définir une disponibilité     │
       │      │      ├── UC-14.2 : Modifier une disponibilité    │
       │      │      └── UC-14.3 : Supprimer une disponibilité   │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-15 : Gérer les patients                      │
       │      │      ├── UC-15.1 : Créer un patient              │
       │      │      ├── UC-15.2 : Consulter un patient          │
       │      │      ├── UC-15.3 : Modifier un patient           │
       │      │      └── UC-15.4 : Supprimer un patient          │
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
       ├──────┤  UC-19 : Gérer les rendez-vous                   │
       │      │      ├── UC-19.1 : Confirmer un rendez-vous      │
       │      │      ├── UC-19.2 : Marquer un rendez-vous terminé│
       │      │      └── UC-19.3 : Marquer un rendez-vous absent │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       └──────┤  UC-20 : Générer une facture                     │
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
       ├──────┤  UC-22 : Gérer les comptes médecins              │
       │      │      ├── UC-22.1 : Créer un compte médecin       │
       │      │      ├── UC-22.2 : Consulter les médecins        │
       │      │      ├── UC-22.3 : Modifier un médecin           │
       │      │      └── UC-22.4 : Désactiver un médecin         │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-23 : Gérer les dossiers patients             │
       │      │      ├── UC-23.1 : Consulter tous les patients   │
       │      │      ├── UC-23.2 : Modifier un dossier médical   │
       │      │      └── UC-23.3 : Archiver un dossier           │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-24 : Gérer la facturation                    │
       │      │      ├── UC-24.1 : Consulter toutes les factures │
       │      │      ├── UC-24.2 : Valider un paiement           │
       │      │      └── UC-24.3 : Générer des rapports          │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-25 : Gérer les horaires                      │
       │      │      ├── UC-25.1 : Consulter tous les horaires   │
       │      │      └── UC-25.2 : Modifier les horaires         │
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       ├──────┤  UC-26 : Consulter les statistiques              │
       │      │      ├── UC-26.1 : Statistiques des rendez-vous  │
       │      │      ├── UC-26.2 : Statistiques financières      │
       │      │      └── UC-26.3 : Statistiques des consultations│
       │      └──────────────────────────────────────────────────┘
       │      ┌──────────────────────────────────────────────────┐
       └──────┤  UC-27 : Générer des rapports                    │
              │      ├── UC-27.1 : Rapport mensuel               │
              │      ├── UC-27.2 : Rapport annuel                │
              │      └── UC-27.3 : Rapport personnalisé          │
              └──────────────────────────────────────────────────┘

```

---

## Détail des Cas d'Utilisation

### ACTEUR 1 : PATIENT

#### UC-01 : Créer un compte
**Description** : Un patient peut créer un compte dans le système  
**Préconditions** : Le patient n'a pas encore de compte  
**Scénario principal** :
1. Le patient accède à la page d'inscription
2. Il saisit ses informations (nom, prénom, date de naissance, téléphone, email, etc.)
3. Le système valide les données
4. Le système crée le compte et le dossier médical associé
5. Le compte est créé avec succès

**Scénarios alternatifs** :
- 3a. Les données sont invalides → affichage d'un message d'erreur
- 3b. L'email ou le téléphone existe déjà → message d'erreur

---

#### UC-02 : Se connecter
**Description** : Le patient se connecte à son compte  
**Préconditions** : Le patient a un compte actif  
**Scénario principal** :
1. Le patient saisit son email et son mot de passe
2. Le système vérifie les identifiants
3. Le système authentifie le patient
4. Le patient accède à son espace personnel

---

#### UC-03 : Consulter les disponibilités
**Description** : Le patient consulte les disponibilités des médecins  
**Scénario principal** :
1. Le patient sélectionne un médecin
2. Le patient sélectionne une date
3. Le système affiche les créneaux disponibles
4. Le patient voit les heures libres

---

#### UC-04 : Prendre un rendez-vous
**Description** : Le patient prend un rendez-vous avec un médecin  
**Préconditions** : Le patient est connecté et le créneau est disponible  
**Scénario principal** :
1. Le patient sélectionne un médecin
2. Le patient choisit une date et heure disponible
3. Le patient saisit le motif de consultation (optionnel)
4. Le système vérifie la disponibilité
5. Le système crée le rendez-vous
6. Le système envoie une confirmation
7. Le rendez-vous est créé avec le statut "planifié"

**Inclusions** : UC-03 (Consulter les disponibilités)

---

#### UC-05 : Modifier un rendez-vous
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

#### UC-06 : Annuler un rendez-vous
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

#### UC-07 : Consulter son dossier médical
**Description** : Le patient consulte son dossier médical  
**Préconditions** : Le patient est connecté  
**Scénario principal** :
1. Le patient accède à son dossier médical
2. Le système affiche les informations (allergies, antécédents, groupe sanguin, etc.)
3. Le système affiche l'historique médical

---

#### UC-08 : Consulter l'historique des consultations
**Description** : Le patient consulte son historique de consultations  
**Scénario principal** :
1. Le patient accède à l'historique
2. Le système affiche la liste des consultations
3. Le patient peut consulter les détails d'une consultation
4. Le système affiche le diagnostic, les observations, etc.

---

#### UC-09 : Consulter les prescriptions
**Description** : Le patient consulte ses prescriptions  
**Scénario principal** :
1. Le patient accède à ses prescriptions
2. Le système affiche la liste des prescriptions
3. Le patient peut voir les détails (médicaments, instructions, dates)

---

#### UC-10 : Consulter les factures
**Description** : Le patient consulte ses factures  
**Scénario principal** :
1. Le patient accède à ses factures
2. Le système affiche la liste des factures
3. Le patient peut voir les détails et le statut de paiement

---

#### UC-11 : Payer une facture
**Description** : Le patient paie une facture en attente  
**Préconditions** : Le patient a une facture avec le statut "en_attente"  
**Scénario principal** :
1. Le patient sélectionne une facture à payer
2. Le patient choisit le mode de paiement
3. Le patient confirme le paiement
4. Le système met à jour le statut à "payée"
5. Le système enregistre la date de paiement
6. Le système génère un reçu

**Inclusions** : UC-10 (Consulter les factures)

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

##### UC-14.1 : Définir une disponibilité
1. Le médecin accède à la gestion des disponibilités
2. Le médecin définit un jour de la semaine et des heures
3. Le médecin peut définir une exception (date spécifique)
4. Le système enregistre la disponibilité

##### UC-14.2 : Modifier une disponibilité
1. Le médecin sélectionne une disponibilité existante
2. Le médecin modifie les heures ou le jour
3. Le système met à jour la disponibilité

##### UC-14.3 : Supprimer une disponibilité
1. Le médecin sélectionne une disponibilité
2. Le médecin confirme la suppression
3. Le système supprime la disponibilité

---

#### UC-15 : Gérer les patients
**Description** : Le médecin gère les dossiers patients

##### UC-15.1 : Créer un patient
1. Le médecin accède à la création de patient
2. Le médecin saisit les informations du patient
3. Le système crée le patient et son dossier médical
4. Le système génère un identifiant unique

##### UC-15.2 : Consulter un patient
1. Le médecin recherche un patient (nom, téléphone, etc.)
2. Le système affiche les résultats
3. Le médecin sélectionne un patient
4. Le système affiche toutes les informations du patient

##### UC-15.3 : Modifier un patient
1. Le médecin consulte un patient
2. Le médecin modifie les informations
3. Le système met à jour les données

##### UC-15.4 : Supprimer un patient
1. Le médecin sélectionne un patient
2. Le médecin confirme la suppression
3. Le système supprime le patient et son dossier (cascade)

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

##### UC-19.1 : Confirmer un rendez-vous
1. Le médecin consulte un rendez-vous "planifié"
2. Le médecin confirme le rendez-vous
3. Le système met à jour le statut à "confirmé"

##### UC-19.2 : Marquer un rendez-vous terminé
1. Le médecin termine la consultation
2. Le médecin marque le rendez-vous comme "terminé"
3. Le système met à jour le statut

##### UC-19.3 : Marquer un rendez-vous absent
1. Le patient ne s'est pas présenté
2. Le médecin marque le rendez-vous comme "absent"
3. Le système met à jour le statut

---

#### UC-20 : Générer une facture
**Description** : Le médecin génère une facture pour une consultation  
**Préconditions** : Une consultation a été effectuée  
**Scénario principal** :
1. Le médecin accède à une consultation terminée
2. Le médecin génère une facture
3. Le système calcule le montant (avec TVA si applicable)
4. Le système génère un numéro de facture unique
5. Le système crée la facture avec le statut "en_attente"
6. Le système lie la facture à la consultation

**Inclusions** : UC-16 (Effectuer une consultation)

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

##### UC-22.4 : Désactiver un médecin
1. L'admin sélectionne un médecin
2. L'admin désactive le compte
3. Le médecin ne peut plus se connecter

---

#### UC-23 : Gérer les dossiers patients
**Description** : L'administrateur gère tous les dossiers patients

##### UC-23.1 : Consulter tous les patients
1. L'admin accède à la liste complète des patients
2. Le système affiche tous les patients avec possibilité de recherche/filtre

##### UC-23.2 : Modifier un dossier médical
1. L'admin sélectionne un patient
2. L'admin modifie le dossier médical
3. Le système enregistre les modifications

##### UC-23.3 : Archiver un dossier
1. L'admin sélectionne un patient inactif
2. L'admin archive le dossier
3. Le système archive le dossier (conservation des données)

---

#### UC-24 : Gérer la facturation
**Description** : L'administrateur gère la facturation globale

##### UC-24.1 : Consulter toutes les factures
1. L'admin accède à la facturation
2. Le système affiche toutes les factures avec filtres

##### UC-24.2 : Valider un paiement
1. L'admin consulte une facture
2. L'admin valide un paiement effectué
3. Le système met à jour le statut

##### UC-24.3 : Générer des rapports
1. L'admin sélectionne une période
2. Le système génère un rapport financier
3. Le système exporte le rapport (PDF/Excel)

---

#### UC-25 : Gérer les horaires
**Description** : L'administrateur peut consulter et modifier tous les horaires

##### UC-25.1 : Consulter tous les horaires
1. L'admin accède aux horaires de tous les médecins
2. Le système affiche un calendrier global

##### UC-25.2 : Modifier les horaires
1. L'admin peut modifier les disponibilités de n'importe quel médecin
2. Le système met à jour les horaires

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

#### UC-27 : Générer des rapports
**Description** : L'administrateur génère différents types de rapports

##### UC-27.1 : Rapport mensuel
- Synthèse mensuelle de l'activité
- Statistiques financières
- Liste des patients

##### UC-27.2 : Rapport annuel
- Bilan annuel complet
- Évolution sur l'année
- Tendances

##### UC-27.3 : Rapport personnalisé
- L'admin définit les critères
- Le système génère un rapport sur mesure

---

## Relations entre les cas d'utilisation

### Inclusion (<<include>>)
- **UC-04** inclut **UC-03** : Prendre un rendez-vous nécessite de consulter les disponibilités
- **UC-11** inclut **UC-10** : Payer une facture nécessite de consulter les factures
- **UC-17** inclut **UC-16** : Créer une prescription nécessite une consultation
- **UC-20** inclut **UC-16** : Générer une facture nécessite une consultation

### Extension (<<extend>>)
- **UC-17** étend **UC-16** : Après une consultation, on peut créer une prescription
- **UC-20** étend **UC-16** : Après une consultation, on peut générer une facture

### Généralisation
- Tous les acteurs peuvent se connecter (généralisation du cas d'utilisation "Se connecter")

---

## Résumé par acteur

| Acteur | Nombre de cas d'utilisation |
|--------|----------------------------|
| **Patient** | 11 cas d'utilisation |
| **Médecin** | 9 cas d'utilisation principaux (+ sous-cas) |
| **Administrateur** | 7 cas d'utilisation principaux (+ sous-cas) |
| **TOTAL** | **27 cas d'utilisation principaux** |

---

## Remarques importantes

1. **Sécurité** : Tous les cas d'utilisation nécessitent une authentification (sauf création de compte)
2. **Permissions** : L'administrateur hérite de tous les droits du médecin
3. **Traçabilité** : Toutes les actions importantes sont enregistrées (createdAt, updatedAt)
4. **Intégrité** : Les suppressions en cascade garantissent la cohérence des données

