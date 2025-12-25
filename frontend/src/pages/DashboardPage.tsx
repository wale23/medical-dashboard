import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

const DashboardPage = () => {
  const { user, patient } = useAuthStore();
  const isPatient = !!patient;

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', isPatient, user?.userRole, user?.id],
    queryFn: async () => {
      if (isPatient) {
        // Pour les patients, on récupère seulement leurs rendez-vous et consultations
        const [rendezVous, consultations] = await Promise.all([
          api.get('/rendez-vous').then((res) => {
            const allRendezVous = res.data.data;
            // Filtrer pour ne garder que les rendez-vous du patient connecté
            return allRendezVous.filter((rdv: any) => rdv.patientId === patient?.id).length;
          }),
          api.get('/consultations').then((res) => {
            const allConsultations = res.data.data;
            // Filtrer pour ne garder que les consultations du patient connecté
            return allConsultations.filter((consult: any) => consult.patientId === patient?.id).length;
          }),
        ]);
        return { rendezVous, consultations };
      } else {
        // Pour les admins/médecins
        // Les rendez-vous et consultations sont déjà filtrés par le backend selon le rôle
        const [rendezVous, consultations] = await Promise.all([
          api.get('/rendez-vous').then((res) => res.data.data.length),
          api.get('/consultations').then((res) => res.data.data.length),
        ]);

        let patients = 0;
        if (user?.userRole === 'admin') {
          // Pour l'admin, on récupère tous les patients
          const patientsResponse = await api.get('/patients');
          patients = patientsResponse.data.data.length;
        } else if (user?.userRole === 'medecin') {
          // Pour le médecin, on compte uniquement les patients qui ont des rendez-vous avec lui
          // Les rendez-vous sont déjà filtrés par le backend pour ce médecin
          const rendezVousResponse = await api.get('/rendez-vous');
          const medecinRendezVous = rendezVousResponse.data.data as any[];
          // Extraire les IDs de patients uniques
          const patientIds = new Set(medecinRendezVous.map((rdv) => rdv.patientId));
          patients = patientIds.size;
        }

        return { patients, rendezVous, consultations };
      }
    },
  });

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Tableau de bord</h1>

      {/* Stats cards */}
      <div className={`grid grid-cols-1 gap-6 ${isPatient ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
        {!isPatient && (
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
        )}

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {isPatient ? 'Mes Rendez-vous' : 'Rendez-vous'}
              </p>
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
              <p className="text-sm font-medium text-gray-600">
                {isPatient ? 'Mes Consultations' : 'Consultations'}
              </p>
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


