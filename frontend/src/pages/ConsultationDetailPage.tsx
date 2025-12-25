import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Consultation, Prescription, Facture } from '../types';
import { format } from 'date-fns';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const ConsultationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: consultation, isLoading, error } = useQuery({
    queryKey: ['consultation', id],
    queryFn: async () => {
      const response = await api.get(`/consultations/${id}`);
      return response.data.data as Consultation & {
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
        rendezVous?: {
          id: string;
          dateHeure: string;
          statut: string;
        };
        prescriptions?: Prescription[];
        facture?: Facture;
      };
    },
    enabled: !!id,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !consultation) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Consultation non trouvée</p>
          <button
            onClick={() => navigate('/consultations')}
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
            onClick={() => navigate('/consultations')}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Détails de la consultation</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations de la consultation */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations de la consultation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Date de consultation</label>
                <p className="mt-1 text-gray-900">
                  {format(new Date(consultation.dateConsultation), "dd/MM/yyyy 'à' HH:mm")}
                </p>
              </div>
              {consultation.motifConsultation && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Motif de consultation</label>
                  <p className="mt-1 text-gray-900">{consultation.motifConsultation}</p>
                </div>
              )}
              {consultation.examenClinique && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Examen clinique</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-line">{consultation.examenClinique}</p>
                </div>
              )}
              {consultation.diagnostic && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Diagnostic</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-line">{consultation.diagnostic}</p>
                </div>
              )}
              {consultation.observations && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Observations</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-line">{consultation.observations}</p>
                </div>
              )}
              {consultation.recommandations && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Recommandations</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-line">{consultation.recommandations}</p>
                </div>
              )}
              {consultation.prochainRendezVous && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Prochain rendez-vous</label>
                  <p className="mt-1 text-gray-900">
                    {format(new Date(consultation.prochainRendezVous), 'dd/MM/yyyy')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Informations du patient */}
          {consultation.patient && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Patient</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nom complet</label>
                  <p className="mt-1 text-gray-900">
                    {consultation.patient.prenom} {consultation.patient.nom}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Téléphone</label>
                  <p className="mt-1 text-gray-900">{consultation.patient.telephone}</p>
                </div>
                {consultation.patient.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="mt-1 text-gray-900">{consultation.patient.email}</p>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <button
                  onClick={() => navigate(`/patients/${consultation.patientId}`)}
                  className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                >
                  Voir le profil du patient →
                </button>
              </div>
            </div>
          )}

          {/* Informations du médecin */}
          {consultation.user && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Médecin</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nom complet</label>
                  <p className="mt-1 text-gray-900">
                    Dr. {consultation.user.prenom} {consultation.user.nom}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Spécialité</label>
                  <p className="mt-1 text-gray-900">{consultation.user.specialite}</p>
                </div>
              </div>
            </div>
          )}

          {/* Prescriptions */}
          {consultation.prescriptions && consultation.prescriptions.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Prescriptions</h2>
              <div className="space-y-4">
                {consultation.prescriptions.map((prescription) => (
                  <div key={prescription.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Médicaments</label>
                        <p className="mt-1 text-gray-900 whitespace-pre-line">{prescription.medicaments}</p>
                      </div>
                      {prescription.instructions && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Instructions</label>
                          <p className="mt-1 text-gray-900 whitespace-pre-line">{prescription.instructions}</p>
                        </div>
                      )}
                      {prescription.dateDebut && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Date de début</label>
                          <p className="mt-1 text-gray-900">
                            {format(new Date(prescription.dateDebut), 'dd/MM/yyyy')}
                          </p>
                        </div>
                      )}
                      {prescription.dateFin && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Date de fin</label>
                          <p className="mt-1 text-gray-900">
                            {format(new Date(prescription.dateFin), 'dd/MM/yyyy')}
                          </p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-gray-500">Statut</label>
                        <p className="mt-1">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              prescription.statut === 'active'
                                ? 'bg-green-100 text-green-800'
                                : prescription.statut === 'terminee'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {prescription.statut === 'active'
                              ? 'Active'
                              : prescription.statut === 'terminee'
                                ? 'Terminée'
                                : 'Annulée'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rendez-vous associé */}
          {consultation.rendezVous && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Rendez-vous associé</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Date et heure</label>
                  <p className="mt-1 text-gray-900">
                    {format(new Date(consultation.rendezVous.dateHeure), "dd/MM/yyyy 'à' HH:mm")}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Statut</label>
                  <p className="mt-1 text-gray-900">{consultation.rendezVous.statut}</p>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => navigate(`/rendez-vous/${consultation.rendezVousId}`)}
                  className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                >
                  Voir le rendez-vous →
                </button>
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
                  {format(new Date(consultation.createdAt), 'dd/MM/yyyy à HH:mm')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Dernière modification</label>
                <p className="mt-1 text-gray-900">
                  {format(new Date(consultation.updatedAt), 'dd/MM/yyyy à HH:mm')}
                </p>
              </div>
            </div>
          </div>

          {/* Facture */}
          {consultation.facture && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Facture</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Numéro de facture</label>
                  <p className="mt-1 text-gray-900">{consultation.facture.numeroFacture}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Montant total</label>
                  <p className="mt-1 text-gray-900 font-semibold">
                    {Number(consultation.facture.montantTotal || 0).toFixed(2)} TND
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Statut de paiement</label>
                  <p className="mt-1">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        consultation.facture.statutPaiement === 'payee'
                          ? 'bg-green-100 text-green-800'
                          : consultation.facture.statutPaiement === 'en_attente'
                            ? 'bg-orange-100 text-orange-800'
                            : consultation.facture.statutPaiement === 'partiellement_payee'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {consultation.facture.statutPaiement === 'payee'
                        ? 'Payée'
                        : consultation.facture.statutPaiement === 'en_attente'
                          ? 'En attente'
                          : consultation.facture.statutPaiement === 'partiellement_payee'
                            ? 'Partiellement payée'
                            : 'Impayée'}
                    </span>
                  </p>
                </div>
                {consultation.facture.modePaiement && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Mode de paiement</label>
                    <p className="mt-1 text-gray-900">
                      {consultation.facture.modePaiement === 'especes'
                        ? 'Espèces'
                        : consultation.facture.modePaiement === 'carte'
                          ? 'Carte'
                          : consultation.facture.modePaiement === 'cheque'
                            ? 'Chèque'
                            : 'Virement'}
                    </p>
                  </div>
                )}
                {consultation.facture.datePaiement && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date de paiement</label>
                    <p className="mt-1 text-gray-900">
                      {format(new Date(consultation.facture.datePaiement), 'dd/MM/yyyy')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultationDetailPage;

