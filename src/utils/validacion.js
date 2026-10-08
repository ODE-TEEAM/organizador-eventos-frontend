// Utilidades compartidas de validación de fechas y de mensajes de error
// provenientes del backend (que vienen como {"campo": ["mensaje"]}).

export const ANIO_MAXIMO = 2100;
export const HORAS_MIN = 1;
export const HORAS_MAX = 12;

// Etiquetas en español para los campos que puede devolver el backend.
const ETIQUETAS_CAMPOS = {
  nombre: "Nombre",
  tipo: "Tipo de evento",
  cliente: "Cliente",
  fecha_hora: "Fecha y hora",
  lugar: "Lugar",
  plazo_limite: "Plazo límite",
  plazo: "Plazo",
  horas_estimadas: "Horas estimadas",
  estado: "Estado",
  evento: "Evento",
  email: "Correo",
  password: "Contraseña",
  password_actual: "Contraseña actual",
  password_nueva: "Contraseña nueva",
  limite_horas_diarias: "Límite de horas diarias",
  non_field_errors: "Error",
};

// Fecha/hora local en formato de <input type="datetime-local"> ("YYYY-MM-DDTHH:mm").
export function ahoraLocalInput() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

// Fecha local de hoy ("YYYY-MM-DD").
export function hoyLocalISO() {
  return ahoraLocalInput().slice(0, 10);
}

// Fecha/hora local dentro de N años (tope superior para inputs de fecha).
export function dentroDeAniosInput(anios) {
  const d = new Date();
  d.setFullYear(d.getFullYear() + anios);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ¿El año de un valor "YYYY-MM-DD..." está dentro del rango permitido?
export function esAnioRazonable(valor) {
  if (!valor) return false;
  const anio = Number(String(valor).slice(0, 4));
  return Number.isInteger(anio) && anio >= 1900 && anio <= ANIO_MAXIMO;
}

// Convierte la respuesta de error del backend en algo legible:
// - arrays de mensajes -> string plano (sin corchetes)
// - detail / non_field_errors -> campo "general"
// Devuelve { campos: {campo: mensaje}, general: string }.
export function normalizarErroresBackend(datos) {
  const campos = {};
  let general = "";

  if (!datos) return { campos, general };

  if (typeof datos === "string") {
    return { campos, general: datos };
  }

  if (datos.detail) {
    const detalle = Array.isArray(datos.detail)
      ? datos.detail.join(" ")
      : String(datos.detail);
    return { campos, general: detalle };
  }

  for (const [clave, valor] of Object.entries(datos)) {
    const mensaje = Array.isArray(valor) ? valor.join(" ") : String(valor);
    if (clave === "non_field_errors") {
      general = general ? `${general} ${mensaje}` : mensaje;
    } else {
      campos[clave] = mensaje;
    }
  }

  return { campos, general };
}

// Texto único para mostrar al usuario (une el error general + campos etiquetados).
export function resumenErrores({ campos, general }) {
  const partes = [];
  if (general) partes.push(general);
  for (const [campo, mensaje] of Object.entries(campos)) {
    const etiqueta = ETIQUETAS_CAMPOS[campo] || campo;
    partes.push(`${etiqueta}: ${mensaje}`);
  }
  return partes.join(" ");
}

// Mensaje único a partir de cualquier respuesta de error del backend.
export function mensajeDeError(datos, prefijo = "") {
  const resumen = resumenErrores(normalizarErroresBackend(datos));
  if (prefijo && resumen) return `${prefijo} ${resumen}`;
  return resumen || prefijo || "Ocurrió un error inesperado. Inténtalo de nuevo.";
}

// Baja suavemente hasta el primer campo marcado como inválido y lo enfoca.
export function enfocarPrimerError(contenedorSelector) {
  setTimeout(() => {
    const primero = document.querySelector(
      `${contenedorSelector} [aria-invalid="true"]`
    );
    if (primero) {
      primero.scrollIntoView({ behavior: "smooth", block: "center" });
      primero.focus({ preventScroll: true });
    }
  }, 60);
}
