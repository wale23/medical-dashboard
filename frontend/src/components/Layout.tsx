import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, patient, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Navigation pour les utilisateurs (médecins/admins)
  const userNavItems = [
    { path: '/', label: 'Tableau de bord', icon: '📊', roles: ['medecin', 'admin'] },
    { path: '/patients', label: 'Patients', icon: '👥', roles: ['medecin', 'admin'] },
    { path: '/rendez-vous', label: 'Rendez-vous', icon: '📅', roles: ['medecin', 'admin'] },
    { path: '/consultations', label: 'Consultations', icon: '🏥', roles: ['medecin', 'admin'] },
    { path: '/disponibilites', label: 'Mes Disponibilités', icon: '⏰', roles: ['medecin'] },
    { path: '/admin/disponibilites', label: 'Disponibilités', icon: '⏰', roles: ['admin'] },
    { path: '/medecins', label: 'Utilisateurs', icon: '👥', roles: ['admin'] },
    { path: '/factures', label: 'Factures', icon: '🧾', roles: ['admin'] },
  ].filter((item) => {
    return user?.userRole && item.roles.includes(user.userRole);
  });

  // Navigation pour les patients
  const patientNavItems = [
    { path: '/', label: 'Tableau de bord', icon: '📊' },
    { path: '/rendez-vous', label: 'Mes Rendez-vous', icon: '📅' },
    { path: '/consultations', label: 'Mes Consultations', icon: '🏥' },
    { path: '/patient/disponibilites', label: 'Disponibilités', icon: '⏰' },
  ];

  const navItems = user ? userNavItems : patientNavItems;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="border-b border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-primary-600">Cabinet Médical</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 rounded-lg px-4 py-3 transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User/Patient info */}
          <div className="border-t border-gray-200 p-4">
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-900">
                {user ? `${user.prenom} ${user.nom}` : patient ? `${patient.prenom} ${patient.nom}` : ''}
              </p>
              <p className="text-xs text-gray-500">
                {user ? user.specialite || user.userRole : patient ? 'Patient' : ''}
              </p>
            </div>
            <div className="space-y-2">
              {user && (
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full rounded-lg bg-primary-100 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-200 transition-colors"
                >
                  Voir mon profil
                </button>
              )}
              {patient && (
                <button
                  onClick={() => navigate('/patient/profile')}
                  className="w-full rounded-lg bg-primary-100 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-200 transition-colors"
                >
                  Voir mon profil
                </button>
              )}
              <button
                onClick={handleLogout}
                className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;


