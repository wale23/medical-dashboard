import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';
import { Patient, Sexe, RendezVous } from '../types';
import { format } from 'date-fns';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { showSuccessAlert, showErrorAlert, getErrorMessage } from '../utils/alert';
import { useAuthStore } from '../store/authStore';

const createPatientSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  dateNaissance: z.string().min(1, 'La date de naissance est requise'),
  sexe: z.nativeEnum(Sexe),
  telephone: z.string().min(1, 'Le téléphone est requis'),
  email: z.string().email('Email invalide').min(1, 'L\'email est requis'),
  adresse: z.string().optional(),
  numeroSS: z.string().min(1, 'Le numéro de sécurité sociale est requis'),
  motDePasse: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères').optional(),
  groupeSanguin: z.string().optional(),
  allergies: z.string().optional(),
  antecedents: z.string().optional(),
});

const updatePatientSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  dateNaissance: z.string().min(1, 'La date de naissance est requise'),
  sexe: z.nativeEnum(Sexe),
  telephone: z.string().min(1, 'Le téléphone est requis'),
  email: z.union([z.string().email('Email invalide'), z.literal('')]).optional(),
  adresse: z.string().optional(),
  numeroSS: z.string().min(1, 'Le numéro de sécurité sociale est requis'),
  motDePasse: z
    .string()
    .refine((val) => val === '' || val.length >= 6, {
      message: 'Le mot de passe doit contenir au moins 6 caractères ou être vide',
    })
    .optional(),
  groupeSanguin: z.string().optional(),
  allergies: z.string().optional(),
  antecedents: z.string().optional(),
});

type CreatePatientFormData = z.infer<typeof createPatientSchema>;
type UpdatePatientFormData = z.infer<typeof updatePatientSchema>;

const PatientsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isSexeDropdownOpen, setIsSexeDropdownOpen] = useState(false);
  const [isEditSexeDropdownOpen, setIsEditSexeDropdownOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const sexeDropdownRef = useRef<HTMLDivElement>(null);
  const editSexeDropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fermer les dropdowns du sexe en cliquant en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sexeDropdownRef.current && !sexeDropdownRef.current.contains(event.target as Node)) {
        setIsSexeDropdownOpen(false);
      }
      if (editSexeDropdownRef.current && !editSexeDropdownRef.current.contains(event.target as Node)) {
        setIsEditSexeDropdownOpen(false);
      }
    };

    if (isSexeDropdownOpen || isEditSexeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSexeDropdownOpen, isEditSexeDropdownOpen]);

  // Si c'est un médecin, récupérer uniquement les patients qui ont des rendez-vous avec lui
  const { data: allPatients, isLoading: isLoadingPatients } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const response = await api.get('/patients');
      return response.data.data as Patient[];
    },
    enabled: user?.userRole === 'admin', // Seulement si admin
  });

  // Récupérer les rendez-vous du médecin pour extraire ses patients
  const { data: medecinRendezVous, isLoading: isLoadingRendezVous } = useQuery({
    queryKey: ['rendez-vous', 'medecin', user?.id],
    queryFn: async () => {
      const response = await api.get('/rendez-vous');
      const allRendezVous = response.data.data as (RendezVous & { patient: Patient })[];
      // Filtrer les rendez-vous du médecin connecté
      return allRendezVous.filter((rdv) => rdv.userId === user?.id);
    },
    enabled: user?.userRole === 'medecin' && !!user?.id, // Seulement si médecin
  });

  // Extraire les patients uniques des rendez-vous du médecin
  const medecinPatients = medecinRendezVous
    ? Array.from(
        new Map(
          medecinRendezVous
            .map((rdv) => rdv.patient)
            .filter((patient) => patient != null)
            .map((patient) => [patient!.id, patient!])
        ).values()
      )
    : [];

  // Déterminer les données à afficher selon le rôle
  const data = user?.userRole === 'admin' ? allPatients : medecinPatients;
  const isLoading = user?.userRole === 'admin' ? isLoadingPatients : isLoadingRendezVous;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CreatePatientFormData>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: {
      sexe: Sexe.M,
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: errorsEdit },
    reset: resetEdit,
    watch: watchEdit,
    setValue: setValueEdit,
  } = useForm<UpdatePatientFormData>({
    resolver: zodResolver(updatePatientSchema),
  });

  const selectedSexe = watch('sexe');
  const selectedEditSexe = watchEdit('sexe');

  const createPatientMutation = useMutation({
    mutationFn: async (data: CreatePatientFormData) => {
      const response = await api.post('/patients', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setIsModalOpen(false);
      setShowPassword(false);
      reset();
      showSuccessAlert(data?.message || 'Patient créé avec succès');
    },
    onError: (error: any) => {
      const errorMessage = getErrorMessage(error);
      showErrorAlert(errorMessage);
    },
  });

  const updatePatientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePatientFormData }) => {
      const response = await api.put(`/patients/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient', selectedPatient?.id] });
      setIsEditModalOpen(false);
      setShowEditPassword(false);
      setSelectedPatient(null);
      resetEdit();
      showSuccessAlert(data?.message || 'Patient modifié avec succès');
    },
    onError: (error: any) => {
      const errorMessage = getErrorMessage(error);
      showErrorAlert(errorMessage);
    },
  });

  const deletePatientMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/patients/${id}`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setIsDeleteModalOpen(false);
      setSelectedPatient(null);
      showSuccessAlert(data?.message || 'Patient supprimé avec succès');
    },
    onError: (error: any) => {
      const errorMessage = getErrorMessage(error);
      showErrorAlert(errorMessage);
    },
  });

  const onSubmit = (data: CreatePatientFormData) => {
    createPatientMutation.mutate(data);
  };

  const onSubmitEdit = (data: UpdatePatientFormData) => {
    if (selectedPatient) {
      updatePatientMutation.mutate({ id: selectedPatient.id, data });
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
    reset({
      sexe: Sexe.M,
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setShowPassword(false);
    reset();
  };

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowEditPassword(false);
    resetEdit({
      nom: patient.nom,
      prenom: patient.prenom,
      dateNaissance: format(new Date(patient.dateNaissance), 'yyyy-MM-dd'),
      sexe: patient.sexe,
      telephone: patient.telephone,
      email: patient.email || '',
      adresse: patient.adresse || '',
      numeroSS: patient.numeroSS,
      motDePasse: '', // Ne pas pré-remplir le mot de passe
      groupeSanguin: patient.groupeSanguin || '',
      allergies: patient.allergies || '',
      antecedents: patient.antecedents || '',
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedPatient) {
      deletePatientMutation.mutate(selectedPatient.id);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
        {user?.userRole === 'admin' && (
          <button onClick={openModal} className="btn btn-primary">
            Nouveau patient
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Nom complet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Téléphone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date de naissance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {data?.map((patient) => (
                <tr
                  key={patient.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/patients/${patient.id}`)}
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    {patient.prenom} {patient.nom}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {patient.telephone}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {patient.email || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {format(new Date(patient.dateNaissance), 'dd/MM/yyyy')}
                  </td>
                  <td
                    className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {user?.userRole === 'admin' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(patient)}
                          className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded hover:bg-blue-50"
                          title="Modifier"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(patient)}
                          className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50"
                          title="Supprimer"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'ajout de patient - Seulement pour les admins */}
      {isModalOpen && user?.userRole === 'admin' && (
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
              <h2 className="text-xl font-semibold text-gray-900">Nouveau patient</h2>
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
                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('nom')}
                    type="text"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.nom ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nom"
                  />
                  {errors.nom && (
                    <p className="mt-1 text-sm text-red-500">{errors.nom.message}</p>
                  )}
                </div>

                {/* Prénom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('prenom')}
                    type="text"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.prenom ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Prénom"
                  />
                  {errors.prenom && (
                    <p className="mt-1 text-sm text-red-500">{errors.prenom.message}</p>
                  )}
                </div>

                {/* Date de naissance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de naissance <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('dateNaissance')}
                    type="date"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.dateNaissance ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.dateNaissance && (
                    <p className="mt-1 text-sm text-red-500">{errors.dateNaissance.message}</p>
                  )}
                </div>

                {/* Sexe */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sexe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative" ref={sexeDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsSexeDropdownOpen(!isSexeDropdownOpen)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-left flex items-center justify-between ${
                        errors.sexe ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <span className={selectedSexe ? 'text-gray-900' : 'text-gray-500'}>
                        {selectedSexe === Sexe.M ? 'Masculin' : selectedSexe === Sexe.F ? 'Féminin' : 'Autre'}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isSexeDropdownOpen ? 'transform rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isSexeDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                        {Object.values(Sexe).map((sexe) => (
                          <button
                            key={sexe}
                            type="button"
                            onClick={() => {
                              setValue('sexe', sexe);
                              setIsSexeDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-left hover:bg-primary-50 transition-colors ${
                              selectedSexe === sexe ? 'bg-primary-50 text-primary-600' : 'text-gray-900'
                            } ${sexe === Sexe.M ? 'rounded-t-lg' : sexe === Sexe.Autre ? 'rounded-b-lg' : ''}`}
                          >
                            {sexe === Sexe.M ? 'Masculin' : sexe === Sexe.F ? 'Féminin' : 'Autre'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.sexe && (
                    <p className="mt-1 text-sm text-red-500">{errors.sexe.message}</p>
                  )}
                </div>

                {/* Téléphone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('telephone')}
                    type="tel"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.telephone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Téléphone"
                  />
                  {errors.telephone && (
                    <p className="mt-1 text-sm text-red-500">{errors.telephone.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="off"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>

                {/* Numéro de sécurité sociale */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de sécurité sociale <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('numeroSS')}
                    type="text"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.numeroSS ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Numéro SS"
                  />
                  {errors.numeroSS && (
                    <p className="mt-1 text-sm text-red-500">{errors.numeroSS.message}</p>
                  )}
                </div>

                {/* Mot de passe */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      {...register('motDePasse')}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.motDePasse ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Minimum 6 caractères"
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
                    <p className="mt-1 text-sm text-red-500">{errors.motDePasse.message}</p>
                  )}
                </div>

                {/* Groupe sanguin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Groupe sanguin</label>
                  <input
                    {...register('groupeSanguin')}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ex: A+, O-, etc."
                  />
                </div>
              </div>

              {/* Adresse */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                <input
                  {...register('adresse')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Adresse complète"
                />
              </div>

              {/* Allergies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                <textarea
                  {...register('allergies')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Liste des allergies connues"
                />
              </div>

              {/* Antécédents */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Antécédents médicaux</label>
                <textarea
                  {...register('antecedents')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Antécédents médicaux"
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
                  disabled={createPatientMutation.isPending}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createPatientMutation.isPending ? 'Création...' : 'Créer le patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {isEditModalOpen && selectedPatient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsEditModalOpen(false);
              setShowEditPassword(false);
              setSelectedPatient(null);
              resetEdit();
            }
          }}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Modifier le patient</h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setShowEditPassword(false);
                  setSelectedPatient(null);
                  resetEdit();
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
                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...registerEdit('nom')}
                    type="text"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errorsEdit.nom ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nom"
                  />
                  {errorsEdit.nom && (
                    <p className="mt-1 text-sm text-red-500">{errorsEdit.nom.message}</p>
                  )}
                </div>

                {/* Prénom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...registerEdit('prenom')}
                    type="text"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errorsEdit.prenom ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Prénom"
                  />
                  {errorsEdit.prenom && (
                    <p className="mt-1 text-sm text-red-500">{errorsEdit.prenom.message}</p>
                  )}
                </div>

                {/* Date de naissance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de naissance <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...registerEdit('dateNaissance')}
                    type="date"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errorsEdit.dateNaissance ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errorsEdit.dateNaissance && (
                    <p className="mt-1 text-sm text-red-500">{errorsEdit.dateNaissance.message}</p>
                  )}
                </div>

                {/* Sexe */}
                <div className="relative" ref={editSexeDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sexe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsEditSexeDropdownOpen(!isEditSexeDropdownOpen)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-left flex items-center justify-between ${
                        errorsEdit.sexe ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <span className={selectedEditSexe ? 'text-gray-900' : 'text-gray-500'}>
                        {selectedEditSexe === Sexe.M ? 'Masculin' : selectedEditSexe === Sexe.F ? 'Féminin' : 'Autre'}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isEditSexeDropdownOpen ? 'transform rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isEditSexeDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                        {Object.values(Sexe).map((sexe) => (
                          <button
                            key={sexe}
                            type="button"
                            onClick={() => {
                              setValueEdit('sexe', sexe);
                              setIsEditSexeDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-left hover:bg-primary-50 transition-colors ${
                              selectedEditSexe === sexe ? 'bg-primary-50 text-primary-600' : 'text-gray-900'
                            } ${sexe === Sexe.M ? 'rounded-t-lg' : sexe === Sexe.Autre ? 'rounded-b-lg' : ''}`}
                          >
                            {sexe === Sexe.M ? 'Masculin' : sexe === Sexe.F ? 'Féminin' : 'Autre'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {errorsEdit.sexe && (
                    <p className="mt-1 text-sm text-red-500">{errorsEdit.sexe.message}</p>
                  )}
                </div>

                {/* Téléphone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...registerEdit('telephone')}
                    type="tel"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errorsEdit.telephone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Téléphone"
                  />
                  {errorsEdit.telephone && (
                    <p className="mt-1 text-sm text-red-500">{errorsEdit.telephone.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    {...registerEdit('email')}
                    type="email"
                    autoComplete="off"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errorsEdit.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Email"
                  />
                  {errorsEdit.email && (
                    <p className="mt-1 text-sm text-red-500">{errorsEdit.email.message}</p>
                  )}
                </div>

                {/* Numéro de sécurité sociale */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de sécurité sociale <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...registerEdit('numeroSS')}
                    type="text"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errorsEdit.numeroSS ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Numéro SS"
                  />
                  {errorsEdit.numeroSS && (
                    <p className="mt-1 text-sm text-red-500">{errorsEdit.numeroSS.message}</p>
                  )}
                </div>

                {/* Mot de passe */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      {...registerEdit('motDePasse')}
                      type={showEditPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errorsEdit.motDePasse ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Minimum 6 caractères"
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
                    <p className="mt-1 text-sm text-red-500">{errorsEdit.motDePasse.message}</p>
                  )}
                </div>

                {/* Groupe sanguin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Groupe sanguin</label>
                  <input
                    {...registerEdit('groupeSanguin')}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ex: A+, O-, etc."
                  />
                </div>
              </div>

              {/* Adresse */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                <input
                  {...registerEdit('adresse')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Adresse complète"
                />
              </div>

              {/* Allergies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                <textarea
                  {...registerEdit('allergies')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Liste des allergies connues"
                />
              </div>

              {/* Antécédents */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Antécédents médicaux</label>
                <textarea
                  {...registerEdit('antecedents')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Antécédents médicaux"
                />
              </div>

              {/* Boutons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setShowEditPassword(false);
                    setSelectedPatient(null);
                    resetEdit();
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={updatePatientMutation.isPending}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatePatientMutation.isPending ? 'Modification...' : 'Modifier le patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {isDeleteModalOpen && selectedPatient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsDeleteModalOpen(false);
              setSelectedPatient(null);
            }
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
          
            <h2 className="text-xl font-semibold text-gray-900 text-start mb-2">
              Supprimer le patient
            </h2>
            <p className="text-gray-600 text-start mb-6">
              Êtes-vous sûr de vouloir supprimer <strong>{selectedPatient.prenom} {selectedPatient.nom}</strong> ?
              Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedPatient(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deletePatientMutation.isPending}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletePatientMutation.isPending ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientsPage;


