import { useEffect, useState } from "react";
import { CalendarPlus, ListPlus } from "lucide-react";
import { useParams, useLocation, Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { getAuthHeaders } from "../auth";
import {
  ANIO_MAXIMO,
  ahoraLocalInput,
  dentroDeAniosInput,
  esAnioRazonable,
  enfocarPrimerError,
  normalizarErroresBackend,
  resumenErrores,
  HORAS_MAX,
  avisarCambioDatos,
} from "../utils/validacion";
import { semaforoGestion } from "../utils/semaforo";
import "./formularios.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const LONGITUD_MINIMA_TEXTO = 3;
const CONTIENE_LETRA = /[a-zA-ZÀ-ÿ]/;

function esTextoValido(valor) {
  const limpio = (valor || "").trim();
  return limpio.length >= LONGITUD_MINIMA_TEXTO && CONTIENE_LETRA.test(limpio);
}

function esFechaFutura(valor) {
  if (!valor) return false;
  const texto = String(valor);
  const fecha =
    texto.length > 10 ? new Date(texto) : new Date(`${texto}T23:59:59`);
  return !isNaN(fecha.getTime()) && fecha.getTime() > Date.now();
}

function formatearFecha(valor) {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleString("es-CO", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

function formatearSoloFecha(valor) {
  if (!valor) return "—";
  const fecha = new Date(`${valor}T00:00:00`);
  if (isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleDateString("es-CO", { dateStyle: "long" });
}

function aDateTimeLocal(valor) {
  if (!valor) return "";
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return "";
  const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function hoyISOLocal() {
  const fecha = new Date();
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fechaEventoISO(evento) {
  if (!evento?.fecha_hora) return "";
  const texto = String(evento.fecha_hora);
  if (texto.length >= 10 && texto[4] === "-") return texto.slice(0, 10);
  const fecha = new Date(texto);
  if (isNaN(fecha.getTime())) return "";
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function esCompletada(estado) {
  const e = (estado || "").toLowerCase();
  return e === "completada" || e === "ejecutada";
}

function esPospuesta(estado) {
  return (estado || "").toLowerCase() === "pospuesta";
}

function calcularProgreso(subtareas = []) {
  const total = subtareas.length;
  const completadas = subtareas.filter((s) => esCompletada(s.estado)).length;
  const porcentaje = total === 0 ? 0 : Math.round((completadas / total) * 100);
  return { total, completadas, porcentaje };
}

function IconoError() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="13" />
      <circle cx="12" cy="16.2" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconoExito() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="12" cy="12" r="9" />
      <polyline points="8 12.5 11 15.5 16 9.5" />
    </svg>
  );
}

function IconoLapiz() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

// Fila vacía del formulario de carga masiva de gestiones.
let contadorFilas = 0;
function filaVacia() {
  contadorFilas += 1;
  return { clave: contadorFilas, nombre: "", plazo: "", horas_estimadas: 2, error: "" };
}

// "YYYY-MM-DD" en formato dd/mm/aaaa para los mensajes.
function fechaCorta(iso) {
  if (!iso) return "";
  const [a, m, d] = String(iso).slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

// Aviso con acción rápida cuando el plazo de una gestión cae después del día
// del evento (pruebas de usuario, Sprint 5): en vez de solo bloquear, ofrece
// mover la fecha del evento sin perder lo que el organizador ya escribió.
function AvisoFechaEvento({ fechaEvento, plazoMaximo, onMover, moviendo }) {
  return (
    <div className="aviso-fecha-evento" role="alert">
      <p>
        <IconoError /> El plazo {fechaCorta(plazoMaximo)} queda después del
        evento ({fechaCorta(fechaEvento)}). Una gestión debe estar lista antes
        del evento.
      </p>
      <button
        type="button"
        className="boton-principal"
        onClick={onMover}
        disabled={moviendo}
      >
        {moviendo
          ? "Moviendo el evento..."
          : `Mover el evento al ${fechaCorta(plazoMaximo)} y guardar`}
      </button>
    </div>
  );
}

function Evento() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [evento, setEvento] = useState(null);
  const [error, setError] = useState("");

  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    tipo: "",
    cliente: "",
    fecha_hora: "",
    lugar: "",
    plazo_limite: "",
  });
  const [erroresEdit, setErroresEdit] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [exitoMsg, setExitoMsg] = useState("");

  const [subtareaEditando, setSubtareaEditando] = useState(null);
  const [formSubtarea, setFormSubtarea] = useState({
    nombre: "",
    plazo: "",
    horas_estimadas: 2,
  });
  const [guardandoSubtarea, setGuardandoSubtarea] = useState(false);
  const [errorSubtarea, setErrorSubtarea] = useState("");

  const [mostrarFormularioSubtarea, setMostrarFormularioSubtarea] = useState(false);
  // Carga masiva: varias filas de gestiones que se guardan con un solo botón.
  const [filasNuevas, setFilasNuevas] = useState(() => [filaVacia()]);
  const [guardandoNuevaSubtarea, setGuardandoNuevaSubtarea] = useState(false);
  const [errorNuevaSubtarea, setErrorNuevaSubtarea] = useState("");
  // Plazo que quedó después del evento: { plazo, origen: "nuevas" | "edicion" }.
  const [conflictoFechaEvento, setConflictoFechaEvento] = useState(null);
  const [moviendoEvento, setMoviendoEvento] = useState(false);

  const [errorAccion, setErrorAccion] = useState("");
  const [eliminandoEvento, setEliminandoEvento] = useState(false);
  const [confirmarEliminarEvento, setConfirmarEliminarEvento] = useState(false);
  const [subtareaAEliminar, setSubtareaAEliminar] = useState(null);
  const [eliminandoSubtarea, setEliminandoSubtarea] = useState(false);

  const [gestionAccion, setGestionAccion] = useState(null);
  const [notaPosponer, setNotaPosponer] = useState("");
  const [fechaReactivar, setFechaReactivar] = useState("");
  const [guardandoAccion, setGuardandoAccion] = useState(false);
  const [mensajeAccion, setMensajeAccion] = useState("");

  const erroresSubtareas = location.state?.erroresSubtareas;

  useEffect(() => {
    const obtenerEvento = async () => {
      try {
        const respuesta = await fetch(`${API_URL}/eventos/${id}/`, {
          headers: getAuthHeaders(),
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
          setError(
            "No encontramos este evento. Puede que ya no exista o que no sea tuyo."
          );
          return;
        }

        setEvento(datos);
      } catch (err) {
        console.error(err);
        setError(
          "No pudimos cargar el evento. Revisa tu conexión e intenta de nuevo."
        );
      }
    };

    obtenerEvento();
  }, [id]);

  useEffect(() => {
    const tecla = (e) => {
      if (e.key !== "Escape") return;
      if (guardandoAccion || eliminandoEvento || eliminandoSubtarea) return;
      if (gestionAccion) {
        setGestionAccion(null);
        setNotaPosponer("");
        setFechaReactivar("");
        setMensajeAccion("");
      }
      if (confirmarEliminarEvento) {
        setConfirmarEliminarEvento(false);
      }
      if (subtareaAEliminar) {
        setSubtareaAEliminar(null);
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [
    gestionAccion,
    guardandoAccion,
    confirmarEliminarEvento,
    subtareaAEliminar,
    eliminandoEvento,
    eliminandoSubtarea,
  ]);

  const iniciarEdicion = () => {
    setForm({
      nombre: evento.nombre || "",
      tipo: evento.tipo || "",
      cliente: evento.cliente || "",
      fecha_hora: aDateTimeLocal(evento.fecha_hora),
      lugar: evento.lugar || "",
      plazo_limite: evento.plazo_limite || "",
    });
    setErroresEdit({});
    setExitoMsg("");
    setEditando(true);
  };

  const cancelarEdicion = () => {
    setEditando(false);
    setErroresEdit({});
  };

  const manejarCambioEdit = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (erroresEdit[e.target.name]) {
      setErroresEdit({ ...erroresEdit, [e.target.name]: undefined });
    }
  };

  const validarEdicion = () => {
    const errores = {};
    if (!esTextoValido(form.nombre)) {
      errores.nombre =
        "Escribe un nombre real para el evento (mínimo 3 caracteres, con letras).";
    }
    if (!esTextoValido(form.tipo)) {
      errores.tipo = "Indica un tipo de evento válido (ej. Boda, Cumpleaños).";
    }
    if (!esTextoValido(form.cliente)) {
      errores.cliente =
        "Escribe el nombre real del cliente (mínimo 3 caracteres).";
    }
    if (!form.fecha_hora) {
      errores.fecha_hora = "La fecha y hora del evento son obligatorias.";
    } else if (!esAnioRazonable(form.fecha_hora)) {
      errores.fecha_hora = `El año del evento no puede ser mayor a ${ANIO_MAXIMO}.`;
    } else if (!esFechaFutura(form.fecha_hora)) {
      errores.fecha_hora = "La fecha y hora del evento deben ser futuras.";
    }
    if (!esTextoValido(form.lugar)) {
      errores.lugar =
        "Escribe un lugar válido (mínimo 3 caracteres, con letras).";
    }
    if (!form.plazo_limite) {
      errores.plazo_limite = "El plazo límite es obligatorio.";
    } else if (!esAnioRazonable(form.plazo_limite)) {
      errores.plazo_limite = `El año del plazo límite no puede ser mayor a ${ANIO_MAXIMO}.`;
    } else if (!esFechaFutura(form.plazo_limite)) {
      errores.plazo_limite = "El plazo límite debe ser hoy o una fecha futura.";
    } else if (
      form.fecha_hora &&
      form.plazo_limite > form.fecha_hora.slice(0, 10)
    ) {
      errores.plazo_limite =
        "El plazo límite no puede ser después de la fecha del evento.";
    }
    return errores;
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    setExitoMsg("");

    const errores = validarEdicion();
    setErroresEdit(errores);
    if (Object.keys(errores).length > 0) {
      enfocarPrimerError(".pagina-formulario");
      return;
    }

    setGuardando(true);
    try {
      const respuesta = await fetch(`${API_URL}/eventos/${id}/`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...form,
          fecha_hora: new Date(form.fecha_hora).toISOString(),
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        const normalizados = normalizarErroresBackend(datos);
        setErroresEdit({
          ...normalizados.campos,
          general:
            normalizados.general ||
            resumenErrores(normalizados) ||
            undefined,
        });
        setGuardando(false);
        enfocarPrimerError(".pagina-formulario");
        return;
      }

      setEvento(datos);
      setEditando(false);
      avisarCambioDatos();
      setExitoMsg("Listo. Guardamos los cambios del evento.");
    } catch (err) {
      console.error(err);
      setErroresEdit({
        general:
          "No pudimos guardar el cambio. Intenta de nuevo en unos segundos.",
      });
    }
    setGuardando(false);
  };

  const iniciarEdicionSubtarea = (subtarea) => {
    setSubtareaEditando(subtarea.id);
    setFormSubtarea({
      nombre: subtarea.nombre || "",
      plazo: subtarea.plazo || "",
      horas_estimadas: subtarea.horas_estimadas ?? 2,
    });
    setErrorSubtarea("");
    setErrorAccion("");
  };

  const cancelarEdicionSubtarea = () => {
    setSubtareaEditando(null);
    setErrorSubtarea("");
    setConflictoFechaEvento(null);
  };

  const manejarCambioSubtarea = (e) => {
    setFormSubtarea({
      ...formSubtarea,
      [e.target.name]: e.target.value,
    });
  };

  const guardarSubtarea = async (e, subtareaId, { omitirFechaEvento = false } = {}) => {
    e.preventDefault();
    setErrorSubtarea("");

    if (!esTextoValido(formSubtarea.nombre)) {
      setErrorSubtarea(
        "El nombre debe tener al menos 3 caracteres e incluir letras."
      );
      return;
    }

    if (!formSubtarea.plazo) {
      setErrorSubtarea("Selecciona un plazo.");
      return;
    }

    if (
      !Number.isInteger(Number(formSubtarea.horas_estimadas)) ||
      Number(formSubtarea.horas_estimadas) < 1 ||
      Number(formSubtarea.horas_estimadas) > HORAS_MAX
    ) {
      setErrorSubtarea(
        `Las horas deben ser un número entero entre 1 y ${HORAS_MAX}.`
      );
      return;
    }

    const fechaEv = fechaEventoISO(evento);
    if (!omitirFechaEvento && fechaEv && formSubtarea.plazo > fechaEv) {
      setConflictoFechaEvento({ plazo: formSubtarea.plazo, origen: "edicion" });
      return;
    }
    setConflictoFechaEvento(null);

    setGuardandoSubtarea(true);

    try {
      const respuesta = await fetch(`${API_URL}/subtareas/${subtareaId}/`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          nombre: formSubtarea.nombre.trim(),
          plazo: formSubtarea.plazo,
          horas_estimadas: Number(formSubtarea.horas_estimadas),
        }),
      });

      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        if (datos.conflicto && datos.mensaje) {
          setErrorSubtarea(datos.mensaje);
          setGuardandoSubtarea(false);
          return;
        }

        const normalizados = normalizarErroresBackend(datos);
        setErrorSubtarea(
          normalizados.general ||
            resumenErrores(normalizados) ||
            "No pudimos guardar la gestión. Revisa los datos."
        );
        setGuardandoSubtarea(false);
        return;
      }

      setEvento((anterior) => ({
        ...anterior,
        subtareas: anterior.subtareas
          .map((s) => (s.id === subtareaId ? datos : s))
          .sort((a, b) => a.plazo.localeCompare(b.plazo)),
      }));

      setSubtareaEditando(null);
      avisarCambioDatos();
      setExitoMsg("La gestión se actualizó.");
    } catch (err) {
      console.error(err);
      setErrorSubtarea(
        "No pudimos guardar el cambio. Intenta de nuevo en unos segundos."
      );
    } finally {
      setGuardandoSubtarea(false);
    }
  };

  const cambiarFila = (clave, campo, valor) => {
    setFilasNuevas((filas) =>
      filas.map((f) => (f.clave === clave ? { ...f, [campo]: valor, error: "" } : f))
    );
    setErrorNuevaSubtarea("");
    setConflictoFechaEvento(null);
  };

  const agregarFila = () => {
    setFilasNuevas((filas) => [...filas, filaVacia()]);
  };

  const quitarFila = (clave) => {
    setFilasNuevas((filas) =>
      filas.length === 1 ? filas : filas.filter((f) => f.clave !== clave)
    );
  };

  // Valida una fila; devuelve el mensaje de error o "".
  const errorDeFila = (fila) => {
    if (!esTextoValido(fila.nombre)) {
      return "Escribe un nombre de al menos 3 caracteres.";
    }
    if (!fila.plazo) return "Elige el plazo.";
    if (fila.plazo < hoyISOLocal()) return "El plazo no puede ser una fecha pasada.";
    const horas = Number(fila.horas_estimadas);
    if (!Number.isInteger(horas) || horas < 1 || horas > HORAS_MAX) {
      return `Las horas deben ser un número entero entre 1 y ${HORAS_MAX}.`;
    }
    return "";
  };

  // Guarda todas las filas de una vez (sin confirmar una por una).
  // Las que fallen quedan en el formulario con su error; las demás se guardan.
  const crearNuevasSubtareas = async (e, { omitirFechaEvento = false } = {}) => {
    e?.preventDefault?.();
    setErrorNuevaSubtarea("");

    const revisadas = filasNuevas.map((f) => ({ ...f, error: errorDeFila(f) }));
    if (revisadas.some((f) => f.error)) {
      setFilasNuevas(revisadas);
      setErrorNuevaSubtarea("Revisa las filas marcadas antes de guardar.");
      return;
    }

    const fechaEv = fechaEventoISO(evento);
    const plazoMaximo = revisadas.map((f) => f.plazo).sort().at(-1);
    if (!omitirFechaEvento && fechaEv && plazoMaximo > fechaEv) {
      setConflictoFechaEvento({ plazo: plazoMaximo, origen: "nuevas" });
      return;
    }
    setConflictoFechaEvento(null);

    setGuardandoNuevaSubtarea(true);
    const guardadas = [];
    const pendientes = [];

    for (const fila of revisadas) {
      try {
        const respuesta = await fetch(`${API_URL}/eventos/${id}/subtareas/`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            nombre: fila.nombre.trim(),
            plazo: fila.plazo,
            horas_estimadas: Number(fila.horas_estimadas),
          }),
        });
        const datos = await respuesta.json().catch(() => ({}));

        if (!respuesta.ok) {
          const mensaje =
            datos.mensaje ||
            datos.detail ||
            datos.error ||
            resumenErrores(normalizarErroresBackend(datos)) ||
            "No pudimos guardar esta gestión.";
          pendientes.push({ ...fila, error: mensaje });
        } else {
          guardadas.push(datos);
        }
      } catch {
        pendientes.push({ ...fila, error: "Sin conexión. Intenta de nuevo." });
      }
    }

    if (guardadas.length > 0) {
      setEvento((anterior) => ({
        ...anterior,
        subtareas: [...(anterior.subtareas || []), ...guardadas].sort((a, b) =>
          a.plazo.localeCompare(b.plazo)
        ),
      }));
      avisarCambioDatos();
    }

    if (pendientes.length === 0) {
      setFilasNuevas([filaVacia()]);
      setMostrarFormularioSubtarea(false);
      setExitoMsg(
        guardadas.length === 1
          ? "Gestión agregada al plan."
          : `Agregamos ${guardadas.length} gestiones al plan.`
      );
    } else {
      setFilasNuevas(pendientes);
      setErrorNuevaSubtarea(
        guardadas.length > 0
          ? `Guardamos ${guardadas.length}; ${pendientes.length} quedaron abajo para corregir.`
          : "No pudimos guardar las gestiones. Revisa el motivo en cada fila."
      );
    }

    setGuardandoNuevaSubtarea(false);
  };

  // Acción rápida: mueve el día del evento (misma hora) al plazo de la gestión
  // y, ya movido, guarda lo que el organizador estaba intentando guardar.
  const moverFechaEventoYGuardar = async () => {
    if (!conflictoFechaEvento) return;
    const { plazo, origen } = conflictoFechaEvento;
    const actual = new Date(evento.fecha_hora);
    const p = (n) => String(n).padStart(2, "0");
    const hora = isNaN(actual.getTime())
      ? "12:00"
      : `${p(actual.getHours())}:${p(actual.getMinutes())}`;

    setMoviendoEvento(true);
    try {
      const respuesta = await fetch(`${API_URL}/eventos/${id}/`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          fecha_hora: new Date(`${plazo}T${hora}`).toISOString(),
        }),
      });
      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        const texto =
          resumenErrores(normalizarErroresBackend(datos)) ||
          "No pudimos mover la fecha del evento.";
        if (origen === "nuevas") setErrorNuevaSubtarea(texto);
        else setErrorSubtarea(texto);
        return;
      }

      setEvento((anterior) => ({ ...anterior, ...datos, subtareas: anterior.subtareas }));
      setConflictoFechaEvento(null);
      setExitoMsg(`Movimos el evento al ${fechaCorta(plazo)}.`);
      avisarCambioDatos();

      if (origen === "nuevas") {
        await crearNuevasSubtareas(null, { omitirFechaEvento: true });
      } else if (subtareaEditando) {
        await guardarSubtarea({ preventDefault() {} }, subtareaEditando, {
          omitirFechaEvento: true,
        });
      }
    } catch {
      const texto = "No pudimos conectar con el servidor. Intenta de nuevo.";
      if (origen === "nuevas") setErrorNuevaSubtarea(texto);
      else setErrorSubtarea(texto);
    } finally {
      setMoviendoEvento(false);
    }
  };

  const pedirEliminarSubtarea = (subtarea) => {
    setErrorAccion("");
    setSubtareaAEliminar(subtarea);
  };

  const cancelarEliminarSubtarea = () => {
    if (eliminandoSubtarea) return;
    setSubtareaAEliminar(null);
  };

  const confirmarEliminarSubtarea = async () => {
    if (!subtareaAEliminar) return;

    setEliminandoSubtarea(true);
    setErrorAccion("");

    try {
      const respuesta = await fetch(
        `${API_URL}/subtareas/${subtareaAEliminar.id}/`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => ({}));
        setErrorAccion(
          datos.error ||
            datos.mensaje ||
            "No pudimos quitar esa gestión. Intenta de nuevo."
        );
        setEliminandoSubtarea(false);
        return;
      }

      const nombre = subtareaAEliminar.nombre;
      setEvento((anterior) => ({
        ...anterior,
        subtareas: anterior.subtareas.filter(
          (s) => s.id !== subtareaAEliminar.id
        ),
      }));

      if (subtareaEditando === subtareaAEliminar.id) {
        setSubtareaEditando(null);
      }

      setSubtareaAEliminar(null);
      avisarCambioDatos();
      setExitoMsg(`Quitamos "${nombre}" del plan logístico.`);
    } catch (err) {
      console.error(err);
      setErrorAccion(
        "No pudimos guardar el cambio. Intenta de nuevo en unos segundos."
      );
    } finally {
      setEliminandoSubtarea(false);
    }
  };

  const pedirEliminarEvento = () => {
    setErrorAccion("");
    setConfirmarEliminarEvento(true);
  };

  const cancelarEliminarEvento = () => {
    if (eliminandoEvento) return;
    setConfirmarEliminarEvento(false);
  };

  const confirmarEliminarEventoAhora = async () => {
    setEliminandoEvento(true);
    setErrorAccion("");

    try {
      const respuesta = await fetch(`${API_URL}/eventos/${id}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => ({}));
        setErrorAccion(
          datos.error ||
            datos.mensaje ||
            "No pudimos eliminar el evento. Intenta de nuevo."
        );
        setEliminandoEvento(false);
        setConfirmarEliminarEvento(false);
        return;
      }

      navigate("/eventos", {
        state: {
          mensaje: "Eliminamos el evento y todas sus gestiones.",
        },
      });
    } catch (err) {
      console.error(err);
      setErrorAccion(
        "No pudimos guardar el cambio. Intenta de nuevo en unos segundos."
      );
      setEliminandoEvento(false);
      setConfirmarEliminarEvento(false);
    }
  };

  const abrirHecha = (subtarea) => {
    setGestionAccion({ subtarea, tipo: "hecha" });
    setNotaPosponer("");
    setFechaReactivar("");
    setMensajeAccion("");
  };

  const abrirPosponer = (subtarea) => {
    setGestionAccion({ subtarea, tipo: "posponer" });
    setNotaPosponer("");
    setFechaReactivar("");
    setMensajeAccion("");
  };

  const abrirReactivar = (subtarea) => {
    const hoy = hoyISOLocal();
    const fechaEv = fechaEventoISO(evento);
    let sugerida = hoy;
    if (subtarea.plazo && subtarea.plazo >= hoy) {
      sugerida = subtarea.plazo;
    }
    if (fechaEv && sugerida > fechaEv) {
      sugerida = hoy <= fechaEv ? hoy : fechaEv;
    }
    setGestionAccion({ subtarea, tipo: "reactivar" });
    setNotaPosponer("");
    setFechaReactivar(sugerida);
    setMensajeAccion("");
  };

  const cerrarAccion = () => {
    if (guardandoAccion) return;
    setGestionAccion(null);
    setNotaPosponer("");
    setFechaReactivar("");
    setMensajeAccion("");
  };

  const validarFechaReactivar = (fecha) => {
    if (!fecha) return "Elige la fecha en la que quieres retomar esta gestión.";
    const hoy = hoyISOLocal();
    if (fecha < hoy) {
      return "La fecha debe ser hoy o un día futuro. No se permiten fechas pasadas.";
    }
    if (!esAnioRazonable(fecha)) {
      return `El año no puede ser mayor a ${ANIO_MAXIMO}.`;
    }
    const fechaEv = fechaEventoISO(evento);
    if (fechaEv && fecha > fechaEv) {
      return "La fecha no puede ser después del día del evento.";
    }
    if (evento?.plazo_limite && fecha > evento.plazo_limite) {
      return "La fecha no puede pasar el plazo límite del evento.";
    }
    return "";
  };

  const confirmarAccion = async (e) => {
    e?.preventDefault?.();
    if (!gestionAccion) return;

    const { subtarea, tipo } = gestionAccion;

    if (tipo === "reactivar") {
      const errorFecha = validarFechaReactivar(fechaReactivar);
      if (errorFecha) {
        setMensajeAccion(errorFecha);
        return;
      }
    }

    setGuardandoAccion(true);
    setMensajeAccion("");

    const body =
      tipo === "hecha"
        ? { estado: "completada" }
        : tipo === "reactivar"
          ? { estado: "pendiente", plazo: fechaReactivar, nota: "" }
          : {
              estado: "pospuesta",
              ...((notaPosponer || "").trim()
                ? { nota: notaPosponer.trim() }
                : {}),
            };

    try {
      const respuesta = await fetch(`${API_URL}/subtareas/${subtarea.id}/`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });

      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        setMensajeAccion(
          datos.mensaje ||
            datos.detail ||
            datos.error ||
            (typeof datos.estado === "string"
              ? datos.estado
              : Array.isArray(datos.estado)
                ? datos.estado.join(" ")
                : null) ||
            (tipo === "hecha"
              ? "No pudimos marcarla como hecha. Intenta de nuevo."
              : tipo === "reactivar"
                ? "No pudimos reactivarla. Revisa la fecha e intenta de nuevo."
                : "No pudimos posponerla. Intenta de nuevo.")
        );
        setGuardandoAccion(false);
        return;
      }

      const actualizada = {
        ...subtarea,
        ...datos,
        estado:
          datos.estado ||
          (tipo === "reactivar"
            ? "pendiente"
            : tipo === "hecha"
              ? "completada"
              : "pospuesta"),
        plazo:
          datos.plazo ||
          (tipo === "reactivar" ? fechaReactivar : subtarea.plazo),
        nota:
          tipo === "reactivar"
            ? datos.nota || ""
            : datos.nota !== undefined
              ? datos.nota
              : subtarea.nota,
      };

      setEvento((anterior) => ({
        ...anterior,
        subtareas: anterior.subtareas
          .map((s) => (s.id === subtarea.id ? actualizada : s))
          .sort((a, b) => String(a.plazo).localeCompare(String(b.plazo))),
      }));

      const fechaLegible = formatearSoloFecha(fechaReactivar);
      avisarCambioDatos();
      setGestionAccion(null);
      setNotaPosponer("");
      setFechaReactivar("");
      setMensajeAccion("");
      setExitoMsg(
        tipo === "hecha"
          ? `Listo. "${subtarea.nombre}" quedó hecha y suma al avance del evento.`
          : tipo === "reactivar"
            ? `Reactivada. "${subtarea.nombre}" vuelve al plan para el ${fechaLegible}.`
            : (notaPosponer || "").trim()
              ? `Pospuesta. "${subtarea.nombre}" quedó con nota.`
              : `Pospuesta. "${subtarea.nombre}" ya no cuenta como pendiente.`
      );
    } catch (err) {
      console.error(err);
      setMensajeAccion(
        "No pudimos guardar el cambio. Intenta de nuevo en unos segundos."
      );
    }

    setGuardandoAccion(false);
  };

  if (error) {
    return (
      <div className="pagina pagina-oscura">
        <Header />
        <main id="contenido" tabIndex={-1} className="contenedor contenedor-estrecho pagina-formulario">
          <p className="alerta alerta-error">
            <IconoError /> {error}
          </p>
          <Link to="/crear" className="enlace-secundario">
            ← Volver a crear evento
          </Link>
        </main>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="pagina pagina-oscura">
        <Header />
        <main id="contenido" tabIndex={-1} className="contenedor contenedor-estrecho pagina-formulario">
          <p className="alerta alerta-carga" role="status" aria-live="polite">
            <span className="spinner" aria-hidden="true" /> Cargando el evento...
          </p>
        </main>
      </div>
    );
  }

  const progreso = calcularProgreso(evento.subtareas || []);
  const hoy = hoyISOLocal();
  const topeAnio = `${ANIO_MAXIMO}-12-31`;
  const fechaEv = fechaEventoISO(evento);
  const maxReactivar = fechaEv && fechaEv < topeAnio ? fechaEv : topeAnio;

  return (
    <div className="pagina pagina-oscura">
      <Header />

      <main id="contenido" tabIndex={-1} className="contenedor contenedor-estrecho pagina-formulario">
        {erroresSubtareas?.length > 0 && (
          <div className="alerta-limite-horas" role="alert">
            <div className="alerta-limite-encabezado">
              <IconoError />
              <div>
                <strong>
                  El evento se creó, pero{" "}
                  {erroresSubtareas.length === 1
                    ? "una gestión no pudo guardarse."
                    : `${erroresSubtareas.length} gestiones no pudieron guardarse.`}
                </strong>
                <p>
                  Las gestiones que exceden tu límite diario no se guardaron.
                </p>
              </div>
            </div>

            {erroresSubtareas.map((errItem, i) => {
              const detalle = errItem.detalle;

              if (!detalle) {
                return <p key={i}>{errItem.mensaje}</p>;
              }

              const fecha = detalle.fecha
                ? new Date(`${detalle.fecha}T12:00:00`).toLocaleDateString(
                    "es-CO",
                    {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    }
                  )
                : "";

              const exceso =
                Number(detalle.horasTotales) - Number(detalle.limiteHoras);

              return (
                <div className="limite-detalle" key={i}>
                  <div className="limite-info">
                    <p className="limite-nombre">
                      La gestión <strong>«{detalle.nombre}»</strong> supera el
                      límite diario.
                    </p>

                    {fecha && (
                      <p className="limite-fecha">
                        DETALLE DEL {fecha.toLocaleUpperCase("es-CO")}
                      </p>
                    )}

                    <div className="limite-metricas">
                      <div className="limite-metrica">
                        <span>Horas asignadas</span>
                        <strong>{detalle.horasExistentes} h</strong>
                      </div>

                      <div className="limite-metrica">
                        <span>Esta gestión</span>
                        <strong>+{detalle.horasNuevas} h</strong>
                      </div>

                      <div className="limite-metrica">
                        <span>Total resultante</span>
                        <strong>{detalle.horasTotales} h</strong>
                      </div>

                      <div className="limite-metrica limite-metrica-maximo">
                        <span>Límite diario</span>
                        <strong>{detalle.limiteHoras} h</strong>
                      </div>
                    </div>

                    {exceso > 0 && (
                      <p className="limite-exceso">
                        Te excedes por {exceso}{" "}
                        {exceso === 1 ? "hora" : "horas"}.
                      </p>
                    )}
                  </div>

                  <div className="limite-solucion">
                    <strong>¿Cómo solucionarlo?</strong>
                    <p>
                      Reduce la duración de esta gestión o cambia su fecha a un
                      día con disponibilidad.
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {exitoMsg && (
          <p className="alerta alerta-exito" role="status">
            <IconoExito /> {exitoMsg}
          </p>
        )}

        {errorAccion && (
          <p className="alerta alerta-error" role="alert">
            <IconoError /> {errorAccion}
          </p>
        )}

        <div className="tarjeta evento-header">
          {editando ? (
            <form onSubmit={guardarEdicion} noValidate>
              <div className="evento-header-top">
                <h1>Editar evento</h1>
              </div>
              <p className="texto-ayuda" style={{ marginBottom: "1.1rem" }}>
                Corrige lo que necesites y guarda los cambios.
              </p>

              {erroresEdit.general && (
                <p className="alerta alerta-error" role="alert">
                  <IconoError /> {erroresEdit.general}
                </p>
              )}

              <div className="editar-grid">
                <div className="campo campo-full">
                  <label htmlFor="edit-nombre">Nombre del evento</label>
                  <input
                    id="edit-nombre"
                    type="text"
                    name="nombre"
                    value={form.nombre}
                    onChange={manejarCambioEdit}
                    aria-invalid={!!erroresEdit.nombre}
                    aria-describedby={erroresEdit.nombre ? "edit-nombre-error" : undefined}
                    disabled={guardando}
                  />
                  {erroresEdit.nombre && (
                    <span className="error-campo" id="edit-nombre-error">
                      <IconoError /> {erroresEdit.nombre}
                    </span>
                  )}
                </div>

                <div className="campo">
                  <label htmlFor="edit-tipo">Tipo de evento</label>
                  <input
                    id="edit-tipo"
                    type="text"
                    name="tipo"
                    value={form.tipo}
                    onChange={manejarCambioEdit}
                    aria-invalid={!!erroresEdit.tipo}
                    aria-describedby={erroresEdit.tipo ? "edit-tipo-error" : undefined}
                    disabled={guardando}
                  />
                  {erroresEdit.tipo && (
                    <span className="error-campo" id="edit-tipo-error">
                      <IconoError /> {erroresEdit.tipo}
                    </span>
                  )}
                </div>

                <div className="campo">
                  <label htmlFor="edit-cliente">Cliente</label>
                  <input
                    id="edit-cliente"
                    type="text"
                    name="cliente"
                    value={form.cliente}
                    onChange={manejarCambioEdit}
                    aria-invalid={!!erroresEdit.cliente}
                    aria-describedby={erroresEdit.cliente ? "edit-cliente-error" : "edit-cliente-ayuda"}
                    placeholder="Persona o empresa que te contrata"
                    disabled={guardando}
                  />
                  {erroresEdit.cliente ? (
                    <span className="error-campo" id="edit-cliente-error">
                      <IconoError /> {erroresEdit.cliente}
                    </span>
                  ) : (
                    <span className="texto-ayuda-campo" id="edit-cliente-ayuda">
                      Quien contrata el evento, no tu nombre como organizador.
                    </span>
                  )}
                </div>

                <div className="campo">
                  <label htmlFor="edit-fecha">Fecha y hora del evento</label>
                  <input
                    id="edit-fecha"
                    type="datetime-local"
                    name="fecha_hora"
                    value={form.fecha_hora}
                    onChange={manejarCambioEdit}
                    min={ahoraLocalInput()}
                    max={dentroDeAniosInput(10)}
                    aria-invalid={!!erroresEdit.fecha_hora}
                    aria-describedby={erroresEdit.fecha_hora ? "edit-fecha-error" : undefined}
                    disabled={guardando}
                  />
                  {erroresEdit.fecha_hora && (
                    <span className="error-campo" id="edit-fecha-error">
                      <IconoError /> {erroresEdit.fecha_hora}
                    </span>
                  )}
                </div>

                <div className="campo">
                  <label htmlFor="edit-plazo">Plazo límite</label>
                  <input
                    id="edit-plazo"
                    type="date"
                    name="plazo_limite"
                    value={form.plazo_limite}
                    onChange={manejarCambioEdit}
                    min={new Date().toISOString().slice(0, 10)}
                    max={
                      form.fecha_hora
                        ? form.fecha_hora.slice(0, 10)
                        : undefined
                    }
                    aria-invalid={!!erroresEdit.plazo_limite}
                    aria-describedby={erroresEdit.plazo_limite ? "edit-plazo-error" : undefined}
                    disabled={guardando}
                  />
                  {erroresEdit.plazo_limite && (
                    <span className="error-campo" id="edit-plazo-error">
                      <IconoError /> {erroresEdit.plazo_limite}
                    </span>
                  )}
                </div>

                <div className="campo campo-full">
                  <label htmlFor="edit-lugar">Lugar</label>
                  <input
                    id="edit-lugar"
                    type="text"
                    name="lugar"
                    value={form.lugar}
                    onChange={manejarCambioEdit}
                    aria-invalid={!!erroresEdit.lugar}
                    aria-describedby={erroresEdit.lugar ? "edit-lugar-error" : undefined}
                    disabled={guardando}
                  />
                  {erroresEdit.lugar && (
                    <span className="error-campo" id="edit-lugar-error">
                      <IconoError /> {erroresEdit.lugar}
                    </span>
                  )}
                </div>
              </div>

              <div className="evento-acciones">
                <button type="submit" className="boton-edicion-violeta">
                  Guardar cambios
                </button>
                <button
                  type="button"
                  className="boton-edicion-violeta"
                  onClick={cancelarEdicion}
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="evento-header-top">
                <h1>{evento.nombre}</h1>
                <div className="evento-acciones">
                  <button
                    type="button"
                    className="boton-secundario"
                    onClick={iniciarEdicion}
                  >
                    <IconoLapiz /> Editar
                  </button>
                  <button
                    type="button"
                    className="boton-secundario"
                    onClick={pedirEliminarEvento}
                    disabled={eliminandoEvento}
                  >
                    {eliminandoEvento ? "Eliminando..." : "Eliminar evento"}
                  </button>
                </div>
              </div>

              <div className="detalle-grid">
                <div className="detalle-item">
                  <span className="detalle-label">Tipo</span>
                  <span className="detalle-valor">{evento.tipo}</span>
                </div>
                <div className="detalle-item">
                  <span className="detalle-label">Lugar</span>
                  <span className="detalle-valor">{evento.lugar}</span>
                </div>
                <div className="detalle-item">
                  <span className="detalle-label">Cliente</span>
                  <span className="detalle-valor">{evento.cliente}</span>
                </div>
                <div className="detalle-item">
                  <span className="detalle-label">Plazo límite</span>
                  <span className="detalle-valor">
                    {formatearSoloFecha(evento.plazo_limite)}
                  </span>
                </div>
                <div className="detalle-item detalle-fecha-evento">
                  <span className="detalle-label">Fecha del evento</span>
                  <span className="detalle-valor">
                    {formatearFecha(evento.fecha_hora)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="evento-barra-progreso">
          <div className="barra-progreso-bloque">
            <div className="barra-progreso-meta">
              <span>
                Preparación: {progreso.completadas} de {progreso.total}{" "}
                {progreso.total === 1 ? "gestión" : "gestiones"}
              </span>
              <strong>{progreso.porcentaje}%</strong>
            </div>
            <div
              className="barra-progreso-track"
              role="progressbar"
              aria-valuenow={progreso.porcentaje}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progreso ${progreso.porcentaje} por ciento`}
            >
              <div
                className="barra-progreso-fill"
                style={{ width: `${progreso.porcentaje}%` }}
                data-completo={progreso.porcentaje === 100 ? "true" : "false"}
              />
            </div>
          </div>
        </div>

        <div className="paso-encabezado">
          <h2>Plan logístico</h2>
        </div>
        <p className="texto-ayuda">
          {evento.subtareas.length === 0
            ? "Todavía no hay gestiones en este evento."
            : `${evento.subtareas.length} gestión(es) registrada(s), ordenadas por plazo.`}
        </p>

        <div className="nueva-subtarea-contenedor">
          <div className="acciones-subtareas">
            <Link
              to="/crear"
              className="boton-accion-subtarea"
              style={{ minWidth: "200px", justifyContent: "center" }}
            >
              <CalendarPlus size={18} />
              <span>Crear otro evento</span>
            </Link>

            <button
              type="button"
              className="boton-accion-subtarea"
              style={{ minWidth: "200px", justifyContent: "center" }}
              onClick={() => {
                setMostrarFormularioSubtarea((anterior) => !anterior);
                setErrorNuevaSubtarea("");
                setConflictoFechaEvento(null);
              }}
            >
              <ListPlus size={18} />
              <span>
                {mostrarFormularioSubtarea ? "Cancelar" : "Agregar gestiones"}
              </span>
            </button>
          </div>
        </div>

        {mostrarFormularioSubtarea && (
          <form
            className="formulario-nueva-subtarea"
            onSubmit={crearNuevasSubtareas}
            noValidate
          >
            <h3>Agregar gestiones</h3>
            <p className="texto-ayuda-campo">
              Escribe varias gestiones y guárdalas todas juntas. Las horas van de
              1 a {HORAS_MAX}.
            </p>

            {filasNuevas.map((fila, indice) => (
              <div
                className="fila-masiva"
                key={fila.clave}
                data-varias={filasNuevas.length > 1 ? "true" : "false"}
              >
                <div className="fila-nueva-subtarea">
                  <div className="campo-subtarea">
                    <label htmlFor={`nueva-nombre-${fila.clave}`}>
                      Gestión {indice + 1}
                    </label>
                    <input
                      id={`nueva-nombre-${fila.clave}`}
                      type="text"
                      value={fila.nombre}
                      onChange={(e) => cambiarFila(fila.clave, "nombre", e.target.value)}
                      placeholder="Ej. Confirmar invitados"
                      aria-invalid={!!fila.error}
                      aria-describedby={fila.error ? `nueva-error-${fila.clave}` : undefined}
                      disabled={guardandoNuevaSubtarea}
                    />
                  </div>

                  <div className="campo-subtarea">
                    <label htmlFor={`nueva-plazo-${fila.clave}`}>Plazo</label>
                    <input
                      id={`nueva-plazo-${fila.clave}`}
                      type="date"
                      value={fila.plazo}
                      min={hoyISOLocal()}
                      onChange={(e) => cambiarFila(fila.clave, "plazo", e.target.value)}
                      disabled={guardandoNuevaSubtarea}
                    />
                  </div>

                  <div className="campo-subtarea campo-horas">
                    <label htmlFor={`nueva-horas-${fila.clave}`}>Horas</label>
                    <input
                      id={`nueva-horas-${fila.clave}`}
                      type="number"
                      min="1"
                      max={HORAS_MAX}
                      step="1"
                      value={fila.horas_estimadas}
                      onChange={(e) =>
                        cambiarFila(fila.clave, "horas_estimadas", e.target.value)
                      }
                      disabled={guardandoNuevaSubtarea}
                    />
                  </div>

                  {filasNuevas.length > 1 && (
                    <button
                      type="button"
                      className="boton-quitar-fila"
                      onClick={() => quitarFila(fila.clave)}
                      disabled={guardandoNuevaSubtarea}
                      aria-label={`Quitar la fila ${indice + 1}`}
                    >
                      Quitar
                    </button>
                  )}
                </div>
                {fila.error && (
                  <span className="error-campo" id={`nueva-error-${fila.clave}`}>
                    <IconoError /> {fila.error}
                  </span>
                )}
              </div>
            ))}

            {conflictoFechaEvento?.origen === "nuevas" && (
              <AvisoFechaEvento
                fechaEvento={fechaEventoISO(evento)}
                plazoMaximo={conflictoFechaEvento.plazo}
                onMover={moverFechaEventoYGuardar}
                moviendo={moviendoEvento}
              />
            )}

            {errorNuevaSubtarea && (
              <p className="alerta alerta-error" role="alert">
                <IconoError /> {errorNuevaSubtarea}
              </p>
            )}

            <div className="acciones-nueva-subtarea acciones-masivas">
              <button
                type="button"
                className="boton-secundario"
                onClick={agregarFila}
                disabled={guardandoNuevaSubtarea}
              >
                + Otra gestión
              </button>
              <button
                type="submit"
                className="boton-principal"
                disabled={guardandoNuevaSubtarea}
              >
                {guardandoNuevaSubtarea
                  ? "Guardando..."
                  : filasNuevas.length === 1
                    ? "Guardar gestión"
                    : `Guardar ${filasNuevas.length} gestiones`}
              </button>
            </div>
          </form>
        )}

        {evento.subtareas.length === 0 ? (
          <p className="estado-vacio">
            Todavía no hay gestiones. Agrega una (salón, catering, invitaciones)
            para medir el avance.
          </p>
        ) : (
          <div className="lista-gestiones">
            {evento.subtareas.map((subtarea) => (
              <div
                key={subtarea.id}
                className="gestion-tarjeta"
                data-estado={subtarea.estado}
                data-semaforo={semaforoGestion(subtarea).color}
              >
                {subtareaEditando === subtarea.id ? (
                  <form
                    className="gestion-info"
                    onSubmit={(e) => guardarSubtarea(e, subtarea.id)}
                  >
                    <h3>Editar gestión</h3>

                    {errorSubtarea && (
                      <p
                        className="alerta alerta-error"
                        role="alert"
                        style={{ whiteSpace: "pre-line" }}
                      >
                        <IconoError /> {errorSubtarea}
                      </p>
                    )}

                    {conflictoFechaEvento?.origen === "edicion" && (
                      <AvisoFechaEvento
                        fechaEvento={fechaEventoISO(evento)}
                        plazoMaximo={conflictoFechaEvento.plazo}
                        onMover={moverFechaEventoYGuardar}
                        moviendo={moviendoEvento}
                      />
                    )}

                    <div className="campo">
                      <label htmlFor={`nombre-${subtarea.id}`}>Nombre</label>
                      <input
                        id={`nombre-${subtarea.id}`}
                        name="nombre"
                        value={formSubtarea.nombre}
                        onChange={manejarCambioSubtarea}
                        disabled={guardandoSubtarea}
                        required
                      />
                    </div>

                    <div className="campo">
                      <label htmlFor={`plazo-${subtarea.id}`}>Plazo</label>
                      <input
                        id={`plazo-${subtarea.id}`}
                        type="date"
                        name="plazo"
                        value={formSubtarea.plazo}
                        onChange={manejarCambioSubtarea}
                        disabled={guardandoSubtarea}
                        required
                      />
                    </div>

                    <div className="campo">
                      <label htmlFor={`horas-${subtarea.id}`}>
                        Horas estimadas
                      </label>
                      <input
                        id={`horas-${subtarea.id}`}
                        type="number"
                        name="horas_estimadas"
                        min="1"
                        max={HORAS_MAX}
                        step="1"
                        value={formSubtarea.horas_estimadas}
                        onChange={manejarCambioSubtarea}
                        disabled={guardandoSubtarea}
                        required
                      />
                    </div>

                    <div className="evento-acciones">
                      <button
                        type="submit"
                        className="boton-principal"
                        disabled={guardandoSubtarea}
                      >
                        {guardandoSubtarea
                          ? "Guardando..."
                          : "Guardar cambios"}
                      </button>
                      <button
                        type="button"
                        className="boton-secundario"
                        onClick={cancelarEdicionSubtarea}
                        disabled={guardandoSubtarea}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="gestion-info">
                      <h3>{subtarea.nombre}</h3>
                      <div className="gestion-meta">
                        <span>Plazo: {formatearSoloFecha(subtarea.plazo)}</span>
                        <span>{subtarea.horas_estimadas} h estimadas</span>
                        {subtarea.nota ? (
                          <span
                            style={{ display: "block", marginTop: "0.25rem" }}
                          >
                            Nota: {subtarea.nota}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <span
                      className="semaforo"
                      data-color={semaforoGestion(subtarea).color}
                    >
                      {semaforoGestion(subtarea).texto}
                    </span>

                    <div
                      className="evento-acciones"
                      style={{ flexWrap: "wrap" }}
                    >
                      {esPospuesta(subtarea.estado) ? (
                        <button
                          type="button"
                          className="boton-principal boton-reactivar"
                          onClick={() => abrirReactivar(subtarea)}
                          aria-label={`Reactivar la gestión ${subtarea.nombre}`}
                        >
                          Reactivar
                        </button>
                      ) : (
                        !esCompletada(subtarea.estado) && (
                          <>
                            <button
                              type="button"
                              className="boton-secundario"
                              onClick={() => abrirHecha(subtarea)}
                              aria-label={`Marcar como hecha la gestión ${subtarea.nombre}`}
                            >
                              Hecha
                            </button>
                            <button
                              type="button"
                              className="boton-secundario"
                              onClick={() => abrirPosponer(subtarea)}
                              aria-label={`Posponer la gestión ${subtarea.nombre}`}
                            >
                              Posponer
                            </button>
                          </>
                        )
                      )}
                      <button
                        type="button"
                        className="boton-secundario"
                        onClick={() => iniciarEdicionSubtarea(subtarea)}
                        aria-label={`Editar la gestión ${subtarea.nombre}`}
                      >
                        <IconoLapiz /> Editar
                      </button>
                      <button
                        type="button"
                        className="boton-secundario"
                        onClick={() => pedirEliminarSubtarea(subtarea)}
                        aria-label={`Eliminar la gestión ${subtarea.nombre}`}
                      >
                        Eliminar
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <div
          className="evento-volver-hoy"
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "2rem",
            marginBottom: "0.5rem",
          }}
        >
          <Link to="/hoy" className="boton-accion-subtarea">
            Volver a hoy
          </Link>
        </div>
      </main>

      {gestionAccion && (
        <div
          className="modal-fondo"
          onMouseDown={cerrarAccion}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            className="modal"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="accion-evento-titulo"
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "1.5rem",
              maxWidth: "420px",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div>
                <h2 id="accion-evento-titulo" style={{ margin: 0, fontSize: "1.25rem" }}>
                  {gestionAccion.tipo === "hecha"
                    ? "Marcar como hecha"
                    : gestionAccion.tipo === "reactivar"
                      ? "Reactivar gestión"
                      : "Posponer gestión"}
                </h2>
                <p style={{ margin: "0.35rem 0 0", color: "#64748b" }}>
                  {gestionAccion.tipo === "hecha"
                    ? `¿Ya terminaste "${gestionAccion.subtarea.nombre}"? Al confirmar, suma al avance del evento.`
                    : gestionAccion.tipo === "reactivar"
                      ? `¿Reactivar "${gestionAccion.subtarea.nombre}"? Elige hoy o una fecha futura.`
                      : `Vas a posponer "${gestionAccion.subtarea.nombre}". Deja de contar como pendiente urgente. Puedes anotar por qué.`}
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarAccion}
                disabled={guardandoAccion}
                aria-label="Cerrar"
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "1.25rem",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={confirmarAccion} noValidate>
              {gestionAccion.tipo === "posponer" && (
                <div className="campo" style={{ marginBottom: "1rem" }}>
                  <label htmlFor="nota-posponer-evento">Nota (opcional)</label>
                  <textarea
                    id="nota-posponer-evento"
                    rows={3}
                    value={notaPosponer}
                    onChange={(e) => {
                      setNotaPosponer(e.target.value);
                      setMensajeAccion("");
                    }}
                    placeholder="Ej. Esperando confirmación del salón"
                    disabled={guardandoAccion}
                    maxLength={300}
                    style={{
                      width: "100%",
                      borderRadius: "10px",
                      padding: "0.6rem",
                    }}
                  />
                  <span className="texto-ayuda-campo">
                    Queda visible aquí para que recuerdes el motivo (máx. 300
                    caracteres).
                  </span>
                </div>
              )}

              {gestionAccion.tipo === "reactivar" && (
                <div className="campo" style={{ marginBottom: "1rem" }}>
                  <label htmlFor="fecha-reactivar">
                    ¿Para qué fecha la retomas?
                  </label>
                  <input
                    id="fecha-reactivar"
                    type="date"
                    value={fechaReactivar}
                    min={hoy}
                    max={maxReactivar}
                    onChange={(e) => {
                      setFechaReactivar(e.target.value);
                      setMensajeAccion("");
                    }}
                    disabled={guardandoAccion}
                    required
                    style={{
                      width: "100%",
                      borderRadius: "10px",
                      padding: "0.6rem",
                    }}
                  />
                  <span className="texto-ayuda-campo">
                    Solo hoy o fechas futuras, hasta el día del evento y sin
                    pasar el año {ANIO_MAXIMO}.
                  </span>
                </div>
              )}

              {mensajeAccion && (
                <p className="alerta alerta-error" role="alert">
                  <IconoError /> {mensajeAccion}
                </p>
              )}

              <div
                style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}
              >
                <button
                  type="submit"
                  className="boton-principal"
                  disabled={guardandoAccion}
                  style={{ flex: 1 }}
                >
                  {guardandoAccion
                    ? "Guardando..."
                    : gestionAccion.tipo === "hecha"
                      ? "Sí, ya está hecha"
                      : gestionAccion.tipo === "reactivar"
                        ? "Sí, reactivar"
                        : "Posponer"}
                </button>
                <button
                  type="button"
                  className="boton-secundario"
                  onClick={cerrarAccion}
                  disabled={guardandoAccion}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmarEliminarEvento && (
        <div
          className="modal-fondo"
          onMouseDown={cancelarEliminarEvento}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            className="modal"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="eliminar-evento-titulo"
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "1.5rem",
              maxWidth: "420px",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div>
                <h2
                  id="eliminar-evento-titulo"
                  style={{ margin: 0, fontSize: "1.25rem" }}
                >
                  Eliminar evento
                </h2>
                <p style={{ margin: "0.35rem 0 0", color: "#64748b" }}>
                  ¿Seguro que quieres eliminar{" "}
                  <strong>&quot;{evento.nombre}&quot;</strong>? También se
                  eliminarán todas sus gestiones del plan. Esta acción no se
                  puede deshacer.
                </p>
              </div>
              <button
                type="button"
                onClick={cancelarEliminarEvento}
                disabled={eliminandoEvento}
                aria-label="Cerrar"
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "1.25rem",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {errorAccion && (
              <p className="alerta alerta-error" role="alert">
                <IconoError /> {errorAccion}
              </p>
            )}

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className="boton-principal"
                onClick={confirmarEliminarEventoAhora}
                disabled={eliminandoEvento}
                style={{ flex: 1 }}
              >
                {eliminandoEvento ? "Eliminando..." : "Sí, eliminar evento"}
              </button>
              <button
                type="button"
                className="boton-secundario"
                onClick={cancelarEliminarEvento}
                disabled={eliminandoEvento}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {subtareaAEliminar && (
        <div
          className="modal-fondo"
          onMouseDown={cancelarEliminarSubtarea}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            className="modal"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="eliminar-gestion-titulo"
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "1.5rem",
              maxWidth: "420px",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div>
                <h2
                  id="eliminar-gestion-titulo"
                  style={{ margin: 0, fontSize: "1.25rem" }}
                >
                  Quitar gestión del plan
                </h2>
                <p style={{ margin: "0.35rem 0 0", color: "#64748b" }}>
                  ¿Seguro que quieres quitar{" "}
                  <strong>&quot;{subtareaAEliminar.nombre}&quot;</strong> del
                  plan de este evento? Dejará de contar en el avance y en Hoy.
                  Esta acción no se puede deshacer.
                </p>
              </div>
              <button
                type="button"
                onClick={cancelarEliminarSubtarea}
                disabled={eliminandoSubtarea}
                aria-label="Cerrar"
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "1.25rem",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {errorAccion && (
              <p className="alerta alerta-error" role="alert">
                <IconoError /> {errorAccion}
              </p>
            )}

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className="boton-principal"
                onClick={confirmarEliminarSubtarea}
                disabled={eliminandoSubtarea}
                style={{ flex: 1 }}
              >
                {eliminandoSubtarea ? "Eliminando..." : "Sí, quitar gestión"}
              </button>
              <button
                type="button"
                className="boton-secundario"
                onClick={cancelarEliminarSubtarea}
                disabled={eliminandoSubtarea}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Evento;
