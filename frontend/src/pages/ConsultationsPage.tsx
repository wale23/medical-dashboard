import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';
import { Consultation, RendezVous, Prescription, DossierMedical, StatutPrescription, Facture, StatutPaiement, ModePaiement } from '../types';
import { format } from 'date-fns';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '../store/authStore';
import { showSuccessAlert, showErrorAlert, getErrorMessage } from '../utils/alert';

const createConsultationSchema = z.object({
  rendezVousId: z.string().min(1, 'Le rendez-vous est requis'),
  motifConsultation: z.string().optional(),
  examenClinique: z.string().optional(),
  diagnostic: z.string().optional(),
  observations: z.string().optional(),
  recommandations: z.string().optional(),
  prochainRendezVous: z.string().optional(),
});

const createPrescriptionSchema = z.object({
  medicaments: z.string().min(1, 'Les médicaments sont requis'),
  instructions: z.string().optional(),
  dateDebut: z.string().optional(),
  dateFin: z.string().optional(),
});

const updateDossierMedicalSchema = z.object({
  groupeSanguin: z.string().optional(),
  allergies: z.string().optional(),
  antecedents: z.string().optional(),
  antecedentsFamiliaux: z.string().optional(),
  traitementsEnCours: z.string().optional(),
  historiqueChirurgical: z.string().optional(),
  notesGenerales: z.string().optional(),
});

const createFactureSchema = z.object({
  montantConsultation: z.string().min(1, 'Le montant de consultation est requis'),
  tva: z.string().optional(),
  notes: z.string().optional(),
});

const updateFactureSchema = z.object({
  statutPaiement: z.nativeEnum(StatutPaiement),
  modePaiement: z.nativeEnum(ModePaiement).optional(),
  datePaiement: z.string().optional(),
  notes: z.string().optional(),
});

type CreateConsultationFormData = z.infer<typeof createConsultationSchema>;
type CreatePrescriptionFormData = z.infer<typeof createPrescriptionSchema>;
type UpdateDossierMedicalFormData = z.infer<typeof updateDossierMedicalSchema>;
type CreateFactureFormData = z.infer<typeof createFactureSchema>;
type UpdateFactureFormData = z.infer<typeof updateFactureSchema>;

