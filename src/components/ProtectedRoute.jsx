import { Navigate } from 'react-router-dom';
import { estaAutenticado } from '../auth';

export default function ProtectedRoute({ children }) {
  if (!estaAutenticado()) {
    // Si no está logueado, lo mandamos al login
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, muestra la página normalmente
  return children;
}