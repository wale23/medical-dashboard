import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';
import { Disponibilite } from '../types';
import { useAuthStore } from '../store/authStore';
import { showSuccessAlert, showErrorAlert, getErrorMessage } from '../utils/alert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const joursSemaine = [
  { value: 0, label: 'Dimanche' },
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
];

const createDisponibiliteSchema = z
  .object({
    userId: z.string().min(1, 'Le médecin est requis'),
    jourSemaine: z.union([z.number().min(0).max(6), z.nan(), z.undefined()]).transform((val) => {
      if (val === undefined || isNaN(Number(val))) return undefined;
      return Number(val);
    }).optional(),
    heureDebut: z.string().min(1, 'L\'heure de début est requise'),
    heureFin: z.string().min(1, 'L\'heure de fin est requise'),
    dureeConsultation: z.number().min(15, 'La durée minimum est de 15 minutes').max(240, 'La durée maximum est de 240 minutes').default(30),
    dateSpecifique: z.string().optional(),
    estException: z.union([z.boolean(), z.string()]).transform((val) => {
      if (typeof val === 'string') {
        return val === 'true' || val === 'on';
      }
      return Boolean(val);
    }),
    estDisponible: z.union([z.boolean(), z.string()]).transform((val) => {
      if (typeof val === 'string') {
        return val === 'true' || val === 'on';
      }
      return Boolean(val);
    }).default(true),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Si c'est une exception, dateSpecifique est requis et jourSemaine n'est pas requis
    if (data.estException) {
      if (!data.dateSpecifique || data.dateSpecifique.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La date spécifique est requise pour une exception',
          path: ['dateSpecifique'],
        });
      }
      // Pour une exception, on ignore jourSemaine même s'il est défini
    } else {
      // Si ce n'est pas une exception, jourSemaine est requis et dateSpecifique n'est pas requis
      if (data.jourSemaine === undefined || data.jourSemaine === null || isNaN(Number(data.jourSemaine))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Le jour de la semaine est requis pour une disponibilité régulière',
          path: ['jourSemaine'],
        });
      }
      // Pour une disponibilité régulière, on ignore dateSpecifique même s'il est défini
    }
  });

const updateDisponibiliteSchema = createDisponibiliteSchema;

type CreateDisponibiliteFormData = z.infer<typeof createDisponibiliteSchema>;
type UpdateDisponibiliteFormData = z.infer<typeof updateDisponibiliteSchema>;

