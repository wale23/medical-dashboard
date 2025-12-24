import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import ToastContainer from './components/ui/ToastContainer';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import PatientDetailPage from './pages/PatientDetailPage';
import RendezVousPage from './pages/RendezVousPage';
import RendezVousDetailPage from './pages/RendezVousDetailPage';
import ConsultationsPage from './pages/ConsultationsPage';
import MedecinsPage from './pages/MedecinsPage';
import DisponibilitesPage from './pages/DisponibilitesPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <>
      <ToastContainer />
      <Router>
        <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients"
          element={
            <ProtectedRoute>
              <PatientsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/:id"
          element={
            <ProtectedRoute>
              <PatientDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rendez-vous"
          element={
            <ProtectedRoute>
              <RendezVousPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rendez-vous/:id"
          element={
            <ProtectedRoute>
              <RendezVousDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/consultations"
          element={
            <ProtectedRoute>
              <ConsultationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/medecins"
          element={
            <AdminRoute>
              <MedecinsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/disponibilites"
          element={
            <ProtectedRoute>
              <DisponibilitesPage />
            </ProtectedRoute>
          }
        />
      </Routes>
      </Router>
    </>
  );
}

export default App;


