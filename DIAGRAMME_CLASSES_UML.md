# Diagramme de Classes UML - Système de Gestion de Cabinet Médical

## Diagramme corrigé et détaillé

```
┌─────────────────────────────────────────────────────────────────┐
│                    SYSTÈME DE GESTION                           │
│                   CABINET MÉDICAL                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                           PATIENT                               │
├─────────────────────────────────────────────────────────────────┤
│ +id: UUID                                                       │
│ +nom: String                                                    │
│ +prenom: String                                                 │
│ +dateNaissance: DateTime                                        │
│ +sexe: Sexe (M | F | Autre)                                    │
│ +telephone: String (unique)                                     │
│ +email: String? (unique)                                        │
│ +adresse: String?                                               │
│ +numeroSS: String (unique)                                      │
│ +groupeSanguin: String?                                         │
│ +allergies: String?                                             │
│ +antecedents: String?                                           │
│ +createdAt: DateTime                                            │
│ +updatedAt: DateTime                                            │
├─────────────────────────────────────────────────────────────────┤
│ +créerCompte()                                                  │
│ +seConnecter()                                                  │
│ +prendreRendezVous(userId, dateHeure, motif)                  │
│ +consulterDisponibilitesTousMedecins()                       │
│ +modifierRendezVous(rendezVousId, nouvelleDate)                │
│ +annulerRendezVous(rendezVousId, raison)                       │
│ +consulterDossierMedical()                                      │
│ +consulterHistoriqueConsultations()                             │
│ +consulterPrescriptions()                                       │
│ +payerFacture(factureId)                                        │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ 1
                            │
                            │ *
        ┌───────────────────┴───────────────────┐
        │                                       │
        │ *                                    │ *
        │                                       │
┌───────▼──────────┐                  ┌────────▼──────────┐
│  RENDEZ_VOUS     │                  │   CONSULTATION    │
├──────────────────┤                  ├───────────────────┤
│ +id: UUID        │                  │ +id: UUID         │
│ +patientId: UUID │                  │ +rendezVousId: UUID (unique)
│ +userId: UUID    │                  │ +patientId: UUID  │
│ +dateHeure:      │                  │ +userId: UUID    │
│    DateTime      │                  │ +dateConsultation: DateTime
│ +duree: Int      │                  │ +motifConsultation: String?
│    (dérivé de Disponibilite)        │
│ +statut:         │                  │ +examenClinique: String?
│    StatutRendezVous │              │ +diagnostic: String?
│ +motif: String?  │                  │ +observations: String?
│ +notes: String?  │                  │ +recommandations: String?
│ +raisonAnnulation: String?         │ +prochainRendezVous: DateTime?
│ +createdAt:      │                  │ +createdAt: DateTime
│    DateTime      │                  │ +updatedAt: DateTime
│ +updatedAt:      │                  ├───────────────────┤
│    DateTime      │                  │ +rédigerDiagnostic()
├──────────────────┤                  │ +créerPrescription()
│ +annuler(raison) │                  │ +générerFacture()
│ +modifier(dateHeure)               │ +mettreÀJourDossierMedical()
│ +confirmer()     │                  │ +archiver()
└──────────────────┘                  └───────────────────┘
        │                                      │
        │ 1                                    │
        │                                      │
        │                                      │ 1
        │                                      │
        │                                      │ *
        │                                      │
        │ *                            ┌───────▼──────────┐
        │                              │  PRESCRIPTION    │
┌───────▼──────────┐                  ├───────────────────┤
│     USER         │                  │ +id: UUID         │
├──────────────────┤                  │ +consultationId: UUID
│ +id: UUID        │                  │ +userId: UUID     │
│ +nom: String     │                  │ +patientId: UUID  │
│ +prenom: String  │                  │ +datePrescription: DateTime
│ +specialite:     │                  │ +medicaments: JSON
│    String        │                  │ +instructions: String?
│ +numeroOrdre:    │                  │ +dateDebut: DateTime?
│    String (unique)                  │ +dateFin: DateTime?
│ +telephone:      │                  │ +statut: StatutPrescription
│    String        │                  │ +createdAt: DateTime
│ +email: String   │                  │ +updatedAt: DateTime
│    (unique)      │                  ├───────────────────┤
│ +motDePasse:     │                  │ +renouveler()
│    String (hashé)                   │ +imprimer()
│ +userRole:       │                  │ +annuler()
│    UserRole      │                  │ +marquerTerminee()
│    (medecin|admin)                  └───────────────────┘
│ +photo: String?  │
│ +createdAt:      │
│    DateTime      │
│ +updatedAt:      │
│    DateTime      │
├──────────────────┤
│ +seConnecter()   │
│ +consulterRendezVous(dateDebut, dateFin)
│ +gérerDisponibilités()            ┌───────────────────────┐
│ +effectuerConsultation(rendezVousId) │  DOSSIER_MEDICAL   │
│ +rédigerDiagnostic(consultationId)   ├─────────────────────┤
│ +créerPrescription(consultationId)   │ +id: UUID           │
│ +mettreÀJourDossierMedical(patientId)│ +patientId: UUID (unique)
│ +gérerFacturation()                  │ +groupeSanguin: String?
└──────────────────┘                  │ +allergies: String?
        │                              │ +antecedents: String?
        │ 1                            │ +antecedentsFamiliaux: String?
        │                              │ +traitementsEnCours: String?
        │ *                            │ +vaccinations: JSON?
        │                              │ +examenBiologiques: JSON?
        │                              │ +historiqueChirurgical: String?
┌───────▼──────────┐                  │ +notesGenerales: String?
│ DISPONIBILITE    │                  │ +createdAt: DateTime
├──────────────────┤                  │ +updatedAt: DateTime
│ +id: UUID        │                  ├─────────────────────┤
│ +userId: UUID    │                  │ +mettreÀJour()      │
│ +jourSemaine: Int│                  │ +consulter()        │
│    (0-6)         │                  │ +ajouterVaccination()
│ +heureDebut:     │                  │ +ajouterExamenBio()
│    String        │                  └─────────────────────┘
│ +heureFin:       │                            │
│    String        │                            │ 1
│ +dureeConsultation: Int                      │
│ +dateSpecifique: DateTime (requis)          │ *
│ +estException: Boolean (toujours true)      │
│ +estDisponible: Boolean                      │
│ +notes: String?                              │
│ +createdAt: DateTime                         │
│ +updatedAt: DateTime                         │
├──────────────────┤                           │
│ +définirDisponibilité(date, heureDebut, heureFin, duree, estDisponible)
│ +modifierDisponibilité()                     │
│ +supprimerDisponibilité()                    │
│ +vérifierDisponibilité(dateHeure)            │
│ +récupérerDuréeConsultation(dateHeure)       │
└──────────────────┘                           │
                                               │
                                               │ *
                                       ┌───────▼──────────┐
                                       │    FACTURE       │
                                       ├───────────────────┤
                                       │ +id: UUID         │
                                       │ +consultationId: UUID (unique)
                                       │ +patientId: UUID  │
                                       │ +numeroFacture: String (unique)
                                       │ +dateFacture: DateTime
                                       │ +montantConsultation: Decimal
                                       │ +montantTotal: Decimal
                                       │ +tva: Decimal?
                                       │ +statutPaiement: StatutPaiement
                                       │ +modePaiement: ModePaiement?
                                       │ +datePaiement: DateTime?
                                       │ +notes: String?
                                       │ +createdAt: DateTime
                                       │ +updatedAt: DateTime
                                       ├───────────────────┤
                                       │ +payer(modePaiement)
                                       │ +imprimer()
                                       │ +annuler()
                                       │ +envoyerParEmail()
                                       └───────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                          ÉNUMÉRATIONS                           │
├─────────────────────────────────────────────────────────────────┤
│ Sexe: M | F | Autre                                             │
│ StatutRendezVous: planifie | confirme | annule | termine | absent│
│ StatutPrescription: active | terminee | annulee                 │
│ StatutPaiement: en_attente | payee | partiellement_payee | impayee│
│ ModePaiement: especes | carte | cheque | virement               │
│ UserRole: medecin | admin                                         │
└─────────────────────────────────────────────────────────────────┘
```

