import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';
import { User } from '../types';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { showSuccessAlert, showErrorAlert, getErrorMessage } from '../utils/alert';

const createUserSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  specialite: z.string().min(1, 'La spécialité est requise'),
  numeroOrdre: z.string().min(1, 'Le numéro d\'ordre est requis'),
  telephone: z.string().min(1, 'Le téléphone est requis'),
  email: z.string().email('Email invalide'),
  motDePasse: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  userRole: z.enum(['medecin', 'admin']).default('medecin'),
});

const updateUserSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  specialite: z.string().min(1, 'La spécialité est requise'),
  numeroOrdre: z.string().min(1, 'Le numéro d\'ordre est requis'),
  telephone: z.string().min(1, 'Le téléphone est requis'),
  email: z.string().email('Email invalide'),
  motDePasse: z
    .string()
    .refine((val) => val === '' || val.length >= 6, {
      message: 'Le mot de passe doit contenir au moins 6 caractères ou être vide',
    })
    .optional(),
  userRole: z.enum(['medecin', 'admin']).default('medecin'),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;
type UpdateUserFormData = z.infer<typeof updateUserSchema>;

const MedecinsPage = () => {
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<'all' | 'medecin' | 'admin'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isEditRoleDropdownOpen, setIsEditRoleDropdownOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const queryClient = useQueryClient();
  const isAdmin = user?.userRole === 'admin';

  const { data, isLoading } = useQuery({
    queryKey: ['medecins'],
    queryFn: async () => {
      const response = await api.get('/medecins');
      return response.data.data as User[];
    },
  });

  // Filtrer les utilisateurs par rôle
  const filteredData = data?.filter((user) => {
    if (roleFilter === 'all') return true;
    return user.userRole === roleFilter;
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      userRole: 'medecin',
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: errorsEdit },
    reset: resetEdit,
    watch: watchEdit,
    setValue: setValueEdit,
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserFormData) => {
      const response = await api.post('/medecins', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['medecins'] });
      setIsModalOpen(false);
      setShowPassword(false);
      reset();
      showSuccessAlert(data?.message || 'Utilisateur créé avec succès');
    },
    onError: (error: any) => {
      const errorMessage = getErrorMessage(error);
      showErrorAlert(errorMessage);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserFormData }) => {
      // Ne pas envoyer le mot de passe s'il est vide
      const updateData = { ...data };
      if (!updateData.motDePasse || updateData.motDePasse === '') {
        delete updateData.motDePasse;
      }
      const response = await api.put(`/medecins/${id}`, updateData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['medecins'] });
      setIsEditModalOpen(false);
      setShowEditPassword(false);
      setSelectedUser(null);
      resetEdit();
      showSuccessAlert(data?.message || 'Utilisateur modifié avec succès');
    },
    onError: (error: any) => {
      const errorMessage = getErrorMessage(error);
      showErrorAlert(errorMessage);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/medecins/${id}`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['medecins'] });
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      showSuccessAlert(data?.message || 'Utilisateur supprimé avec succès');
    },
    onError: (error: any) => {
      const errorMessage = getErrorMessage(error);
      showErrorAlert(errorMessage);
    },
  });

  const onSubmit = (data: CreateUserFormData) => {
    createUserMutation.mutate(data);
  };

  const onSubmitEdit = (data: UpdateUserFormData) => {
    if (selectedUser) {
      updateUserMutation.mutate({ id: selectedUser.id, data });
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowEditPassword(false);
    resetEdit({
      nom: user.nom,
      prenom: user.prenom,
      specialite: user.specialite,
      numeroOrdre: user.numeroOrdre,
      telephone: user.telephone,
      email: user.email,
      motDePasse: '',
      userRole: user.userRole as 'medecin' | 'admin',
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Utilisateurs</h1>
          {isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary"
            >
              + Nouveau utilisateur
            </button>
          )}
        </div>
        <div className="flex justify-end">
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200"
            >
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span className="text-sm font-semibold text-gray-800 min-w-[105px] text-left">
                {roleFilter === 'all' ? 'Tous' : roleFilter === 'medecin' ? 'Médecins' : 'Admins'}
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`}
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

            {isFilterOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsFilterOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-50 bg-white rounded-lg border border-gray-200 shadow-lg z-20 overflow-hidden">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setRoleFilter('all');
                        setIsFilterOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                        roleFilter === 'all'
                          ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Tous
                    </button>
                    <button
                      onClick={() => {
                        setRoleFilter('medecin');
                        setIsFilterOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                        roleFilter === 'medecin'
                          ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Médecins
                    </button>
                    <button
                      onClick={() => {
                        setRoleFilter('admin');
                        setIsFilterOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                        roleFilter === 'admin'
                          ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Admins
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Prénom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Spécialité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Numéro d'ordre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Téléphone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Rôle
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredData?.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-6 py-8 text-center text-gray-500">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                filteredData?.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {user.nom}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {user.prenom}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {user.specialite}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {user.numeroOrdre}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {user.telephone}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        user.userRole === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {user.userRole === 'admin' ? '👑 Admin' : '👨‍⚕️ Médecin'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-primary-600 hover:text-primary-900 transition-colors"
                          title="Modifier"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Supprimer"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de création */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Créer un nouvel utilisateur</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('nom')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.nom && (
                  <p className="text-red-600 text-sm mt-1">{errors.nom.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('prenom')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.prenom && (
                  <p className="text-red-600 text-sm mt-1">{errors.prenom.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spécialité <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('specialite')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.specialite && (
                  <p className="text-red-600 text-sm mt-1">{errors.specialite.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro d'ordre <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('numeroOrdre')}
                  placeholder="Ex: MG001, CAR002, PED003"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Numéro d'inscription à l'Ordre des Médecins (unique par médecin)
                </p>
                {errors.numeroOrdre && (
                  <p className="text-red-600 text-sm mt-1">{errors.numeroOrdre.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('telephone')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.telephone && (
                  <p className="text-red-600 text-sm mt-1">{errors.telephone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  {...register('email')}
                  autoComplete="off"
                  placeholder="exemple@cabinet.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('motDePasse')}
                    autoComplete="new-password"
                    placeholder="Minimum 6 caractères"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.motDePasse && (
                  <p className="text-red-600 text-sm mt-1">{errors.motDePasse.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rôle <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="hidden"
                    {...register('userRole')}
                  />
                  <button
                    type="button"
                    onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-white rounded-lg border border-gray-300 shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 text-left"
                  >
                    <span className="text-sm font-semibold text-gray-800">
                      {watch('userRole') === 'admin' ? 'Admin' : 'Médecin'}
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180' : ''}`}
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

                  {isRoleDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsRoleDropdownOpen(false)}
                      />
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg border border-gray-200 shadow-lg z-20 overflow-hidden">
                        <div className="py-1">
                          <button
                            type="button"
                            onClick={() => {
                              setValue('userRole', 'medecin');
                              setIsRoleDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                              watch('userRole') === 'medecin'
                                ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            Médecin
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setValue('userRole', 'admin');
                              setIsRoleDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                              watch('userRole') === 'admin'
                                ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            Admin
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {createUserMutation.isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {createUserMutation.error instanceof Error
                    ? createUserMutation.error.message
                    : 'Erreur lors de la création'}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setShowPassword(false);
                    reset();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {createUserMutation.isPending ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Modifier l'utilisateur</h2>
            <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  {...registerEdit('nom')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errorsEdit.nom && (
                  <p className="text-red-600 text-sm mt-1">{errorsEdit.nom.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  {...registerEdit('prenom')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errorsEdit.prenom && (
                  <p className="text-red-600 text-sm mt-1">{errorsEdit.prenom.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spécialité <span className="text-red-500">*</span>
                </label>
                <input
                  {...registerEdit('specialite')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errorsEdit.specialite && (
                  <p className="text-red-600 text-sm mt-1">{errorsEdit.specialite.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro d'ordre <span className="text-red-500">*</span>
                </label>
                <input
                  {...registerEdit('numeroOrdre')}
                  placeholder="Ex: MG001, CAR002, PED003"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Numéro d'inscription à l'Ordre des Médecins (unique par médecin)
                </p>
                {errorsEdit.numeroOrdre && (
                  <p className="text-red-600 text-sm mt-1">{errorsEdit.numeroOrdre.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <input
                  {...registerEdit('telephone')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errorsEdit.telephone && (
                  <p className="text-red-600 text-sm mt-1">{errorsEdit.telephone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  {...registerEdit('email')}
                  autoComplete="off"
                  placeholder="exemple@cabinet.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errorsEdit.email && (
                  <p className="text-red-600 text-sm mt-1">{errorsEdit.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe (laisser vide pour ne pas modifier)
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    {...registerEdit('motDePasse')}
                    autoComplete="new-password"
                    placeholder="Minimum 6 caractères"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showEditPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errorsEdit.motDePasse && (
                  <p className="text-red-600 text-sm mt-1">{errorsEdit.motDePasse.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rôle <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="hidden"
                    {...registerEdit('userRole')}
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditRoleDropdownOpen(!isEditRoleDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-white rounded-lg border border-gray-300 shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 text-left"
                  >
                    <span className="text-sm font-semibold text-gray-800">
                      {watchEdit('userRole') === 'admin' ? 'Admin' : 'Médecin'}
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isEditRoleDropdownOpen ? 'rotate-180' : ''}`}
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

                  {isEditRoleDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsEditRoleDropdownOpen(false)}
                      />
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg border border-gray-200 shadow-lg z-20 overflow-hidden">
                        <div className="py-1">
                          <button
                            type="button"
                            onClick={() => {
                              setValueEdit('userRole', 'medecin');
                              setIsEditRoleDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                              watchEdit('userRole') === 'medecin'
                                ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            Médecin
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setValueEdit('userRole', 'admin');
                              setIsEditRoleDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                              watchEdit('userRole') === 'admin'
                                ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            Admin
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {updateUserMutation.isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {updateUserMutation.error instanceof Error
                    ? updateUserMutation.error.message
                    : 'Erreur lors de la mise à jour'}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setShowEditPassword(false);
                    setSelectedUser(null);
                    resetEdit();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {updateUserMutation.isPending ? 'Mise à jour...' : 'Enregistrer'}
                </button>
              </div>
            </form>
              </div>
            </div>
      )}

      {/* Modal de confirmation de suppression */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 text-start mb-2">
              Confirmer la suppression
            </h3>
            <p className="text-sm text-gray-500 text-start mb-6">
              Êtes-vous sûr de vouloir supprimer l'utilisateur{' '}
              <span className="font-semibold text-gray-900">
                {selectedUser.prenom} {selectedUser.nom} 
              </span>
               ? Cette action est irréversible.
            </p>
            {deleteUserMutation.isError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {deleteUserMutation.error instanceof Error
                  ? deleteUserMutation.error.message
                  : 'Erreur lors de la suppression'}
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteUserMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteUserMutation.isPending ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
      </div>
      )}
    </div>
  );
};

export default MedecinsPage;


