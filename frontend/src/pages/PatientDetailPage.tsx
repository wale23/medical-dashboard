import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';
import { Patient, DossierMedical } from '../types';
import { format } from 'date-fns';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '../store/authStore';
import { showSuccessAlert, showErrorAlert, getErrorMessage } from '../utils/alert';

const updateDossierMedicalSchema = z.object({
  groupeSanguin: z.string().optional(),
  allergies: z.string().optional(),
  antecedents: z.string().optional(),
  antecedentsFamiliaux: z.string().optional(),
  traitementsEnCours: z.string().optional(),
  historiqueChirurgical: z.string().optional(),
  notesGenerales: z.string().optional(),
});

type UpdateDossierMedicalFormData = z.infer<typeof updateDossierMedicalSchema>;

const PatientDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isEditDossierModalOpen, setIsEditDossierModalOpen] = useState(false);

  // Vérifier si l'utilisateur peut modifier le dossier médical (admin ou médecin)
  const canEditDossier = user?.userRole === 'admin' || user?.userRole === 'medecin';

  const { data: patient, isLoading, error } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const response = await api.get(`/patients/${id}`);
      return response.data.data as Patient & {
        dossierMedical?: DossierMedical;
        rendezVous?: Array<{
          id: string;
          dateHeure: string;
          statut: string;
        }>;
        consultations?: Array<{
          id: string;
          dateConsultation: string;
        }>;
      };
    },
    enabled: !!id,
  });

  // Récupérer le dossier médical complet
  const { data: dossierMedical } = useQuery({
    queryKey: ['dossier-medical', id],
    queryFn: async () => {
      const response = await api.get(`/dossiers-medicaux/patient/${id}`);
      return response.data.data as DossierMedical;
    },
    enabled: !!id && !!patient?.dossierMedical,
  });

  const {
    register: registerDossier,
    handleSubmit: handleSubmitDossier,
    reset: resetDossier,
  } = useForm<UpdateDossierMedicalFormData>({
    resolver: zodResolver(updateDossierMedicalSchema),
    defaultValues: {
      groupeSanguin: dossierMedical?.groupeSanguin || '',
      allergies: dossierMedical?.allergies || '',
      antecedents: dossierMedical?.antecedents || '',
      antecedentsFamiliaux: dossierMedical?.antecedentsFamiliaux || '',
      traitementsEnCours: dossierMedical?.traitementsEnCours || '',
      historiqueChirurgical: dossierMedical?.historiqueChirurgical || '',
      notesGenerales: dossierMedical?.notesGenerales || '',
    },
  });

  // Mettre à jour les valeurs du formulaire quand le dossier médical est chargé
  useEffect(() => {
    if (dossierMedical) {
      resetDossier({
        groupeSanguin: dossierMedical.groupeSanguin || '',
        allergies: dossierMedical.allergies || '',
        antecedents: dossierMedical.antecedents || '',
        antecedentsFamiliaux: dossierMedical.antecedentsFamiliaux || '',
        traitementsEnCours: dossierMedical.traitementsEnCours || '',
        historiqueChirurgical: dossierMedical.historiqueChirurgical || '',
        notesGenerales: dossierMedical.notesGenerales || '',
      });
    }
  }, [dossierMedical, resetDossier]);

  const updateDossierMedicalMutation = useMutation({
    mutationFn: async (data: UpdateDossierMedicalFormData) => {
      const response = await api.put(`/dossiers-medicaux/patient/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
      queryClient.invalidateQueries({ queryKey: ['dossier-medical', id] });
      setIsEditDossierModalOpen(false);
      showSuccessAlert(data?.message || 'Dossier médical mis à jour avec succès');
    },
    onError: (error: any) => {
      const errorMessage = getErrorMessage(error);
      showErrorAlert(errorMessage);
    },
  });

  const onSubmitDossier = (data: UpdateDossierMedicalFormData) => {
    updateDossierMedicalMutation.mutate(data);
  };

  const openEditDossierModal = () => {
    if (dossierMedical) {
      resetDossier({
        groupeSanguin: dossierMedical.groupeSanguin || '',
        allergies: dossierMedical.allergies || '',
        antecedents: dossierMedical.antecedents || '',
        antecedentsFamiliaux: dossierMedical.antecedentsFamiliaux || '',
        traitementsEnCours: dossierMedical.traitementsEnCours || '',
        historiqueChirurgical: dossierMedical.historiqueChirurgical || '',
        notesGenerales: dossierMedical.notesGenerales || '',
      });
    }
    setIsEditDossierModalOpen(true);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !patient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Patient non trouvé</p>
          <button
            onClick={() => navigate('/patients')}
            className="btn btn-primary"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header avec bouton retour */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/patients')}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {patient.prenom} {patient.nom}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations personnelles */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations personnelles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Nom complet</label>
                <p className="mt-1 text-gray-900">{patient.prenom} {patient.nom}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Date de naissance</label>
                <p className="mt-1 text-gray-900">
                  {format(new Date(patient.dateNaissance), 'dd/MM/yyyy')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Sexe</label>
                <p className="mt-1 text-gray-900">{patient.sexe}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Téléphone</label>
                <p className="mt-1 text-gray-900">{patient.telephone}</p>
              </div>
              {patient.email && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="mt-1 text-gray-900">{patient.email}</p>
                </div>
              )}
              {patient.adresse && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Adresse</label>
                  <p className="mt-1 text-gray-900">{patient.adresse}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Numéro de sécurité sociale</label>
                <p className="mt-1 text-gray-900">{patient.numeroSS}</p>
              </div>
            </div>
          </div>

          {/* Dossier médical */}
          {patient.dossierMedical && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-gray-900">Dossier médical</h2>
                  {canEditDossier && (
                    <button
                      onClick={openEditDossierModal}
                      className="text-primary-600 hover:text-primary-700 transition-colors p-1 rounded hover:bg-primary-50"
                      title="Modifier le dossier médical"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                {dossierMedical?.groupeSanguin && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Groupe sanguin</label>
                    <p className="mt-1 text-gray-900">{dossierMedical.groupeSanguin}</p>
                  </div>
                )}
                {dossierMedical?.allergies && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Allergies</label>
                    <p className="mt-1 text-gray-900 whitespace-pre-line">
                      {dossierMedical.allergies}
                    </p>
                  </div>
                )}
                {dossierMedical?.antecedents && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Antécédents médicaux</label>
                    <p className="mt-1 text-gray-900 whitespace-pre-line">
                      {dossierMedical.antecedents}
                    </p>
                  </div>
                )}
                {dossierMedical?.antecedentsFamiliaux && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Antécédents familiaux</label>
                    <p className="mt-1 text-gray-900 whitespace-pre-line">
                      {dossierMedical.antecedentsFamiliaux}
                    </p>
                  </div>
                )}
                {dossierMedical?.traitementsEnCours && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Traitements en cours</label>
                    <p className="mt-1 text-gray-900 whitespace-pre-line">
                      {dossierMedical.traitementsEnCours}
                    </p>
                  </div>
                )}
                {dossierMedical?.historiqueChirurgical && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Historique chirurgical</label>
                    <p className="mt-1 text-gray-900 whitespace-pre-line">
                      {dossierMedical.historiqueChirurgical}
                    </p>
                  </div>
                )}
                {dossierMedical?.notesGenerales && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Notes générales</label>
                    <p className="mt-1 text-gray-900 whitespace-pre-line">
                      {dossierMedical.notesGenerales}
                    </p>
                  </div>
                )}
                {!dossierMedical?.groupeSanguin &&
                  !dossierMedical?.allergies &&
                  !dossierMedical?.antecedents &&
                  !dossierMedical?.antecedentsFamiliaux &&
                  !dossierMedical?.traitementsEnCours &&
                  !dossierMedical?.historiqueChirurgical &&
                  !dossierMedical?.notesGenerales && (
                    <p className="text-gray-500 italic">Dossier médical vide (statut initial)</p>
                  )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar avec statistiques */}
        <div className="space-y-6">
          {/* Statistiques */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Statistiques</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Rendez-vous</label>
                <p className="mt-1 text-2xl font-bold text-primary-600">
                  {patient.rendezVous?.length || 0}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Consultations</label>
                <p className="mt-1 text-2xl font-bold text-primary-600">
                  {patient.consultations?.length || 0}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Date d'inscription</label>
                <p className="mt-1 text-gray-900">
                  {format(new Date(patient.createdAt), 'dd/MM/yyyy')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de modification du dossier médical */}
      {isEditDossierModalOpen && dossierMedical && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsEditDossierModalOpen(false);
            }
          }}
        >
          <div
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Modifier le dossier médical</h2>
              <button
                onClick={() => setIsEditDossierModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitDossier(onSubmitDossier)} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Groupe sanguin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Groupe sanguin</label>
                  <input
                    {...registerDossier('groupeSanguin')}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ex: A+, O-, etc."
                  />
                </div>

                {/* Allergies */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                  <textarea
                    {...registerDossier('allergies')}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Liste des allergies connues"
                  />
                </div>

                {/* Antécédents médicaux */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Antécédents médicaux</label>
                  <textarea
                    {...registerDossier('antecedents')}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Antécédents médicaux du patient"
                  />
                </div>

                {/* Antécédents familiaux */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Antécédents familiaux</label>
                  <textarea
                    {...registerDossier('antecedentsFamiliaux')}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Antécédents familiaux"
                  />
                </div>

                {/* Traitements en cours */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Traitements en cours</label>
                  <textarea
                    {...registerDossier('traitementsEnCours')}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Traitements médicaux en cours"
                  />
                </div>

                {/* Historique chirurgical */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Historique chirurgical</label>
                  <textarea
                    {...registerDossier('historiqueChirurgical')}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Historique des interventions chirurgicales"
                  />
                </div>
              </div>

              {/* Notes générales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes générales</label>
                <textarea
                  {...registerDossier('notesGenerales')}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Notes générales sur le dossier médical"
                />
              </div>

              {/* Boutons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsEditDossierModalOpen(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={updateDossierMedicalMutation.isPending}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateDossierMedicalMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetailPage;