const DisponibilitesPage = () => {
  const { user: currentUser } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDisponibilite, setSelectedDisponibilite] = useState<Disponibilite | null>(null);
  const [isJourSemaineDropdownOpen, setIsJourSemaineDropdownOpen] = useState(false);
  const jourSemaineDropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fermer les dropdowns en cliquant en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (jourSemaineDropdownRef.current && !jourSemaineDropdownRef.current.contains(event.target as Node)) {
        setIsJourSemaineDropdownOpen(false);
      }
    };

    if (isJourSemaineDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isJourSemaineDropdownOpen]);

  const { data: disponibilites, isLoading } = useQuery({
    queryKey: ['disponibilites', currentUser?.id],
    queryFn: async () => {
      const response = await api.get(`/disponibilites/user/${currentUser?.id}`);
      return response.data.data as Disponibilite[];
    },
    enabled: !!currentUser?.id,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CreateDisponibiliteFormData>({
    resolver: zodResolver(createDisponibiliteSchema),
    defaultValues: {
      userId: currentUser?.id || '',
      dureeConsultation: 30,
      estException: false,
      estDisponible: true,
      jourSemaine: undefined,
      dateSpecifique: undefined,
    },
    mode: 'onChange',
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: errorsEdit },
    reset: resetEdit,
    watch: watchEdit,
    setValue: setValueEdit,
  } = useForm<UpdateDisponibiliteFormData>({
    resolver: zodResolver(updateDisponibiliteSchema),
  });

  const selectedJourSemaine = watch('jourSemaine');
  const estException = watch('estException');
  const selectedEditJourSemaine = watchEdit('jourSemaine');
  const estEditException = watchEdit('estException');

  const createDisponibiliteMutation = useMutation({
    mutationFn: async (data: CreateDisponibiliteFormData) => {
      console.log('Mutation called with data:', data);
      // Formatage des données avant l'envoi
      const payload: any = {
        userId: data.userId,
        heureDebut: data.heureDebut,
        heureFin: data.heureFin,
        dureeConsultation: data.dureeConsultation,
        estException: data.estException,
        estDisponible: data.estDisponible,
        notes: data.notes,
      };

      if (data.estException) {
        // Pour une exception : dateSpecifique requis, jourSemaine = 0 (par défaut)
        payload.dateSpecifique = data.dateSpecifique;
        payload.jourSemaine = 0; // Valeur par défaut pour les exceptions
      } else {
        // Pour une disponibilité régulière : jourSemaine requis, pas de dateSpecifique
        payload.jourSemaine = data.jourSemaine;
        // Ne pas inclure dateSpecifique dans le payload si ce n'est pas une exception
        if (payload.dateSpecifique !== undefined) {
          delete payload.dateSpecifique;
        }
      }

      console.log('Sending payload to API:', payload);
      const response = await api.post('/disponibilites', payload);
      console.log('API response:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Success creating disponibilite:', data);
      queryClient.invalidateQueries({ queryKey: ['disponibilites'] });
      queryClient.invalidateQueries({ queryKey: ['disponibilites', currentUser?.id] });
      setIsModalOpen(false);
      reset();
      showSuccessAlert(data?.message || 'Disponibilité créée avec succès');
    },
    onError: (error: any) => {
      console.error('Error creating disponibilite:', error);
      console.error('Error details:', error.response?.data || error.message);
      const errorMessage = getErrorMessage(error);
      showErrorAlert(errorMessage);
    },
  });

  const updateDisponibiliteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDisponibiliteFormData }) => {
      const response = await api.put(`/disponibilites/${id}`, {
        ...data,
        jourSemaine: data.estException ? undefined : data.jourSemaine,
        dateSpecifique: data.estException ? data.dateSpecifique : undefined,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['disponibilites'] });
      setIsEditModalOpen(false);
      setSelectedDisponibilite(null);
      resetEdit();
      showSuccessAlert(data?.message || 'Disponibilité modifiée avec succès');
    },
    onError: (error: any) => {
      const errorMessage = getErrorMessage(error);
      showErrorAlert(errorMessage);
    },
  });

  const deleteDisponibiliteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/disponibilites/${id}`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['disponibilites'] });
      setIsDeleteModalOpen(false);
      setSelectedDisponibilite(null);
      showSuccessAlert(data?.message || 'Disponibilité supprimée avec succès');
    },
    onError: (error: any) => {
      const errorMessage = getErrorMessage(error);
      showErrorAlert(errorMessage);
    },
  });

  const onSubmit = (data: CreateDisponibiliteFormData) => {
    console.log('✅ Form submitted with data:', data);
    console.log('✅ Data estException:', data.estException);
    console.log('✅ Data jourSemaine:', data.jourSemaine);
    console.log('✅ Data dateSpecifique:', data.dateSpecifique);
    // Les données sont déjà validées par Zod, on peut les envoyer directement
    createDisponibiliteMutation.mutate(data);
  };

  const onSubmitEdit = (data: UpdateDisponibiliteFormData) => {
    if (selectedDisponibilite) {
      updateDisponibiliteMutation.mutate({ id: selectedDisponibilite.id, data });
    }
  };

  const openModal = () => {
    reset({
      userId: currentUser?.id || '',
      dureeConsultation: 30,
      estException: false,
      estDisponible: true,
      jourSemaine: undefined,
      dateSpecifique: undefined,
      heureDebut: '',
      heureFin: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    reset();
  };

  const handleEdit = (disp: Disponibilite) => {
    setSelectedDisponibilite(disp);
    resetEdit({
      userId: disp.userId,
      jourSemaine: disp.estException ? undefined : disp.jourSemaine,
      heureDebut: disp.heureDebut,
      heureFin: disp.heureFin,
      dureeConsultation: disp.dureeConsultation,
      dateSpecifique: disp.dateSpecifique ? new Date(disp.dateSpecifique).toISOString().split('T')[0] : undefined,
      estException: disp.estException,
      estDisponible: disp.estDisponible,
      notes: disp.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (disp: Disponibilite) => {
    setSelectedDisponibilite(disp);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedDisponibilite) {
      deleteDisponibiliteMutation.mutate(selectedDisponibilite.id);
    }
  };

  const getJourLabel = (jourSemaine: number) => {
    return joursSemaine.find((j) => j.value === jourSemaine)?.label || 'Inconnu';
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Mes Disponibilités</h1>
        <button onClick={openModal} className="btn btn-primary">
          Nouvelle disponibilité
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Jour / Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Heures
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Durée consultation
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
              {disponibilites && disponibilites.length > 0 ? (
                disponibilites.map((disp) => (
                  <tr key={disp.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        disp.estException ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {disp.estException ? 'Exception' : 'Régulière'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {disp.estException && disp.dateSpecifique
                        ? new Date(disp.dateSpecifique).toLocaleDateString('fr-FR')
                        : getJourLabel(disp.jourSemaine)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {disp.heureDebut} - {disp.heureFin}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {disp.dureeConsultation} min
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        disp.estDisponible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {disp.estDisponible ? 'Disponible' : 'Indisponible'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(disp)}
                          className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded hover:bg-blue-50"
                          title="Modifier"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(disp)}
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
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Aucune disponibilité définie
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de création */}
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
              <h2 className="text-xl font-semibold text-gray-900">Nouvelle disponibilité</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                console.log('Form submit event triggered');
                e.preventDefault();
                handleSubmit(
                  (data) => {
                    console.log('Form validation passed, submitting:', data);
                    onSubmit(data);
                  },
                  (errors) => {
                    console.error('Form validation failed:', errors);
                    console.error('Form errors details:', errors);
                  }
                )(e);
              }} 
              className="p-6 space-y-6"
            >
              <input type="hidden" {...register('userId')} />

              {/* Type de disponibilité */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Type de disponibilité
                </label>
                <div className="space-y-3">
                  <label className="flex items-start cursor-pointer group">
                    <input
                      type="radio"
                      {...register('estException')}
                      checked={!estException}
                      onChange={() => {
                        setValue('estException', false);
                        setValue('dateSpecifique', undefined);
                        setValue('jourSemaine', undefined);
                      }}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-gray-900 block">Disponibilité régulière</span>
                      <span className="text-sm text-gray-600">
                        Pour définir vos horaires récurrents chaque semaine (ex: Tous les lundis de 9h à 12h)
                      </span>
                    </div>
                  </label>
                  <label className="flex items-start cursor-pointer group">
                    <input
                      type="radio"
                      name="estException"
                      checked={estException}
                      onChange={() => {
                        setValue('estException', true, { shouldValidate: true });
                        setValue('jourSemaine', undefined); // Réinitialiser le jour car il n'est plus requis
                        setValue('dateSpecifique', ''); // Réinitialiser la date
                        // Clear les erreurs de jourSemaine car il n'est plus requis
                      }}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-gray-900 block">Exception (date spécifique)</span>
                      <span className="text-sm text-gray-600">
                        Pour des disponibilités ponctuelles ou des jours fériés (ex: Disponible le 25 décembre de 10h à 14h)
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Jour de la semaine (si régulière) */}
              {!estException && (
                <div className="relative" ref={jourSemaineDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jour de la semaine <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="hidden" 
                      value={selectedJourSemaine !== undefined && selectedJourSemaine !== null ? selectedJourSemaine : ''}
                      {...register('jourSemaine', { 
                        valueAsNumber: true,
                        setValueAs: (v) => {
                          if (v === '' || v === undefined || v === null) return undefined;
                          const num = Number(v);
                          return isNaN(num) ? undefined : num;
                        }
                      })} 
                    />
                    <button
                      type="button"
                      onClick={() => setIsJourSemaineDropdownOpen(!isJourSemaineDropdownOpen)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-left flex items-center justify-between ${
                        errors.jourSemaine ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    >
                      <span className={selectedJourSemaine !== undefined ? 'text-gray-900' : 'text-gray-500'}>
                        {selectedJourSemaine !== undefined
                          ? joursSemaine.find((j) => j.value === selectedJourSemaine)?.label
                          : 'Sélectionner un jour'}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isJourSemaineDropdownOpen ? 'transform rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isJourSemaineDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                        {joursSemaine.map((jour) => (
                          <button
                            key={jour.value}
                            type="button"
                            onClick={() => {
                              setValue('jourSemaine', jour.value);
                              setIsJourSemaineDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-left hover:bg-primary-50 transition-colors ${
                              selectedJourSemaine === jour.value
                                ? 'bg-primary-50 text-primary-600'
                                : 'text-gray-900'
                            }`}
                          >
                            {jour.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.jourSemaine && (
                    <p className="mt-1 text-sm text-red-600 font-medium">{errors.jourSemaine.message}</p>
                  )}
                </div>
              )}

              {/* Date spécifique (si exception) */}
              {estException && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date spécifique <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('dateSpecifique')}
                    type="date"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.dateSpecifique ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.dateSpecifique && (
                    <p className="mt-1 text-sm text-red-600 font-medium">{errors.dateSpecifique.message}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Heure de début */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heure de début <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('heureDebut')}
                    type="time"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.heureDebut ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.heureDebut && (
                    <p className="mt-1 text-sm text-red-500">{errors.heureDebut.message}</p>
                  )}
                </div>

                {/* Heure de fin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heure de fin <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('heureFin')}
                    type="time"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.heureFin ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.heureFin && (
                    <p className="mt-1 text-sm text-red-500">{errors.heureFin.message}</p>
                  )}
                </div>

                {/* Durée consultation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée consultation (minutes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('dureeConsultation', { valueAsNumber: true })}
                    type="number"
                    min="15"
                    max="240"
                    step="15"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.dureeConsultation ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.dureeConsultation && (
                    <p className="mt-1 text-sm text-red-500">{errors.dureeConsultation.message}</p>
                  )}
                </div>

                {/* Statut */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('estDisponible')}
                      className="mr-2"
                    />
                    <span>Disponible</span>
                  </label>
                </div>
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
                  disabled={createDisponibiliteMutation.isPending}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createDisponibiliteMutation.isPending ? 'Création...' : 'Créer la disponibilité'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {isEditModalOpen && selectedDisponibilite && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsEditModalOpen(false);
              setSelectedDisponibilite(null);
              resetEdit();
            }
          }}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Modifier la disponibilité</h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedDisponibilite(null);
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
              <input type="hidden" {...registerEdit('userId')} />

              {/* Type de disponibilité */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Type de disponibilité
                </label>
                <div className="space-y-3">
                  <label className="flex items-start cursor-pointer group">
                    <input
                      type="radio"
                      {...registerEdit('estException')}
                      checked={!estEditException}
                      onChange={() => {
                        setValueEdit('estException', false);
                        setValueEdit('dateSpecifique', undefined);
                      }}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-gray-900 block">Disponibilité régulière</span>
                      <span className="text-sm text-gray-600">
                        Pour définir vos horaires récurrents chaque semaine (ex: Tous les lundis de 9h à 12h)
                      </span>
                    </div>
                  </label>
                  <label className="flex items-start cursor-pointer group">
                    <input
                      type="radio"
                      {...registerEdit('estException')}
                      checked={estEditException}
                      onChange={() => {
                        setValueEdit('estException', true);
                        setValueEdit('jourSemaine', undefined);
                      }}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-gray-900 block">Exception (date spécifique)</span>
                      <span className="text-sm text-gray-600">
                        Pour des disponibilités ponctuelles ou des jours fériés (ex: Disponible le 25 décembre de 10h à 14h)
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Jour de la semaine (si régulière) */}
              {!estEditException && (
                <div className="relative" ref={jourSemaineDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jour de la semaine <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input type="hidden" {...registerEdit('jourSemaine', { valueAsNumber: true })} />
                    <button
                      type="button"
                      onClick={() => setIsJourSemaineDropdownOpen(!isJourSemaineDropdownOpen)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-left flex items-center justify-between ${
                        errorsEdit.jourSemaine ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <span className={selectedEditJourSemaine !== undefined ? 'text-gray-900' : 'text-gray-500'}>
                        {selectedEditJourSemaine !== undefined
                          ? joursSemaine.find((j) => j.value === selectedEditJourSemaine)?.label
                          : 'Sélectionner un jour'}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isJourSemaineDropdownOpen ? 'transform rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isJourSemaineDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                        {joursSemaine.map((jour) => (
                          <button
                            key={jour.value}
                            type="button"
                            onClick={() => {
                              setValueEdit('jourSemaine', jour.value);
                              setIsJourSemaineDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-left hover:bg-primary-50 transition-colors ${
                              selectedEditJourSemaine === jour.value
                                ? 'bg-primary-50 text-primary-600'
                                : 'text-gray-900'
                            }`}
                          >
                            {jour.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {errorsEdit.jourSemaine && (
                    <p className="mt-1 text-sm text-red-500">{errorsEdit.jourSemaine.message}</p>
                  )}
                </div>
              )}

              {/* Date spécifique (si exception) */}
              {estEditException && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date spécifique <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...registerEdit('dateSpecifique')}
                    type="date"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errorsEdit.dateSpecifique ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errorsEdit.dateSpecifique && (
                    <p className="mt-1 text-sm text-red-500">{errorsEdit.dateSpecifique.message}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Heure de début */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heure de début <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...registerEdit('heureDebut')}
                    type="time"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errorsEdit.heureDebut ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errorsEdit.heureDebut && (
                    <p className="mt-1 text-sm text-red-500">{errorsEdit.heureDebut.message}</p>
                  )}
                </div>

                {/* Heure de fin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heure de fin <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...registerEdit('heureFin')}
                    type="time"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errorsEdit.heureFin ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errorsEdit.heureFin && (
                    <p className="mt-1 text-sm text-red-500">{errorsEdit.heureFin.message}</p>
                  )}
                </div>

                {/* Durée consultation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée consultation (minutes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...registerEdit('dureeConsultation', { valueAsNumber: true })}
                    type="number"
                    min="15"
                    max="240"
                    step="15"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errorsEdit.dureeConsultation ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errorsEdit.dureeConsultation && (
                    <p className="mt-1 text-sm text-red-500">{errorsEdit.dureeConsultation.message}</p>
                  )}
                </div>

                {/* Statut */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...registerEdit('estDisponible')}
                      className="mr-2"
                    />
                    <span>Disponible</span>
                  </label>
                </div>
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

              {/* Boutons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedDisponibilite(null);
                    resetEdit();
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={updateDisponibiliteMutation.isPending}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateDisponibiliteMutation.isPending ? 'Modification...' : 'Modifier la disponibilité'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {isDeleteModalOpen && selectedDisponibilite && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsDeleteModalOpen(false);
              setSelectedDisponibilite(null);
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
              Supprimer la disponibilité
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Êtes-vous sûr de vouloir supprimer cette disponibilité ? Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedDisponibilite(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteDisponibiliteMutation.isPending}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteDisponibiliteMutation.isPending ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisponibilitesPage;

