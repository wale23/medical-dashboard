import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { User } from '../types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';

const UserProfilePage = () => {
  const { user: currentUser } = useAuthStore();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', currentUser?.id],
    queryFn: async () => {
      const response = await api.get(`/medecins/${currentUser?.id}`);
      return response.data.data as User;
    },
    enabled: !!currentUser?.id,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erreur lors du chargement du profil</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
        <p className="text-gray-600 mt-2">Informations de votre compte</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

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
                  {user.prenom} {user.nom}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-2">Email</label>
                <p className="text-lg font-medium text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-2">Spécialité</label>
                <p className="text-lg font-medium text-gray-900">{user.specialite}</p>
              </div>
              {user.numeroOrdre && (
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-2">Numéro d'ordre</label>
                  <p className="text-lg font-medium text-gray-900">{user.numeroOrdre}</p>
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
                  {format(new Date(user.createdAt), 'dd/MM/yyyy à HH:mm')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-2">Dernière modification</label>
                <p className="text-lg font-medium text-gray-900">
                  {format(new Date(user.updatedAt), 'dd/MM/yyyy à HH:mm')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;

