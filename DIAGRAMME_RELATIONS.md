# Diagramme des Relations - Modèle de Données

## Représentation Visuelle des Entités et Relations

```
┌─────────────────┐
│    PATIENT      │
│─────────────────│
│ - id            │
│ - nom           │
│ - prenom        │
│ - dateNaissance │
│ - telephone     │
│ - email         │
│ - numeroSS      │
│ - allergies     │
│ - antecedents   │
└────────┬────────┘
         │
         │ (1:N)
         │
    ┌────┴──────────────────────────────────────────┐
    │                                                │
    ▼                                                ▼
┌──────────────┐                          ┌──────────────────┐
│ RENDEZ_VOUS  │                          │  CONSULTATION    │
│──────────────│                          │──────────────────│
│ - id         │ (1:1)                    │ - id             │
│ - dateHeure  ├─────────────────────────>│ - diagnostic     │
│ - statut     │                          │ - examenClinique │
│ - motif      │                          │ - observations   │
└──────┬───────┘                          └──────┬───────────┘
       │                                          │
       │ (N:1)                                    │ (1:1)       (1:N)
       │                                          │              │
       │ (N:1)                                    │              │
       ▼                                          ▼              ▼
┌──────────────┐                          ┌──────────────┐  ┌──────────────┐
│     USER     │                          │   FACTURE    │  │ PRESCRIPTION │
│──────────────│                          │──────────────│  │──────────────│
│ - id         │                          │ - id         │  │ - id         │
│ - nom        │                          │ - numeroFact │  │ - medicaments│
│ - prenom     │                          │ - montant    │  │ - statut     │
│ - specialite │                          │ - statutPay  │  │              │
│ - numeroOrdre│                          └──────────────┘  └──────────────┘
└──────┬───────┘
       │
       │ (1:N)
       │
       ▼
┌─────────────────┐
│ DISPONIBILITE   │
│─────────────────│
│ - id            │
│ - jourSemaine   │ (legacy)
│ - heureDebut    │
│ - heureFin      │
│ - dateSpecifique│ (requis)
│ - dureeConsultation │
│ - estDisponible │
│ - estException  │ (toujours true)
└─────────────────┘


┌─────────────────┐
│  PATIENT (1)    │─────────────────(1:1)─────────────────┐
└─────────────────┘                                      │
                                                          │
                                              ┌───────────┴──────────┐
                                              │  DOSSIER_MEDICAL     │
                                              │──────────────────────│
                                              │ - id                 │
                                              │ - allergies          │
                                              │ - antecedents        │
                                              │ - vaccinations       │
                                              │ - examenBiologiques  │
                                              └──────────────────────┘
```

## Relations Détaillées

### Relations One-to-Many (1:N)

1. **Patient → RendezVous** : Un patient peut avoir plusieurs rendez-vous
2. **Patient → Consultation** : Un patient peut avoir plusieurs consultations
3. **Patient → Facture** : Un patient peut avoir plusieurs factures
4. **Patient → Prescription** : Un patient peut avoir plusieurs prescriptions
5. **User → RendezVous** : Un utilisateur peut avoir plusieurs rendez-vous
6. **User → Consultation** : Un utilisateur peut avoir plusieurs consultations
7. **User → Disponibilite** : Un utilisateur peut avoir plusieurs disponibilités
8. **User → Prescription** : Un utilisateur peut délivrer plusieurs prescriptions
9. **Consultation → Prescription** : Une consultation peut générer plusieurs prescriptions

### Relations One-to-One (1:1)

1. **Patient → DossierMedical** : Un patient a un seul dossier médical
2. **RendezVous → Consultation** : Un rendez-vous génère une consultation
3. **Consultation → Facture** : Une consultation génère une facture

### Relations Many-to-One (N:1)

1. **RendezVous → Patient** : Plusieurs rendez-vous appartiennent à un patient
2. **RendezVous → User** : Plusieurs rendez-vous appartiennent à un utilisateur
3. **Consultation → Patient** : Plusieurs consultations appartiennent à un patient
4. **Consultation → User** : Plusieurs consultations appartiennent à un utilisateur
5. **Prescription → Patient** : Plusieurs prescriptions appartiennent à un patient
6. **Prescription → User** : Plusieurs prescriptions appartiennent à un utilisateur
7. **Prescription → Consultation** : Plusieurs prescriptions appartiennent à une consultation
8. **Facture → Patient** : Plusieurs factures appartiennent à un patient
9. **Facture → Consultation** : Une facture appartient à une consultation
10. **Disponibilite → User** : Plusieurs disponibilités appartiennent à un utilisateur

## Flux Principal

```
1. Un Patient prend un RendezVous avec un Medecin 
   ↓
2. Le RendezVous est confirmé et a lieu
   ↓
3. Une Consultation est créée à partir du RendezVous
   ↓
4. L'Utilisateur médecin enregistre les détails (diagnostic, examen clinique)
   ↓
5. Une Prescription peut être créée si nécessaire
   ↓
6. Une Facture est générée automatiquement
   ↓
7. Le DossierMedical du Patient est mis à jour
```

## Cardinalités Résumées

| Entité A | Relation | Entité B | Cardinalité |
|----------|----------|----------|-------------|
| Patient | a | RendezVous | 1:N |
| Patient | a | Consultation | 1:N |
| Patient | a | DossierMedical | 1:1 |
| Patient | a | Facture | 1:N |
| Patient | a | Prescription | 1:N |
| User | a | RendezVous | 1:N |
| User | a | Consultation | 1:N |
| User | a | Disponibilite | 1:N |
| User | a | Prescription | 1:N |
| RendezVous | génère | Consultation | 1:1 |
| Consultation | génère | Facture | 1:1 |
| Consultation | a | Prescription | 1:N |