## Relations entre les classes

### Relations 1-à-1 (One-to-One)
1. **Patient ── DOSSIER_MEDICAL** : Un patient a exactement un dossier médical
2. **RENDEZ_VOUS ── CONSULTATION** : Un rendez-vous génère une consultation (optionnelle)
3. **CONSULTATION ── FACTURE** : Une consultation génère une facture (optionnelle)

### Relations 1-à-Plusieurs (One-to-Many)
1. **Patient ── RENDEZ_VOUS** : Un patient peut avoir plusieurs rendez-vous
2. **Patient ── CONSULTATION** : Un patient peut avoir plusieurs consultations
3. **Patient ── PRESCRIPTION** : Un patient peut avoir plusieurs prescriptions
4. **Patient ── FACTURE** : Un patient peut avoir plusieurs factures
5. **USER ── RENDEZ_VOUS** : Un utilisateur peut avoir plusieurs rendez-vous
6. **USER ── CONSULTATION** : Un utilisateur peut effectuer plusieurs consultations
7. **USER ── DISPONIBILITE** : Un utilisateur peut avoir plusieurs disponibilités
8. **USER ── PRESCRIPTION** : Un utilisateur peut délivrer plusieurs prescriptions
9. **CONSULTATION ── PRESCRIPTION** : Une consultation peut générer plusieurs prescriptions

