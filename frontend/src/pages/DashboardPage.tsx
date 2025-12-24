import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const DashboardPage = () => {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Ces endpoints devront être créés dans le backend pour les statistiques
      const [patients, rendezVous, consultations] = await Promise.all([
        api.get('/patients').then((res) => res.data.data.length),
        api.get('/rendez-vous').then((res) => res.data.data.length),
        api.get('/consultations').then((res) => res.data.data.length),
      ]);

      return { patients, rendezVous, consultations };
    },
  });

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Tableau de bord</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Patients</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats?.patients || 0}
              </p>
            </div>
            <div className="rounded-full bg-primary-100 p-3">
              <span className="text-3xl">👥</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rendez-vous</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats?.rendezVous || 0}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <span className="text-3xl">📅</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Consultations</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats?.consultations || 0}
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <span className="text-3xl">🏥</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;


