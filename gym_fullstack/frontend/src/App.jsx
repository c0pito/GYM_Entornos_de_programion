import { Navigate, Route, Routes } from 'react-router-dom';

import AdminDashboard from './pages/AdminDashboard.jsx';
import ClientDashboard from './pages/ClientDashboard.jsx';
import LoginPage from './pages/LoginPage.jsx';
import PlansPage from './pages/PlansPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ReservationsPage from './pages/ReservationsPage.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/planes" element={<PlansPage />} />
      <Route path="/reservas" element={<ReservationsPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["Administrador"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/maquinas"
        element={
          <ProtectedRoute roles={["Administrador"]}>
            <AdminDashboard initialTab="maquinas" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/agenda"
        element={
          <ProtectedRoute roles={["Administrador"]}>
            <AdminDashboard initialTab="agenda" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cliente"
        element={
          <ProtectedRoute roles={["Cliente"]}>
            <ClientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          user ? (
            <Navigate to={user.role === 'Administrador' ? '/admin' : '/cliente'} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
