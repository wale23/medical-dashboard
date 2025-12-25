import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';
import { Facture, StatutPaiement, ModePaiement } from '../types';
import { format } from 'date-fns';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { showSuccessAlert, showErrorAlert, getErrorMessage } from '../utils/alert';
import { useAuthStore } from '../store/authStore';

const updateFactureSchema = z.object({
  statutPaiement: z.nativeEnum(StatutPaiement),
  modePaiement: z.nativeEnum(ModePaiement).optional(),
  datePaiement: z.string().optional(),
  notes: z.string().optional(),
});

type UpdateFactureFormData = z.infer<typeof updateFactureSchema>;

const FacturesPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: errorsEdit },
    reset: resetEdit,
  } = useForm<UpdateFactureFormData>({
    resolver: zodResolver(updateFactureSchema),
  });

  const { data: factures, isLoading } = useQuery({
    queryKey: ['factures'],
    queryFn: async () => {
      const response = await api.get('/factures');
      return response.data.data as (Facture & {
        patient?: {
          id: string;
          nom: string;
          prenom: string;
        };
        consultation?: {
          id: string;
          dateConsultation: string;
        };
      })[];
    },
  });

  const updateFactureMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateFactureFormData }) => {
      const response = await api.put(`/factures/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      setIsEditModalOpen(false);
      setSelectedFacture(null);
      resetEdit();
      showSuccessAlert(data?.message || 'Facture mise à jour avec succès');
    },
    onError: (error: any) => {
      const errorMessage = getErrorMessage(error);
      showErrorAlert(errorMessage);
    },
  });

  const onSubmitEdit = (data: UpdateFactureFormData) => {
    if (selectedFacture) {
      updateFactureMutation.mutate({ id: selectedFacture.id, data });
    }
  };

  const handleEdit = (facture: Facture) => {
    setSelectedFacture(facture);
    resetEdit({
      statutPaiement: facture.statutPaiement,
      modePaiement: facture.modePaiement || undefined,
      datePaiement: facture.datePaiement ? new Date(facture.datePaiement).toISOString().split('T')[0] : undefined,
      notes: facture.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const getStatutColor = (statut: StatutPaiement) => {
    const colors: Record<StatutPaiement, string> = {
      en_attente: 'bg-orange-100 text-orange-800',
      payee: 'bg-green-100 text-green-800',
      partiellement_payee: 'bg-yellow-100 text-yellow-800',
      impayee: 'bg-red-100 text-red-800',
    };
    return colors[statut] || 'bg-gray-100 text-gray-800';
  };

  const getStatutLabel = (statut: StatutPaiement) => {
    const labels: Record<StatutPaiement, string> = {
      en_attente: 'En attente',
      payee: 'Payée',
      partiellement_payee: 'Partiellement payée',
      impayee: 'Impayée',
    };
    return labels[statut] || statut;
  };

  const getModePaiementLabel = (mode?: ModePaiement) => {
    if (!mode) return '-';
    const labels: Record<ModePaiement, string> = {
      especes: 'Espèces',
      carte: 'Carte',
      cheque: 'Chèque',
      virement: 'Virement',
    };
    return labels[mode] || mode;
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Factures</h1>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Numéro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date consultation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Mode de paiement
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {factures && factures.length > 0 ? (
                factures.map((facture) => (
                  <tr key={facture.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {facture.numeroFacture}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {facture.patient
                        ? `${facture.patient.prenom} ${facture.patient.nom}`
                        : '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {facture.consultation
                        ? format(new Date(facture.consultation.dateConsultation), 'dd/MM/yyyy')
                        : '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                      {Number(facture.montantTotal || 0).toFixed(2)} TND
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatutColor(
                          facture.statutPaiement
                        )}`}
                      >
                        {getStatutLabel(facture.statutPaiement)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {getModePaiementLabel(facture.modePaiement)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(facture)}
                          className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded hover:bg-blue-50"
                          title="Modifier"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => navigate(`/consultations/${facture.consultationId}`)}
                          className="text-green-600 hover:text-green-900 transition-colors p-1 rounded hover:bg-green-50"
                          title="Voir la consultation"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Aucune facture enregistrée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'édition */}
      {isEditModalOpen && selectedFacture && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsEditModalOpen(false);
              setSelectedFacture(null);
              resetEdit();
            }
          }}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Modifier la facture</h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedFacture(null);
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de facture
                </label>
                <input
                  type="text"
                  value={selectedFacture.numeroFacture}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant total
                  </label>
                  <input
                    type="text"
                    value={`${Number(selectedFacture.montantTotal || 0).toFixed(2)} TND`}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut de paiement <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...registerEdit('statutPaiement')}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errorsEdit.statutPaiement ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="en_attente">En attente</option>
                    <option value="payee">Payée</option>
                    <option value="partiellement_payee">Partiellement payée</option>
                    <option value="impayee">Impayée</option>
                  </select>
                  {errorsEdit.statutPaiement && (
                    <p className="mt-1 text-sm text-red-500">{errorsEdit.statutPaiement.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mode de paiement
                  </label>
                  <select
                    {...registerEdit('modePaiement')}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errorsEdit.modePaiement ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Sélectionner un mode</option>
                    <option value="especes">Espèces</option>
                    <option value="carte">Carte</option>
                    <option value="cheque">Chèque</option>
                    <option value="virement">Virement</option>
                  </select>
                  {errorsEdit.modePaiement && (
                    <p className="mt-1 text-sm text-red-500">{errorsEdit.modePaiement.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de paiement
                  </label>
                  <input
                    {...registerEdit('datePaiement')}
                    type="date"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errorsEdit.datePaiement ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errorsEdit.datePaiement && (
                    <p className="mt-1 text-sm text-red-500">{errorsEdit.datePaiement.message}</p>
                  )}
                </div>
              </div>

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
                    setSelectedFacture(null);
                    resetEdit();
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={updateFactureMutation.isPending}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateFactureMutation.isPending ? 'Modification...' : 'Modifier la facture'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacturesPage;