## Corrections apportées

### 1. **Classe ADMIN supprimée**
   - Dans notre schéma, `admin` est un rôle de l'utilisateur (enum `UserRole`)
   - Les fonctionnalités admin sont intégrées dans la classe USER

### 2. **Attributs corrigés**
   - ❌ `allegerie` → ✅ `allergies`
   - ❌ `adreese` → ✅ `adresse`
   - ❌ `diagonstic` → ✅ `diagnostic`
   - Ajout de tous les attributs manquants

### 3. **Relations corrigées**
   - ❌ RENDEZ_VOUS (1) ── (*) DISPONIBILITE → Supprimée (relation incorrecte)
   - ✅ RENDEZ_VOUS (1) ── (1) CONSULTATION → Relation 1:1 correcte
   - ✅ CONSULTATION (1) ── (0..1) FACTURE → Relation correcte
   - ✅ CONSULTATION (1) ── (*) PRESCRIPTION → Relation corrigée (une consultation peut avoir plusieurs prescriptions)

### 4. **Méthodes corrigées**
   - Méthodes déplacées vers les bonnes classes
   - Méthodes admin intégrées dans USER selon le rôle
   - Ajout de méthodes manquantes importantes

### 5. **Types de données**
   - Utilisation de types précis (UUID, DateTime, Decimal, JSON, Enum)
   - Ajout des contraintes (unique, nullable)

### 6. **Énumérations ajoutées**
   - Toutes les énumérations listées clairement

## Notes importantes

1. **Rôle Admin** : L'utilisateur avec `userRole = 'admin'` a accès à toutes les fonctionnalités administratives
2. **Relation RENDEZ_VOUS-CONSULTATION** : Un rendez-vous peut exister sans consultation (si annulé), mais une consultation nécessite un rendez-vous
3. **Relation CONSULTATION-FACTURE** : Une consultation génère une facture, mais pas systématiquement
4. **DISPONIBILITE** : 
   - Les disponibilités sont maintenant créées uniquement par date et heure spécifique (`dateSpecifique` est requis)
   - `estException` est toujours `true` pour les nouvelles disponibilités
   - `jourSemaine` est conservé pour compatibilité mais n'est plus utilisé activement
   - La durée des rendez-vous est automatiquement dérivée de la disponibilité du médecin
5. **RENDEZ_VOUS** : 
   - La durée est automatiquement calculée à partir de la disponibilité du médecin lors de la création
   - Un rendez-vous ne peut être créé que si le médecin a des disponibilités définies
6. **Filtrage par rôle** : Les consultations et rendez-vous sont filtrés dans le backend selon le rôle de l'utilisateur connecté

