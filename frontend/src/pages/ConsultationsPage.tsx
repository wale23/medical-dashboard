import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Consultation } from '../types';
import { format } from 'date-fns';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const ConsultationsPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['consultations'],
    queryFn: async () => {
      const response = await api.get('/consultations');
      return response.data.data as Consultation[];
    },
  });

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Consultations</h1>
        <button className="btn btn-primary">Nouvelle consultation</button>
      </div>

      <div className="space-y-4">
        {data?.map((consultation) => (
          <div key={consultation.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {consultation.patient?.prenom} {consultation.patient?.nom}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {format(new Date(consultation.dateConsultation), "dd/MM/yyyy 'à' HH:mm")}
                  </span>
                </div>
                {consultation.diagnostic && (
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Diagnostic:</span> {consultation.diagnostic}
                  </p>
                )}
                {consultation.observations && (
                  <p className="mt-1 text-sm text-gray-600">
                    <span className="font-medium">Observations:</span> {consultation.observations}
                  </p>
                )}
              </div>
              <button className="btn btn-secondary text-sm">Voir détails</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConsultationsPage;


