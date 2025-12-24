import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';
import { RendezVous, Patient, User, StatutRendezVous } from '../types';
import { format } from 'date-fns';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '../store/authStore';
import { showSuccessAlert, showErrorAlert, getErrorMessage } from '../utils/alert';

const createRendezVousSchema = z.object({
  patientId: z.string().min(1, 'Le patient est requis'),
  userId: z.string().min(1, 'Le médecin est requis'),
  dateHeure: z.string().min(1, 'La date et l\'heure sont requises'),
  duree: z.number().min(15, 'La durée minimum est de 15 minutes').max(240, 'La durée maximum est de 240 minutes').default(30),
  motif: z.string().optional(),
  notes: z.string().optional(),
});

const updateRendezVousSchema = z.object({
  patientId: z.string().min(1, 'Le patient est requis'),
  userId: z.string().min(1, 'Le médecin est requis'),
  dateHeure: z.string().min(1, 'La date et l\'heure sont requises'),
  duree: z.number().min(15, 'La durée minimum est de 15 minutes').max(240, 'La durée maximum est de 240 minutes'),
  statut: z.nativeEnum(StatutRendezVous),
  motif: z.string().optional(),
  notes: z.string().optional(),
  raisonAnnulation: z.string().optional(),
});

type CreateRendezVousFormData = z.infer<typeof createRendezVousSchema>;
type UpdateRendezVousFormData = z.infer<typeof updateRendezVousSchema>;

const RendezVousPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRendezVous, setSelectedRendezVous] = useState<RendezVous | null>(null);
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isEditPatientDropdownOpen, setIsEditPatientDropdownOpen] = useState(false);
  const [isEditUserDropdownOpen, setIsEditUserDropdownOpen] = useState(false);
  const [isEditStatutDropdownOpen, setIsEditStatutDropdownOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [editPatientSearch, setEditPatientSearch] = useState('');
  const [editUserSearch, setEditUserSearch] = useState('');
  const patientDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const editPatientDropdownRef = useRef<HTMLDivElement>(null);
  const editUserDropdownRef = useRef<HTMLDivElement>(null);
  const editStatutDropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['rendez-vous'],
    queryFn: async () => {
      const response = await api.get('/rendez-vous');
      return response.data.data as RendezVous[];
    },
  });

  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const response = await api.get('/patients');
      return response.data.data as Patient[];
    },
  });

  const { data: users } = useQuery({
    queryKey: ['medecins'],
    queryFn: async () => {
      const response = await api.get('/medecins');
      return response.data.data as User[];
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CreateRendezVousFormData>({
    resolver: zodResolver(createRendezVousSchema),
    defaultValues: {
      duree: 30,
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: errorsEdit },
    reset: resetEdit,
    watch: watchEdit,
    setValue: setValueEdit,
  } = useForm<UpdateRendezVousFormData>({
    resolver: zodResolver(updateRendezVousSchema),
  });

  const selectedPatientId = watch('patientId');
  const selectedUserId = watch('userId');
  const selectedEditPatientId = watchEdit('patientId');
  const selectedEditUserId = watchEdit('userId');
  const selectedEditStatut = watchEdit('statut');

  // Fermer les dropdowns en cliquant en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target as Node)) {
        setIsPatientDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
      if (editPatientDropdownRef.current && !editPatientDropdownRef.current.contains(event.target as Node)) {
        setIsEditPatientDropdownOpen(false);
      }
      if (editUserDropdownRef.current && !editUserDropdownRef.current.contains(event.target as Node)) {
        setIsEditUserDropdownOpen(false);
      }
      if (editStatutDropdownRef.current && !editStatutDropdownRef.current.contains(event.target as Node)) {
        setIsEditStatutDropdownOpen(false);
      }
    };

    if (isPatientDropdownOpen || isUserDropdownOpen || isEditPatientDropdownOpen || isEditUserDropdownOpen || isEditStatutDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPatientDropdownOpen, isUserDropdownOpen, isEditPatientDropdownOpen, isEditUserDropdownOpen, isEditStatutDropdownOpen]);

  const createRendezVousMutation = useMutation({
    mutationFn: async (data: CreateRendezVousFormData) => {
      const response = await api.post('/rendez-vous', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rendez-vous'] });
      setIsModalOpen(false);
      reset();
      setPatientSearch('');
      setUserSearch('');
      showSuccessAlert(data?.message || 'Rendez-vous créé avec succès');
    },
    onError: (error: any) => {
      const errorMessage = getErrorMessage(error);
      showErrorAlert(errorMessage);
    },
  });

  const updateRendezVousMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRendezVousFormData }) => {
      const response = await api.put(`/rendez-vous/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rendez-vous'] });
      queryClient.invalidateQueries({ queryKey: ['rendez-vous', selectedRendezVous?.id] });
      setIsEditModalOpen(false);
      setSelectedRendezVous(null);
      resetEdit();
      setEditPatientSearch('');
      setEditUserSearch('');
      showSuccessAlert(data?.message || 'Rendez-vous modifié avec succès');
    },
    onError: (error: any) => {
      const errorMessage = getErrorMessage(error);
      showErrorAlert(errorMessage);
    },
  });

  const deleteRendezVousMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/rendez-vous/${id}`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rendez-vous'] });
      setIsDeleteModalOpen(false);
      setSelectedRendezVous(null);
      showSuccessAlert(data?.message || 'Rendez-vous supprimé avec succès');
    },
    onError: (error: any) => {
      const errorMessage = getErrorMessage(error);
      showErrorAlert(errorMessage);
    },
  });

  const onSubmit = (data: CreateRendezVousFormData) => {
    createRendezVousMutation.mutate(data);
  };

  const onSubmitEdit = (data: UpdateRendezVousFormData) => {
    if (selectedRendezVous) {
      updateRendezVousMutation.mutate({ id: selectedRendezVous.id, data });
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
    reset({
      duree: 30,
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    reset();
    setPatientSearch('');
    setUserSearch('');
  };

  const handleEdit = (rdv: RendezVous) => {
    setSelectedRendezVous(rdv);
    const dateHeure = format(new Date(rdv.dateHeure), "yyyy-MM-dd'T'HH:mm");
    resetEdit({
      patientId: rdv.patientId,
      userId: rdv.userId,
      dateHeure,
      duree: rdv.duree,
      statut: rdv.statut,
      motif: rdv.motif || '',
      notes: rdv.notes || '',
      raisonAnnulation: rdv.raisonAnnulation || '',
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (rdv: RendezVous) => {
    setSelectedRendezVous(rdv);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedRendezVous) {
      deleteRendezVousMutation.mutate(selectedRendezVous.id);
    }
  };

  // Filtrer les patients selon la recherche
  const filteredPatients = patients?.filter((patient) => {
    if (!patientSearch) return true;
    const searchLower = patientSearch.toLowerCase();
    return (
      patient.nom.toLowerCase().includes(searchLower) ||
      patient.prenom.toLowerCase().includes(searchLower) ||
      patient.telephone.includes(patientSearch)
    );
  });

  // Filtrer les médecins selon la recherche
  const filteredUsers = users?.filter((user) => {
    if (!userSearch) return true;
    const searchLower = userSearch.toLowerCase();
    return (
      user.nom.toLowerCase().includes(searchLower) ||
      user.prenom.toLowerCase().includes(searchLower) ||
      user.specialite.toLowerCase().includes(searchLower)
    );
  });

  // Filtrer les patients pour l'édition
  const filteredEditPatients = patients?.filter((patient) => {
    if (!editPatientSearch) return true;
    const searchLower = editPatientSearch.toLowerCase();
    return (
      patient.nom.toLowerCase().includes(searchLower) ||
      patient.prenom.toLowerCase().includes(searchLower) ||
      patient.telephone.includes(editPatientSearch)
    );
  });

  // Filtrer les médecins pour l'édition
  const filteredEditUsers = users?.filter((user) => {
    if (!editUserSearch) return true;
    const searchLower = editUserSearch.toLowerCase();
    return (
      user.nom.toLowerCase().includes(searchLower) ||
      user.prenom.toLowerCase().includes(searchLower) ||
      user.specialite.toLowerCase().includes(searchLower)
    );
  });

  const selectedPatient = patients?.find((p) => p.id === selectedPatientId);
  const selectedUser = users?.find((u) => u.id === selectedUserId);
  const selectedEditPatient = patients?.find((p) => p.id === selectedEditPatientId);
  const selectedEditUser = users?.find((u) => u.id === selectedEditUserId);

  if (isLoading) {
    return <LoadingSpinner />
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
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Rendez-vous</h1>
        <button onClick={openModal} className="btn btn-primary">
          Nouveau rendez-vous
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date/Heure
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Médecin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Motif
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {data?.map((rdv) => (
                <tr
                  key={rdv.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/rendez-vous/${rdv.id}`)}
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    {format(new Date(rdv.dateHeure), "dd/MM/yyyy 'à' HH:mm")}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {rdv.patient?.prenom} {rdv.patient?.nom}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {rdv.user?.prenom} {rdv.user?.nom}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {rdv.motif || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(
                        rdv.statut
                      )}`}
                    >
                      {rdv.statut}
                    </span>
                  </td>
                  <td
                    className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(rdv)}
                        className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded hover:bg-blue-50"
                        title="Modifier"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(rdv)}
                        className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50"
                        title="Supprimer"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'ajout de rendez-vous */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Nouveau rendez-vous</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patient */}
                <div className="relative" ref={patientDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="hidden"
                      {...register('patientId')}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsPatientDropdownOpen(!isPatientDropdownOpen);
                        setIsUserDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-left flex items-center justify-between ${
                        errors.patientId ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <span className={selectedPatient ? 'text-gray-900' : 'text-gray-500'}>
                        {selectedPatient
                          ? `${selectedPatient.prenom} ${selectedPatient.nom}`
                          : 'Sélectionner un patient'}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isPatientDropdownOpen ? 'transform rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isPatientDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-2 border-b border-gray-200">
                          <input
                            type="text"
                            placeholder="Rechercher un patient..."
                            value={patientSearch}
                            onChange={(e) => setPatientSearch(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="py-1">
                          {filteredPatients && filteredPatients.length > 0 ? (
                            filteredPatients.map((patient) => (
                              <button
                                key={patient.id}
                                type="button"
                                onClick={() => {
                                  setValue('patientId', patient.id);
                                  setIsPatientDropdownOpen(false);
                                  setPatientSearch('');
                                }}
                                className={`w-full px-4 py-2 text-left hover:bg-primary-50 transition-colors ${
                                  selectedPatientId === patient.id
                                    ? 'bg-primary-50 text-primary-600'
                                    : 'text-gray-900'
                                }`}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {patient.prenom} {patient.nom}
                                  </span>
                                  <span className="text-xs text-gray-500">{patient.telephone}</span>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-sm text-gray-500">Aucun patient trouvé</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.patientId && (
                    <p className="mt-1 text-sm text-red-500">{errors.patientId.message}</p>
                  )}
                </div>

                {/* Médecin */}
                <div className="relative" ref={userDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Médecin <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="hidden"
                      {...register('userId')}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserDropdownOpen(!isUserDropdownOpen);
                        setIsPatientDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-left flex items-center justify-between ${
                        errors.userId ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <span className={selectedUser ? 'text-gray-900' : 'text-gray-500'}>
                        {selectedUser
                          ? `Dr. ${selectedUser.prenom} ${selectedUser.nom} - ${selectedUser.specialite}`
                          : 'Sélectionner un médecin'}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isUserDropdownOpen ? 'transform rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isUserDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-2 border-b border-gray-200">
                          <input
                            type="text"
                            placeholder="Rechercher un médecin..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="py-1">
                          {filteredUsers && filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                              <button
                                key={user.id}
                                type="button"
                                onClick={() => {
                                  setValue('userId', user.id);
                                  setIsUserDropdownOpen(false);
                                  setUserSearch('');
                                }}
                                className={`w-full px-4 py-2 text-left hover:bg-primary-50 transition-colors ${
                                  selectedUserId === user.id
                                    ? 'bg-primary-50 text-primary-600'
                                    : 'text-gray-900'
                                }`}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    Dr. {user.prenom} {user.nom}
                                  </span>
                                  <span className="text-xs text-gray-500">{user.specialite}</span>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-sm text-gray-500">Aucun médecin trouvé</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.userId && (
                    <p className="mt-1 text-sm text-red-500">{errors.userId.message}</p>
                  )}
                </div>

                {/* Date et Heure */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date et Heure <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('dateHeure')}
                    type="datetime-local"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.dateHeure ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.dateHeure && (
                    <p className="mt-1 text-sm text-red-500">{errors.dateHeure.message}</p>
                  )}
                </div>

                {/* Durée */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée (minutes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('duree', { valueAsNumber: true })}
                    type="number"
                    min="15"
                    max="240"
                    step="15"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.duree ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="30"
                  />
                  {errors.duree && (
                    <p className="mt-1 text-sm text-red-500">{errors.duree.message}</p>
                  )}
                </div>
              </div>

              {/* Motif */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Motif</label>
                <input
                  {...register('motif')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Raison de la consultation"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Notes supplémentaires (optionnel)"
                />
              </div>

              {/* Boutons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createRendezVousMutation.isPending}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createRendezVousMutation.isPending ? 'Création...' : 'Créer le rendez-vous'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {isEditModalOpen && selectedRendezVous && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsEditModalOpen(false);
              setSelectedRendezVous(null);
              resetEdit();
              setEditPatientSearch('');
              setEditUserSearch('');
            }
          }}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Modifier le rendez-vous</h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedRendezVous(null);
                  resetEdit();
                  setEditPatientSearch('');
                  setEditUserSearch('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patient */}
                <div className="relative" ref={editPatientDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="hidden"
                      {...registerEdit('patientId')}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditPatientDropdownOpen(!isEditPatientDropdownOpen);
                        setIsEditUserDropdownOpen(false);
                        setIsEditStatutDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-left flex items-center justify-between ${
                        errorsEdit.patientId ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <span className={selectedEditPatient ? 'text-gray-900' : 'text-gray-500'}>
                        {selectedEditPatient
                          ? `${selectedEditPatient.prenom} ${selectedEditPatient.nom}`
                          : 'Sélectionner un patient'}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isEditPatientDropdownOpen ? 'transform rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isEditPatientDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-2 border-b border-gray-200">
                          <input
                            type="text"
                            placeholder="Rechercher un patient..."
                            value={editPatientSearch}
                            onChange={(e) => setEditPatientSearch(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="py-1">
                          {filteredEditPatients && filteredEditPatients.length > 0 ? (
                            filteredEditPatients.map((patient) => (
                              <button
                                key={patient.id}
                                type="button"
                                onClick={() => {
                                  setValueEdit('patientId', patient.id);
                                  setIsEditPatientDropdownOpen(false);
                                  setEditPatientSearch('');
                                }}
                                className={`w-full px-4 py-2 text-left hover:bg-primary-50 transition-colors ${
                                  selectedEditPatientId === patient.id
                                    ? 'bg-primary-50 text-primary-600'
                                    : 'text-gray-900'
                                }`}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {patient.prenom} {patient.nom}
                                  </span>
                                  <span className="text-xs text-gray-500">{patient.telephone}</span>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-sm text-gray-500">Aucun patient trouvé</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {errorsEdit.patientId && (
                    <p className="mt-1 text-sm text-red-500">{errorsEdit.patientId.message}</p>
                  )}
                </div>

                {/* Médecin */}
                <div className="relative" ref={editUserDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Médecin <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="hidden"
                      {...registerEdit('userId')}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditUserDropdownOpen(!isEditUserDropdownOpen);
                        setIsEditPatientDropdownOpen(false);
                        setIsEditStatutDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-left flex items-center justify-between ${
                        errorsEdit.userId ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <span className={selectedEditUser ? 'text-gray-900' : 'text-gray-500'}>
                        {selectedEditUser
                          ? `Dr. ${selectedEditUser.prenom} ${selectedEditUser.nom} - ${selectedEditUser.specialite}`
                          : 'Sélectionner un médecin'}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isEditUserDropdownOpen ? 'transform rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isEditUserDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-2 border-b border-gray-200">
                          <input
                            type="text"
                            placeholder="Rechercher un médecin..."
                            value={editUserSearch}
                            onChange={(e) => setEditUserSearch(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="py-1">
                          {filteredEditUsers && filteredEditUsers.length > 0 ? (
                            filteredEditUsers.map((user) => (
                              <button
                                key={user.id}
                                type="button"
                                onClick={() => {
                                  setValueEdit('userId', user.id);
                                  setIsEditUserDropdownOpen(false);
                                  setEditUserSearch('');
                                }}
                                className={`w-full px-4 py-2 text-left hover:bg-primary-50 transition-colors ${
                                  selectedEditUserId === user.id
                                    ? 'bg-primary-50 text-primary-600'
                                    : 'text-gray-900'
                                }`}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    Dr. {user.prenom} {user.nom}
                                  </span>
                                  <span className="text-xs text-gray-500">{user.specialite}</span>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-sm text-gray-500">Aucun médecin trouvé</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {errorsEdit.userId && (
                    <p className="mt-1 text-sm text-red-500">{errorsEdit.userId.message}</p>
                  )}
                </div>

                {/* Date et Heure */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date et Heure <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...registerEdit('dateHeure')}
                    type="datetime-local"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errorsEdit.dateHeure ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errorsEdit.dateHeure && (
                    <p className="mt-1 text-sm text-red-500">{errorsEdit.dateHeure.message}</p>
                  )}
                </div>

                {/* Durée */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée (minutes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...registerEdit('duree', { valueAsNumber: true })}
                    type="number"
                    min="15"
                    max="240"
                    step="15"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errorsEdit.duree ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errorsEdit.duree && (
                    <p className="mt-1 text-sm text-red-500">{errorsEdit.duree.message}</p>
                  )}
                </div>

                {/* Statut */}
                <div className="relative" ref={editStatutDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="hidden"
                      {...registerEdit('statut')}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditStatutDropdownOpen(!isEditStatutDropdownOpen);
                        setIsEditPatientDropdownOpen(false);
                        setIsEditUserDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-left flex items-center justify-between ${
                        errorsEdit.statut ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <span className={selectedEditStatut ? 'text-gray-900' : 'text-gray-500'}>
                        {selectedEditStatut || 'Sélectionner un statut'}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isEditStatutDropdownOpen ? 'transform rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isEditStatutDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                        {Object.values(StatutRendezVous).map((statut) => (
                          <button
                            key={statut}
                            type="button"
                            onClick={() => {
                              setValueEdit('statut', statut);
                              setIsEditStatutDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-left hover:bg-primary-50 transition-colors ${
                              selectedEditStatut === statut
                                ? 'bg-primary-50 text-primary-600'
                                : 'text-gray-900'
                            }`}
                          >
                            {statut}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {errorsEdit.statut && (
                    <p className="mt-1 text-sm text-red-500">{errorsEdit.statut.message}</p>
                  )}
                </div>
              </div>

              {/* Motif */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Motif</label>
                <input
                  {...registerEdit('motif')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Raison de la consultation"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  {...registerEdit('notes')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Notes supplémentaires (optionnel)"
                />
              </div>

              {/* Raison d'annulation (si statut = annule) */}
              {selectedEditStatut === StatutRendezVous.annule && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Raison d'annulation</label>
                  <textarea
                    {...registerEdit('raisonAnnulation')}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Raison de l'annulation"
                  />
                </div>
              )}

              {/* Boutons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedRendezVous(null);
                    resetEdit();
                    setEditPatientSearch('');
                    setEditUserSearch('');
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={updateRendezVousMutation.isPending}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateRendezVousMutation.isPending ? 'Modification...' : 'Modifier le rendez-vous'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {isDeleteModalOpen && selectedRendezVous && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsDeleteModalOpen(false);
              setSelectedRendezVous(null);
            }
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Supprimer le rendez-vous
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Êtes-vous sûr de vouloir supprimer ce rendez-vous du{' '}
              <strong>{format(new Date(selectedRendezVous.dateHeure), "dd/MM/yyyy 'à' HH:mm")}</strong> ?
              Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedRendezVous(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteRendezVousMutation.isPending}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteRendezVousMutation.isPending ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RendezVousPage;


