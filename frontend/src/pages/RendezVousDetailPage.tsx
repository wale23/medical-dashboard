import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { RendezVous } from '../types';
import { format } from 'date-fns';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '../store/authStore';
import { showSuccessAlert, showErrorAlert, getErrorMessage } from '../utils/alert';

const RendezVousDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: rendezVous, isLoading, error } = useQuery({
    queryKey: ['rendez-vous', id],
    queryFn: async () => {
      const response = await api.get(`/rendez-vous/${id}`);
      return response.data.data as RendezVous & {
        patient?: {
          id: string;
          nom: string;
          prenom: string;
          telephone: string;
          email?: string;
        };
        user?: {
          id: string;
          nom: string;
          prenom: string;
          specialite: string;
        };
        consultation?: {
          id: string;
          dateConsultation: string;
        };
      };
    },
    enabled: !!id,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const confirmRendezVousMutation = useMutation({
    mutationFn: async () => {
      const response = await api.patch(`/rendez-vous/${id}/confirm`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rendez-vous', id] });
      queryClient.invalidateQueries({ queryKey: ['rendez-vous'] });
      showSuccessAlert(data?.message || 'Rendez-vous confirmé avec succès');
    },
    onError: (error: any) => {
      const errorMessage = getErrorMessage(error);
      showErrorAlert(errorMessage);
    },
  });

  const handleConfirm = () => {
    if (window.confirm('Êtes-vous sûr de vouloir confirmer ce rendez-vous ?')) {
      confirmRendezVousMutation.mutate();
    }
  };

  if (error || !rendezVous) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Rendez-vous non trouvé</p>
          <button
            onClick={() => navigate('/rendez-vous')}
            className="btn btn-primary"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (statut: string) => {
    const colors: Record<string, string> = {
      planifie: 'bg-yellow-100 text-yellow-800',
      confirme: 'bg-blue-100 text-blue-800',
      termine: 'bg-green-100 text-green-800',
      annule: 'bg-red-100 text-red-800',
      absent: 'bg-gray-100 text-gray-800',
    };
    return colors[statut] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      {/* Header avec bouton retour */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/rendez-vous')}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Détails du rendez-vous</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations du rendez-vous */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations du rendez-vous</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Date et Heure</label>
                <p className="mt-1 text-gray-900">
                  {format(new Date(rendezVous.dateHeure), "dd/MM/yyyy 'à' HH:mm")}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Durée</label>
                <p className="mt-1 text-gray-900">{rendezVous.duree} minutes</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Statut</label>
                <p className="mt-1">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(
                      rendezVous.statut
                    )}`}
                  >
                    {rendezVous.statut}
                  </span>
                </p>
              </div>
              {rendezVous.motif && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Motif</label>
                  <p className="mt-1 text-gray-900">{rendezVous.motif}</p>
                </div>
              )}
              {rendezVous.notes && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-line">{rendezVous.notes}</p>
                </div>
              )}
              {rendezVous.raisonAnnulation && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Raison d'annulation</label>
                  <p className="mt-1 text-red-600">{rendezVous.raisonAnnulation}</p>
                </div>
              )}
            </div>
          </div>

          {/* Informations du patient */}
          {rendezVous.patient && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Patient</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nom complet</label>
                  <p className="mt-1 text-gray-900">
                    {rendezVous.patient.prenom} {rendezVous.patient.nom}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Téléphone</label>
                  <p className="mt-1 text-gray-900">{rendezVous.patient.telephone}</p>
                </div>
                {rendezVous.patient.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="mt-1 text-gray-900">{rendezVous.patient.email}</p>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <button
                  onClick={() => navigate(`/patients/${rendezVous.patientId}`)}
                  className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                >
                  Voir le profil du patient →
                </button>
              </div>
            </div>
          )}

          {/* Informations du médecin */}
          {rendezVous.user && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Médecin</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nom complet</label>
                  <p className="mt-1 text-gray-900">
                    Dr. {rendezVous.user.prenom} {rendezVous.user.nom}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Spécialité</label>
                  <p className="mt-1 text-gray-900">{rendezVous.user.specialite}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar avec informations supplémentaires */}
        <div className="space-y-6">
          {/* Informations supplémentaires */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Date de création</label>
                <p className="mt-1 text-gray-900">
                  {format(new Date(rendezVous.createdAt), 'dd/MM/yyyy à HH:mm')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Dernière modification</label>
                <p className="mt-1 text-gray-900">
                  {format(new Date(rendezVous.updatedAt), 'dd/MM/yyyy à HH:mm')}
                </p>
              </div>
              {rendezVous.consultation && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Consultation associée</label>
                  <p className="mt-1 text-gray-900">
                    {format(new Date(rendezVous.consultation.dateConsultation), 'dd/MM/yyyy')}
                  </p>
                  <button
                    onClick={() => navigate(`/consultations/${rendezVous.consultation?.id}`)}
                    className="mt-2 text-primary-600 hover:text-primary-900 text-sm font-medium"
                  >
                    Voir la consultation →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-2">
              {rendezVous.statut === 'confirme' &&
                (currentUser?.userRole === 'admin' || currentUser?.userRole === 'medecin') && (
                  <button
                    onClick={handleConfirm}
                    disabled={confirmRendezVousMutation.isPending}
                    className="w-full btn btn-primary"
                  >
                    {confirmRendezVousMutation.isPending ? 'Confirmation...' : 'Confirmer le rendez-vous'}
                  </button>
                )}
              {rendezVous.statut === 'planifie' && !rendezVous.consultation && (
                <button
                  onClick={() => navigate(`/consultations?rendezVousId=${rendezVous.id}`)}
                  className="w-full btn btn-primary"
                >
                  Créer une consultation
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RendezVousDetailPage;

