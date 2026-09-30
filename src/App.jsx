import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Hoy from "./pages/Hoy";
import Crear from "./pages/Crear";
import Evento from "./pages/Evento";
import Progreso from "./pages/Progreso";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        {/* Rutas protegidas */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Hoy />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hoy"
          element={
            <ProtectedRoute>
              <Hoy />
            </ProtectedRoute>
          }
        />
        <Route
          path="/crear"
          element={
            <ProtectedRoute>
              <Crear />
            </ProtectedRoute>
          }
        />
        <Route
          path="/evento/:id"
          element={
            <ProtectedRoute>
              <Evento />
            </ProtectedRoute>
          }
        />
        <Route
          path="/progreso"
          element={
            <ProtectedRoute>
              <Progreso />
            </ProtectedRoute>
          }
        />

        {/* Cualquier otra ruta → redirige a /hoy */}
        <Route path="*" element={<Navigate to="/hoy" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;