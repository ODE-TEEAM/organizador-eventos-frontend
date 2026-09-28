// Guardar la sesión completa que devuelve el backend
export function guardarSesion(data) {
  localStorage.setItem('usuario', JSON.stringify(data));
}

// Obtener el usuario completo
export function obtenerUsuario() {
  const data = localStorage.getItem('usuario');
  return data ? JSON.parse(data) : null;
}

// ¿Está autenticado?
export function estaAutenticado() {
  return !!obtenerUsuario();
}

// Cerrar sesión
export function cerrarSesion() {
  localStorage.removeItem('usuario');
}

// Obtener solo el token (si el backend lo envía)
export function obtenerToken() {
  const usuario = obtenerUsuario();
  return usuario?.token || usuario?.access || usuario?.access_token || null;
}

// Headers listos para enviar en las peticiones protegidas
export function getAuthHeaders() {
  const token = obtenerToken();
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}