const ConsultationsPage = () => {
  const { user: currentUser, patient: currentPatient } = useAuthStore();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);
  const [isFactureModalOpen, setIsFactureModalOpen] = useState(false);
  const [isValidateFactureModalOpen, setIsValidateFactureModalOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const [isRendezVousDropdownOpen, setIsRendezVousDropdownOpen] = useState(false);

  // Récupérer les consultations : du médecin connecté si médecin, toutes si admin, du patient si patient
  const { data: consultations, isLoading } = useQuery({
    queryKey: ['consultations', currentUser?.userRole, currentUser?.id, currentPatient?.id],
    queryFn: async () => {
      if (currentUser?.userRole === 'admin') {
        const response = await api.get('/consultations');
        return response.data.data as (Consultation & {
          patient?: { id: string; nom: string; prenom: string };
          user?: { id: string; nom: string; prenom: string; specialite: string };
          prescriptions?: Prescription[];
          facture?: Facture | null;
        })[];
      } else if (currentUser?.userRole === 'medecin' && currentUser?.id) {
        const response = await api.get(`/consultations/user/${currentUser.id}`);
        return response.data.data as (Consultation & {
          patient?: { id: string; nom: string; prenom: string };
          user?: { id: string; nom: string; prenom: string; specialite: string };
          prescriptions?: Prescription[];
          facture?: Facture | null;
        })[];
      } else if (currentPatient?.id) {
        // Pour les patients, récupérer leurs consultations
        const response = await api.get('/consultations');
        return response.data.data as (Consultation & {
          patient?: { id: string; nom: string; prenom: string };
          user?: { id: string; nom: string; prenom: string; specialite: string };
          prescriptions?: Prescription[];
          facture?: Facture | null;
        })[];
      }
      return [];
    },
    enabled: (!!currentUser?.id && (currentUser?.userRole === 'medecin' || currentUser?.userRole === 'admin')) || !!currentPatient?.id,
  });

  // Récupérer les rendez-vous du médecin qui peuvent être utilisés pour créer une consultation
  const { data: rendezVousDisponibles } = useQuery({
    queryKey: ['rendez-vous', 'disponibles', currentUser?.id],
    queryFn: async () => {
      const response = await api.get('/rendez-vous');
      const allRendezVous = response.data.data as (RendezVous & {
        patient?: { id: string; nom: string; prenom: string };
        consultation?: Consultation | null;
      })[];
      // Filtrer pour ne garder que les rendez-vous du médecin avec statut "planifie" ou "confirme" et sans consultation
      return allRendezVous.filter(
        (rdv) =>
          rdv.userId === currentUser?.id &&
          (rdv.statut === 'planifie' || rdv.statut === 'confirme') &&
          !rdv.consultation
      );
    },
    enabled: !!currentUser?.id && currentUser?.userRole === 'medecin',
  });

  const {
    register: registerConsultation,
    handleSubmit: handleSubmitConsultation,
    formState: { errors: errorsConsultation },
    reset: resetConsultation,
    watch: watchConsultation,
    setValue: setValueConsultation,
  } = useForm<CreateConsultationFormData>({
    resolver: zodResolver(createConsultationSchema),
  });

  const {
    register: registerPrescription,
    handleSubmit: handleSubmitPrescription,
    formState: { errors: errorsPrescription },
    reset: resetPrescription,
  } = useForm<CreatePrescriptionFormData>({
    resolver: zodResolver(createPrescriptionSchema),
  });

  const {
    register: registerDossier,
    handleSubmit: handleSubmitDossier,
    formState: { errors: errorsDossier },
    reset: resetDossier,
  } = useForm<UpdateDossierMedicalFormData>({
    resolver: zodResolver(updateDossierMedicalSchema),
  });

  const {
    register: registerFacture,
    handleSubmit: handleSubmitFacture,
    formState: { errors: errorsFacture },
    reset: resetFacture,
  } = useForm<CreateFactureFormData>({
    resolver: zodResolver(createFactureSchema),
  });

  const {
    register: registerValidateFacture,
    handleSubmit: handleSubmitValidateFacture,
    formState: { errors: errorsValidateFacture },
    reset: resetValidateFacture,
  } = useForm<UpdateFactureFormData>({
    resolver: zodResolver(updateFactureSchema),
  });

  const selectedRendezVousId = watchConsultation('rendezVousId');
  const selectedRendezVous = rendezVousDisponibles?.find((rdv) => rdv.id === selectedRendezVousId);

  // Mutation pour créer une consultation
  const createConsultationMutation = useMutation({
    mutationFn: async (data: CreateConsultationFormData) => {
      if (!selectedRendezVous || !currentUser) {
        throw new Error('Rendez-vous ou utilisateur non sélectionné');
      }
      const consultationData = {
        rendezVousId: data.rendezVousId,
        patientId: selectedRendezVous.patientId,
        userId: currentUser.id,
        dateConsultation: new Date().toISOString(),
        motifConsultation: data.motifConsultation,
        examenClinique: data.examenClinique,
        diagnostic: data.diagnostic,
        observations: data.observations,
        recommandations: data.recommandations,
        prochainRendezVous: data.prochainRendezVous || null,
      };
      const response = await api.post('/consultations', consultationData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      queryClient.invalidateQueries({ queryKey: ['rendez-vous'] });
      setIsCreateModalOpen(false);
      resetConsultation();
      showSuccessAlert('Consultation créée avec succès');
    },
    onError: (error: any) => {
      const errorMessage = getErrorMessage(error);
      showErrorAlert(errorMessage);
    },
  });

  // Mutation pour créer une prescription
  const createPrescriptionMutation = useMutation({
    mutationFn: async (data: CreatePrescriptionFormData) => {
      if (!selectedConsultation || !currentUser) {
        throw new Error('Consultation ou utilisateur non sélectionné');
      }
      const prescriptionData = {
        consultationId: selectedConsultation.id,
        userId: currentUser.id,
        patientId: selectedConsultation.patientId,
        medicaments: data.medicaments,
        instructions: data.instructions,
        dateDebut: data.dateDebut || null,
        dateFin: data.dateFin || null,
      };
      const response = await api.post('/prescriptions', prescriptionData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      setIsPrescriptionModalOpen(false);
      resetPrescription();
      setSelectedConsultation(null);
      showSuccessAlert('Prescription créée avec succès');
    },
    onError: (error: any) => {
      const errorMessage = getErrorMessage(error);
      showErrorAlert(errorMessage);
    },
  });

  // Mutation pour mettre à jour le dossier médical
  const updateDossierMedicalMutation = useMutation({
    mutationFn: async (data: UpdateDossierMedicalFormData) => {
      if (!selectedConsultation) {
        throw new Error('Consultation non sélectionnée');
      }
      const response = await api.put(
        `/dossiers-medicaux/patient/${selectedConsultation.patientId}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setIsDossierModalOpen(false);
      resetDossier();
      setSelectedConsultation(null);
      showSuccessAlert('Dossier médical mis à jour avec succès');
    },
    onError: (error: any) => {
      const errorMessage = getErrorMessage(error);
      showErrorAlert(errorMessage);
    },
  });

  const onSubmitConsultation = (data: CreateConsultationFormData) => {
    createConsultationMutation.mutate(data);
  };

  const onSubmitPrescription = (data: CreatePrescriptionFormData) => {
    createPrescriptionMutation.mutate(data);
  };

  const onSubmitDossier = (data: UpdateDossierMedicalFormData) => {
    updateDossierMedicalMutation.mutate(data);
  };

  // Mutation pour créer une facture
  const createFactureMutation = useMutation({
    mutationFn: async (data: CreateFactureFormData) => {
      if (!selectedConsultation) {
        throw new Error('Consultation non sélectionnée');
      }
      const factureData = {
        consultationId: selectedConsultation.id,
        patientId: selectedConsultation.patientId,
        montantConsultation: data.montantConsultation,
        tva: data.tva || null,
        notes: data.notes || null,
      };
      const response = await api.post('/factures', factureData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      setIsFactureModalOpen(false);
      resetFacture();
      setSelectedConsultation(null);
      showSuccessAlert('Facture créée avec succès');
    },
    onError: (error: any) => {
      const errorMessage = getErrorMessage(error);
      showErrorAlert(errorMessage);
    },
  });

  // Mutation pour valider/mettre à jour une facture
  const updateFactureMutation = useMutation({
    mutationFn: async (data: UpdateFactureFormData) => {
      if (!selectedFacture) {
        throw new Error('Facture non sélectionnée');
      }
      const response = await api.put(`/factures/${selectedFacture.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      setIsValidateFactureModalOpen(false);
      resetValidateFacture();
      setSelectedFacture(null);
      showSuccessAlert('Facture mise à jour avec succès');
    },
    onError: (error: any) => {
      const errorMessage = getErrorMessage(error);
      showErrorAlert(errorMessage);
    },
  });

  const onSubmitFacture = (data: CreateFactureFormData) => {
    createFactureMutation.mutate(data);
  };

  const onSubmitValidateFacture = (data: UpdateFactureFormData) => {
    updateFactureMutation.mutate(data);
  };

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
    resetConsultation();
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    resetConsultation();
  };

  const openPrescriptionModal = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setIsPrescriptionModalOpen(true);
    resetPrescription();
  };

  const closePrescriptionModal = () => {
    setIsPrescriptionModalOpen(false);
    setSelectedConsultation(null);
    resetPrescription();
  };

  const openDossierModal = async (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    try {
      // Récupérer le dossier médical du patient
      const response = await api.get(`/dossiers-medicaux/patient/${consultation.patientId}`);
      const dossier = response.data.data as DossierMedical;
      resetDossier({
        groupeSanguin: dossier.groupeSanguin || '',
        allergies: dossier.allergies || '',
        antecedents: dossier.antecedents || '',
        antecedentsFamiliaux: dossier.antecedentsFamiliaux || '',
        traitementsEnCours: dossier.traitementsEnCours || '',
        historiqueChirurgical: dossier.historiqueChirurgical || '',
        notesGenerales: dossier.notesGenerales || '',
      });
      setIsDossierModalOpen(true);
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      showErrorAlert(errorMessage);
    }
  };

  const closeDossierModal = () => {
    setIsDossierModalOpen(false);
    setSelectedConsultation(null);
    resetDossier();
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const openFactureModal = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setIsFactureModalOpen(true);
    resetFacture();
  };

  const closeFactureModal = () => {
    setIsFactureModalOpen(false);
    setSelectedConsultation(null);
    resetFacture();
  };

  const openValidateFactureModal = async (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    try {
      // Récupérer la facture de la consultation
      const response = await api.get(`/factures`);
      const allFactures = response.data.data as Facture[];
      const facture = allFactures.find((f) => f.consultationId === consultation.id);
      if (facture) {
        setSelectedFacture(facture);
        resetValidateFacture({
          statutPaiement: facture.statutPaiement,
          modePaiement: facture.modePaiement || undefined,
          datePaiement: facture.datePaiement ? format(new Date(facture.datePaiement), 'yyyy-MM-dd') : undefined,
          notes: facture.notes || '',
        });
        setIsValidateFactureModalOpen(true);
      }
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      showErrorAlert(errorMessage);
    }
  };

  const closeValidateFactureModal = () => {
    setIsValidateFactureModalOpen(false);
    setSelectedFacture(null);
    setSelectedConsultation(null);
    resetValidateFacture();
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          {currentPatient ? 'Mes Consultations' : 'Consultations'}
        </h1>
        {/* Bouton de création uniquement pour les médecins */}
        {currentUser?.userRole === 'medecin' && (
          <button onClick={openCreateModal} className="btn btn-primary">
            Nouvelle consultation
          </button>
        )}
      </div>

      <div className="space-y-4">
        {consultations && consultations.length > 0 ? (
          consultations.map((consultation) => (
            <div key={consultation.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {currentPatient
                        ? `Dr. ${consultation.user?.prenom} ${consultation.user?.nom} - ${consultation.user?.specialite}`
                        : `${consultation.patient?.prenom} ${consultation.patient?.nom}`}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {format(new Date(consultation.dateConsultation), "dd/MM/yyyy 'à' HH:mm")}
                    </span>
                  </div>
                  {consultation.motifConsultation && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Motif:</span> {consultation.motifConsultation}
                    </p>
                  )}
                  {consultation.diagnostic && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Diagnostic:</span> {consultation.diagnostic}
                    </p>
                  )}
                  {consultation.observations && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Observations:</span> {consultation.observations}
                    </p>
                  )}
                  {consultation.prescriptions && consultation.prescriptions.length > 0 && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ {consultation.prescriptions.length} prescription(s)
                    </p>
                  )}
                  {consultation.facture && (
                    <p className="text-sm text-blue-600 mt-2">
                      💰 Facture: {consultation.facture.numeroFacture} -{' '}
                      {consultation.facture.statutPaiement === 'payee'
                        ? 'Payée'
                        : consultation.facture.statutPaiement === 'en_attente'
                          ? 'En attente'
                          : consultation.facture.statutPaiement}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {currentUser?.userRole === 'medecin' && (
                    <>
                      {(!consultation.prescriptions || consultation.prescriptions.length === 0) && (
                        <button
                          onClick={() => openPrescriptionModal(consultation)}
                          className="btn btn-secondary text-sm"
                        >
                          Créer prescription
                        </button>
                      )}
                      <button
                        onClick={() => openDossierModal(consultation)}
                        className="btn btn-secondary text-sm"
                      >
                        Mettre à jour dossier
                      </button>
                    </>
                  )}
                  {currentUser?.userRole === 'admin' && (
                    <>
                      {!consultation.facture ? (
                        <button
                          onClick={() => openFactureModal(consultation)}
                          className="btn btn-primary text-sm"
                        >
                          Créer facture
                        </button>
                      ) : (
                        <button
                          onClick={() => openValidateFactureModal(consultation)}
                          className="btn btn-secondary text-sm"
                        >
                          Valider facture
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card text-center text-gray-500">
            Aucune consultation enregistrée pour le moment.
          </div>
        )}
      </div>

      {/* Modal de création de consultation */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeCreateModal();
            }
          }}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Nouvelle consultation</h2>
              <button
                onClick={closeCreateModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form
              onSubmit={handleSubmitConsultation(onSubmitConsultation)}
              className="p-6 space-y-6"
            >
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rendez-vous <span className="text-red-500">*</span>
                </label>
                <input
                  type="hidden"
                  {...registerConsultation('rendezVousId')}
                />
                <button
                  type="button"
                  onClick={() => setIsRendezVousDropdownOpen(!isRendezVousDropdownOpen)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 bg-white rounded-lg border shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 text-left ${
                    errorsConsultation.rendezVousId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <span className="text-sm  text-gray-800">
                    {watchConsultation('rendezVousId')
                      ? (() => {
                          const selected = rendezVousDisponibles?.find(
                            (rdv) => rdv.id === watchConsultation('rendezVousId')
                          );
                          return selected
                            ? `${selected.patient?.prenom} ${selected.patient?.nom} - ${format(new Date(selected.dateHeure), "dd/MM/yyyy 'à' HH:mm")}`
                            : 'Sélectionner un rendez-vous';
                        })()
                      : 'Sélectionner un rendez-vous'}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                      isRendezVousDropdownOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isRendezVousDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsRendezVousDropdownOpen(false)}
                    />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg border border-gray-200 shadow-lg z-20 overflow-hidden max-h-60 overflow-y-auto">
                      <div className="py-1">
                        {rendezVousDisponibles && rendezVousDisponibles.length > 0 ? (
                          rendezVousDisponibles.map((rdv) => (
                            <button
                              key={rdv.id}
                              type="button"
                              onClick={() => {
                                setValueConsultation('rendezVousId', rdv.id, {
                                  shouldValidate: true,
                                });
                                setIsRendezVousDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                                watchConsultation('rendezVousId') === rdv.id
                                  ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex flex-col">
                                <span className="font-semibold">
                                  {rdv.patient?.prenom} {rdv.patient?.nom}
                                </span>
                                <span className="text-xs text-gray-500 mt-1">
                                  {format(new Date(rdv.dateHeure), "dd/MM/yyyy 'à' HH:mm")}
                                </span>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            Aucun rendez-vous disponible
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
                {errorsConsultation.rendezVousId && (
                  <p className="mt-1 text-sm text-red-500">
                    {errorsConsultation.rendezVousId.message}
                  </p>
                )}
              </div>

              {selectedRendezVous && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Patient:</strong> {selectedRendezVous.patient?.prenom}{' '}
                    {selectedRendezVous.patient?.nom}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motif de consultation
                </label>
                <input
                  {...registerConsultation('motifConsultation')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Motif de la consultation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Examen clinique
                </label>
                <textarea
                  {...registerConsultation('examenClinique')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Résultats de l'examen clinique"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Diagnostic</label>
                <textarea
                  {...registerConsultation('diagnostic')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Diagnostic"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observations</label>
                <textarea
                  {...registerConsultation('observations')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Observations"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recommandations
                </label>
                <textarea
                  {...registerConsultation('recommandations')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Recommandations"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prochain rendez-vous (optionnel)
                </label>
                <input
                  {...registerConsultation('prochainRendezVous')}
                  type="datetime-local"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createConsultationMutation.isPending}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createConsultationMutation.isPending ? 'Création...' : 'Créer la consultation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de création de prescription */}
      {isPrescriptionModalOpen && selectedConsultation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closePrescriptionModal();
            }
          }}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Créer une prescription</h2>
              <button
                onClick={closePrescriptionModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form
              onSubmit={handleSubmitPrescription(onSubmitPrescription)}
              className="p-6 space-y-6"
            >
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Patient:</strong> {selectedConsultation.patient?.prenom}{' '}
                  {selectedConsultation.patient?.nom}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Médicaments <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...registerPrescription('medicaments')}
                  rows={5}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errorsPrescription.medicaments ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Liste des médicaments prescrits (un par ligne)"
                />
                {errorsPrescription.medicaments && (
                  <p className="mt-1 text-sm text-red-500">
                    {errorsPrescription.medicaments.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
                <textarea
                  {...registerPrescription('instructions')}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Instructions pour la prise des médicaments"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de début (optionnel)
                  </label>
                  <input
                    {...registerPrescription('dateDebut')}
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de fin (optionnel)
                  </label>
                  <input
                    {...registerPrescription('dateFin')}
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closePrescriptionModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createPrescriptionMutation.isPending}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createPrescriptionMutation.isPending ? 'Création...' : 'Créer la prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de mise à jour du dossier médical */}
      {isDossierModalOpen && selectedConsultation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeDossierModal();
            }
          }}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Mettre à jour le dossier médical
              </h2>
              <button
                onClick={closeDossierModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitDossier(onSubmitDossier)} className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Patient:</strong> {selectedConsultation.patient?.prenom}{' '}
                  {selectedConsultation.patient?.nom}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Groupe sanguin
                  </label>
                  <input
                    {...registerDossier('groupeSanguin')}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ex: A+, O-, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                  <textarea
                    {...registerDossier('allergies')}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Liste des allergies connues"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Antécédents médicaux
                  </label>
                  <textarea
                    {...registerDossier('antecedents')}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Antécédents médicaux"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Antécédents familiaux
                  </label>
                  <textarea
                    {...registerDossier('antecedentsFamiliaux')}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Antécédents familiaux"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Traitements en cours
                  </label>
                  <textarea
                    {...registerDossier('traitementsEnCours')}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Traitements médicamenteux actuels"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Historique chirurgical
                  </label>
                  <textarea
                    {...registerDossier('historiqueChirurgical')}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Interventions chirurgicales passées"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes générales
                  </label>
                  <textarea
                    {...registerDossier('notesGenerales')}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Notes générales sur le dossier médical"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeDossierModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={updateDossierMedicalMutation.isPending}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateDossierMedicalMutation.isPending
                    ? 'Mise à jour...'
                    : 'Mettre à jour le dossier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de création de facture */}
      {isFactureModalOpen && selectedConsultation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeFactureModal();
            }
          }}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Créer une facture</h2>
              <button
                onClick={closeFactureModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitFacture(onSubmitFacture)} className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Patient:</strong> {selectedConsultation.patient?.prenom}{' '}
                  {selectedConsultation.patient?.nom}
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  <strong>Consultation:</strong>{' '}
                  {format(new Date(selectedConsultation.dateConsultation), "dd/MM/yyyy 'à' HH:mm")}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant de consultation (TND) <span className="text-red-500">*</span>
                </label>
                <input
                  {...registerFacture('montantConsultation')}
                  type="number"
                  step="0.01"
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errorsFacture.montantConsultation ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errorsFacture.montantConsultation && (
                  <p className="mt-1 text-sm text-red-500">
                    {errorsFacture.montantConsultation.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  TVA (%) (optionnel)
                </label>
                <input
                  {...registerFacture('tva')}
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="19"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  {...registerFacture('notes')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Notes supplémentaires sur la facture"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeFactureModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createFactureMutation.isPending}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createFactureMutation.isPending ? 'Création...' : 'Créer la facture'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de validation de facture */}
      {isValidateFactureModalOpen && selectedFacture && selectedConsultation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeValidateFactureModal();
            }
          }}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Valider la facture</h2>
              <button
                onClick={closeValidateFactureModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form
              onSubmit={handleSubmitValidateFacture(onSubmitValidateFacture)}
              className="p-6 space-y-6"
            >
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Numéro de facture:</strong> {selectedFacture.numeroFacture}
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  <strong>Montant total:</strong> {selectedFacture.montantTotal} TND
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  <strong>Patient:</strong> {selectedConsultation.patient?.prenom}{' '}
                  {selectedConsultation.patient?.nom}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut de paiement <span className="text-red-500">*</span>
                </label>
                <select
                  {...registerValidateFacture('statutPaiement')}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errorsValidateFacture.statutPaiement ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="en_attente">En attente</option>
                  <option value="payee">Payée</option>
                  <option value="partiellement_payee">Partiellement payée</option>
                  <option value="impayee">Impayée</option>
                </select>
                {errorsValidateFacture.statutPaiement && (
                  <p className="mt-1 text-sm text-red-500">
                    {errorsValidateFacture.statutPaiement.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mode de paiement
                </label>
                <select
                  {...registerValidateFacture('modePaiement')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Sélectionner un mode de paiement</option>
                  <option value="especes">Espèces</option>
                  <option value="carte">Carte</option>
                  <option value="cheque">Chèque</option>
                  <option value="virement">Virement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de paiement
                </label>
                <input
                  {...registerValidateFacture('datePaiement')}
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  {...registerValidateFacture('notes')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Notes supplémentaires"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeValidateFactureModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={updateFactureMutation.isPending}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateFactureMutation.isPending ? 'Validation...' : 'Valider la facture'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationsPage;
