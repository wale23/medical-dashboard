import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Patient } from '../types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { useAuthStore } from '../store/authStore';

const PatientProfilePage = () => {
  const { patient: currentPatient } = useAuthStore();
  const patientId = currentPatient?.id;

  const { data: patient, isLoading, error } = useQuery({
    queryKey: ['patient-profile', patientId],
    queryFn: async () => {
      if (!patientId) {
        throw new Error('ID patient non disponible');
      }
      try {
        // Utiliser la route /patients/me pour que le patient accède à son propre profil
        const response = await api.get('/patients/me');
        return response.data.data as Patient & {
          dossierMedical?: {
            id: string;
            groupeSanguin?: string;
            allergies?: string;
            antecedents?: string;
            antecedentsFamiliaux?: string;
            traitementsEnCours?: string;
            historiqueChirurgical?: string;
            notesGenerales?: string;
          };
        };
      } catch (err: any) {
        console.error('Erreur lors du chargement du profil patient:', err);
        throw err;
      }
    },
    enabled: !!patientId,
    retry: 1,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !patient) {
    console.error('Erreur patient profile:', error);
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erreur lors du chargement du profil</p>
          {!currentPatient && (
            <p className="text-gray-500 text-sm mb-4">Aucun patient connecté trouvé</p>
          )}
          {currentPatient && (
            <p className="text-gray-500 text-sm mb-4">
              Patient ID: {currentPatient.id}
            </p>
          )}
          {error && (
            <p className="text-gray-500 text-sm">
              {error instanceof Error ? error.message : 'Erreur inconnue'}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
        <p className="text-gray-600 mt-2">Informations de votre compte patient</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar - Avatar */}
        <div>
          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                <span className="text-4xl text-white font-bold">
                  {patient.prenom.charAt(0)}{patient.nom.charAt(0)}
                </span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {patient.prenom} {patient.nom}
            </h3>
            <p className="text-sm text-gray-500 mt-1">Patient</p>
            <div className="mt-4">
              <span className="inline-flex rounded-full px-3 py-1 text-sm font-semibold bg-green-100 text-green-800">
                Patient
              </span>
            </div>
          </div>
        </div>

        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations personnelles */}
          <div className="card">
            <div className="flex items-center mb-6 pb-4 border-b border-gray-200 min-h-[3rem]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 mr-3 flex-shrink-0">
                <svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Informations personnelles</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-2">Nom complet</label>
                <p className="text-lg font-medium text-gray-900">
                  {patient.prenom} {patient.nom}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-2">Date de naissance</label>
                <p className="text-lg font-medium text-gray-900">
                  {format(new Date(patient.dateNaissance), 'dd/MM/yyyy')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-2">Sexe</label>
                <p className="text-lg font-medium text-gray-900">
                  {patient.sexe === 'M' ? 'Masculin' : patient.sexe === 'F' ? 'Féminin' : 'Autre'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-2">Téléphone</label>
                <p className="text-lg font-medium text-gray-900">{patient.telephone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-2">Email</label>
                <p className="text-lg font-medium text-gray-900">{patient.email || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-2">Adresse</label>
                <p className="text-lg font-medium text-gray-900">{patient.adresse || '-'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-500 block mb-2">Numéro de sécurité sociale</label>
                <p className="text-lg font-medium text-gray-900">{patient.numeroSS}</p>
              </div>
            </div>
          </div>

          {/* Dossier médical */}
          <div className="card">
            <div className="flex items-center mb-6 pb-4 border-b border-gray-200 min-h-[3rem]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 mr-3 flex-shrink-0">
                <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Dossier médical</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-2">Groupe sanguin</label>
                <p className="text-lg font-medium text-gray-900">{patient.dossierMedical?.groupeSanguin || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-2">Allergies</label>
                <p className="text-lg font-medium text-gray-900 whitespace-pre-wrap">{patient.dossierMedical?.allergies || '-'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-500 block mb-2">Antécédents</label>
                <p className="text-lg font-medium text-gray-900 whitespace-pre-wrap">{patient.dossierMedical?.antecedents || '-'}</p>
              </div>
              {patient.dossierMedical?.antecedentsFamiliaux && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500 block mb-2">Antécédents familiaux</label>
                  <p className="text-lg font-medium text-gray-900 whitespace-pre-wrap">{patient.dossierMedical.antecedentsFamiliaux}</p>
                </div>
              )}
              {patient.dossierMedical?.traitementsEnCours && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500 block mb-2">Traitements en cours</label>
                  <p className="text-lg font-medium text-gray-900 whitespace-pre-wrap">{patient.dossierMedical.traitementsEnCours}</p>
                </div>
              )}
              {patient.dossierMedical?.historiqueChirurgical && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500 block mb-2">Historique chirurgical</label>
                  <p className="text-lg font-medium text-gray-900 whitespace-pre-wrap">{patient.dossierMedical.historiqueChirurgical}</p>
                </div>
              )}
              {patient.dossierMedical?.notesGenerales && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500 block mb-2">Notes générales</label>
                  <p className="text-lg font-medium text-gray-900 whitespace-pre-wrap">{patient.dossierMedical.notesGenerales}</p>
                </div>
              )}
            </div>
          </div>

          {/* Informations de compte */}
          <div className="card">
            <div className="flex items-center mb-6 pb-4 border-b border-gray-200 min-h-[3rem]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 mr-3 flex-shrink-0">
                <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Informations de compte</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-2">Date de création</label>
                <p className="text-lg font-medium text-gray-900">
                  {format(new Date(patient.createdAt), 'dd/MM/yyyy à HH:mm')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-2">Dernière modification</label>
                <p className="text-lg font-medium text-gray-900">
                  {format(new Date(patient.updatedAt), 'dd/MM/yyyy à HH:mm')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfilePage;

