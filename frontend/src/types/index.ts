export enum Sexe {
  M = 'M',
  F = 'F',
  Autre = 'Autre',
}

export enum StatutRendezVous {
  planifie = 'planifie',
  confirme = 'confirme',
  annule = 'annule',
  termine = 'termine',
  absent = 'absent',
}

export enum StatutPrescription {
  active = 'active',
  terminee = 'terminee',
  annulee = 'annulee',
}

export enum StatutPaiement {
  en_attente = 'en_attente',
  payee = 'payee',
  partiellement_payee = 'partiellement_payee',
  impayee = 'impayee',
}

export enum ModePaiement {
  especes = 'especes',
  carte = 'carte',
  cheque = 'cheque',
  virement = 'virement',
}

export interface Patient {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  sexe: Sexe;
  telephone: string;
  email?: string;
  adresse?: string;
  numeroSS: string;
  motDePasse?: string; // Hashé, ne jamais exposer au frontend
  groupeSanguin?: string;
  allergies?: string;
  antecedents?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  nom: string;
  prenom: string;
  specialite: string;
  numeroOrdre: string;
  telephone: string;
  email: string;
  userRole: string;
  photo?: string;
  createdAt: string;
}

export interface RendezVous {
  id: string;
  patientId: string;
  userId: string;
  dateHeure: string;
  duree: number;
  statut: StatutRendezVous;
  motif?: string;
  notes?: string;
  raisonAnnulation?: string;
  patient?: Patient;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Consultation {
  id: string;
  rendezVousId: string;
  patientId: string;
  userId: string;
  dateConsultation: string;
  motifConsultation?: string;
  examenClinique?: string;
  diagnostic?: string;
  observations?: string;
  recommandations?: string;
  prochainRendezVous?: string;
  patient?: Patient;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface DossierMedical {
  id: string;
  patientId: string;
  groupeSanguin?: string;
  allergies?: string;
  antecedents?: string;
  antecedentsFamiliaux?: string;
  traitementsEnCours?: string;
  vaccinations?: any;
  examenBiologiques?: any;
  historiqueChirurgical?: string;
  notesGenerales?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Prescription {
  id: string;
  consultationId: string;
  userId: string;
  patientId: string;
  datePrescription: string;
  medicaments: any;
  instructions?: string;
  dateDebut?: string;
  dateFin?: string;
  statut: StatutPrescription;
  createdAt: string;
  updatedAt: string;
}

export interface Facture {
  id: string;
  consultationId: string;
  patientId: string;
  numeroFacture: string;
  dateFacture: string;
  montantConsultation: number;
  montantTotal: number;
  tva?: number;
  statutPaiement: StatutPaiement;
  modePaiement?: ModePaiement;
  datePaiement?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Disponibilite {
  id: string;
  userId: string;
  jourSemaine: number;
  heureDebut: string;
  heureFin: string;
  dureeConsultation: number;
  dateSpecifique?: string;
  estException: boolean;
  estDisponible: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}


