import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Patient } from '../types';
import { format } from 'date-fns';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const PatientDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: patient, isLoading, error } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const response = await api.get(`/patients/${id}`);
      return response.data.data as Patient & {
        dossierMedical?: {
          id: string;
          groupeSanguin?: string;
          allergies?: string;
          antecedents?: string;
        };
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
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Dossier médical</h2>
              <div className="space-y-4">
                {patient.dossierMedical.groupeSanguin && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Groupe sanguin</label>
                    <p className="mt-1 text-gray-900">{patient.dossierMedical.groupeSanguin}</p>
                  </div>
                )}
                {patient.dossierMedical.allergies && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Allergies</label>
                    <p className="mt-1 text-gray-900 whitespace-pre-line">
                      {patient.dossierMedical.allergies}
                    </p>
                  </div>
                )}
                {patient.dossierMedical.antecedents && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Antécédents médicaux</label>
                    <p className="mt-1 text-gray-900 whitespace-pre-line">
                      {patient.dossierMedical.antecedents}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Informations supplémentaires si disponibles dans le patient */}
          {(patient.allergies || patient.antecedents || patient.groupeSanguin) && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations médicales</h2>
              <div className="space-y-4">
                {patient.groupeSanguin && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Groupe sanguin</label>
                    <p className="mt-1 text-gray-900">{patient.groupeSanguin}</p>
                  </div>
                )}
                {patient.allergies && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Allergies</label>
                    <p className="mt-1 text-gray-900 whitespace-pre-line">{patient.allergies}</p>
                  </div>
                )}
                {patient.antecedents && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Antécédents médicaux</label>
                    <p className="mt-1 text-gray-900 whitespace-pre-line">{patient.antecedents}</p>
                  </div>
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
    </div>
  );
};

export default PatientDetailPage;

