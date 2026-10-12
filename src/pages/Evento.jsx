
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
} from "../utils/validacion";
import "./formularios.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const ESTADO_LABEL = {
  PENDIENTE: "Pendiente",
  pendiente: "Pendiente",
  EJECUTADA: "Ejecutada",
  ejecutada: "Ejecutada",
  POSPUESTA: "Pospuesta",
  pospuesta: "Pospuesta",
};

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

// Convierte la fecha+hora que devuelve el backend (ISO con zona) al formato
// local "YYYY-MM-DDTHH:mm" que entiende el <input type="datetime-local">.
function aDateTimeLocal(valor) {
  if (!valor) return "";
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return "";
  const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
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


function Evento() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [evento, setEvento] = useState(null);
  const [error, setError] = useState("");

  // Modo edición del evento
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

  // Edición y eliminación de subtareas
const [subtareaEditando, setSubtareaEditando] = useState(null);
const [formSubtarea, setFormSubtarea] = useState({
  nombre: "",
  plazo: "",
  horas_estimadas: 2,
});
const [guardandoSubtarea, setGuardandoSubtarea] = useState(false);
const [errorSubtarea, setErrorSubtarea] = useState("");

const [mostrarFormularioSubtarea, setMostrarFormularioSubtarea] = useState(false);
// Estados para agregar subtareas nuevas
const [nuevaSubtarea, setNuevaSubtarea] = useState({
  nombre: "",
  plazo: "",
  horas_estimadas: 2,
});

const [guardandoNuevaSubtarea, setGuardandoNuevaSubtarea] = useState(false);
const [errorNuevaSubtarea, setErrorNuevaSubtarea] = useState("");

const [errorAccion, setErrorAccion] = useState("");
const [eliminandoEvento, setEliminandoEvento] = useState(false);

  // Si Crear.jsx redirigió aquí después de que alguna subtarea fallara al
  // guardarse, viene en location.state.erroresSubtareas.
  const erroresSubtareas = location.state?.erroresSubtareas;
  console.log("Errores recibidos en Evento.jsx:", erroresSubtareas);

  useEffect(() => {
    const obtenerEvento = async () => {
      try {
        const respuesta = await fetch(`${API_URL}/eventos/${id}/`, {
          headers: getAuthHeaders(), // ← envía el token
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
          setError("No encontramos este evento. Puede que haya sido eliminado o que no sea tuyo.");
          return;
        }

        setEvento(datos);
      } catch (error) {
        console.error(error);
        setError("No pudimos conectar con el backend. Verifica que esté encendido e intenta de nuevo.");
      }
    };

    obtenerEvento();
  }, [id]);

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
      errores.nombre = "Escribe un nombre real para el evento (mínimo 3 caracteres, con letras).";
    }
    if (!esTextoValido(form.tipo)) {
      errores.tipo = "Indica un tipo de evento válido (ej. Boda, Cumpleaños).";
    }
    if (!esTextoValido(form.cliente)) {
      errores.cliente = "Escribe el nombre real del cliente (mínimo 3 caracteres).";
    }
    if (!form.fecha_hora) {
      errores.fecha_hora = "La fecha y hora del evento son obligatorias.";
    } else if (!esAnioRazonable(form.fecha_hora)) {
      errores.fecha_hora = `El año del evento no puede ser mayor a ${ANIO_MAXIMO}.`;
    } else if (!esFechaFutura(form.fecha_hora)) {
      errores.fecha_hora = "La fecha y hora del evento deben ser futuras.";
    }
    if (!esTextoValido(form.lugar)) {
      errores.lugar = "Escribe un lugar válido (mínimo 3 caracteres, con letras).";
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
      errores.plazo_limite = "El plazo límite no puede ser después de la fecha del evento.";
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
        // La fecha se envía en UTC (ISO con Z) para no desplazar la hora en
        // cada guardado (el backend interpreta los valores naive como UTC).
        body: JSON.stringify({
          ...form,
          fecha_hora: new Date(form.fecha_hora).toISOString(),
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        // El backend devuelve errores por campo ({"campo": ["mensaje"]});
        // los convertimos en texto legible, junto a cada campo y en el resumen.
        const normalizados = normalizarErroresBackend(datos);
        setErroresEdit({
          ...normalizados.campos,
          general: normalizados.general || resumenErrores(normalizados) || undefined,
        });
        setGuardando(false);
        enfocarPrimerError(".pagina-formulario");
        return;
      }

      setEvento(datos);
      setEditando(false);
      setExitoMsg("¡Listo! Tus cambios se guardaron correctamente.");
    } catch (err) {
      console.error(err);
      setErroresEdit({
        general: "No pudimos conectar con el servidor. Intenta de nuevo en unos segundos.",
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
};

const manejarCambioSubtarea = (e) => {
  setFormSubtarea({
    ...formSubtarea,
    [e.target.name]: e.target.value,
  });
};

const guardarSubtarea = async (e, subtareaId) => {
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
    Number(formSubtarea.horas_estimadas) < 1
  ) {
    setErrorSubtarea("Las horas estimadas deben ser un número entero positivo.");
    return;
  }

  setGuardandoSubtarea(true);

  try {
    const respuesta = await fetch(
      `${API_URL}/subtareas/${subtareaId}/`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          nombre: formSubtarea.nombre.trim(),
          plazo: formSubtarea.plazo,
          horas_estimadas: Number(formSubtarea.horas_estimadas),
        }),
      }
    );

    const datos = await respuesta.json().catch(() => ({}));

    
  if (!respuesta.ok) {
  if (datos.conflicto && datos.mensaje) {
    setErrorSubtarea(datos.mensaje);
    return;
  }

  const normalizados = normalizarErroresBackend(datos);

  setErrorSubtarea(
    normalizados.general ||
      resumenErrores(normalizados) ||
      "No se pudo guardar la subtarea. Revisa los datos."
  );

  return;
}


    setEvento((anterior) => ({
      ...anterior,
      subtareas: anterior.subtareas
        .map((s) => (s.id === subtareaId ? datos : s))
        .sort((a, b) => a.plazo.localeCompare(b.plazo)),
    }));

    setSubtareaEditando(null);
    setExitoMsg("La subtarea se actualizó correctamente.");
  } catch (err) {
    console.error(err);
    setErrorSubtarea("No se pudo conectar con el servidor.");
  } finally {
    setGuardandoSubtarea(false);
  }
};



const crearNuevaSubtarea = async (e) => {
  e.preventDefault();
  setErrorNuevaSubtarea("");

  const nombre = nuevaSubtarea.nombre.trim();
  const plazo = nuevaSubtarea.plazo;
  const horas = Number(nuevaSubtarea.horas_estimadas);

  if (!nombre || !plazo || !Number.isFinite(horas) || horas <= 0) {
    setErrorNuevaSubtarea(
      "Completa todos los campos con valores válidos."
    );
    return;
  }

  try {
    setGuardandoNuevaSubtarea(true);

    const respuesta = await fetch(
      `${API_URL}/eventos/${id}/subtareas/`,
      {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          plazo,
          horas_estimadas: horas,
        }),
      }
    );

    const datos = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      setErrorNuevaSubtarea(
        datos.mensaje ||
        datos.detail ||
        datos.error ||
        Object.values(datos)
          .flat()
          .filter((valor) => typeof valor === "string")
          .join(" ") ||
        "No fue posible crear la subtarea."
      );
      return;
    }

    setEvento((anterior) => ({
      ...anterior,
      subtareas: [...(anterior.subtareas || []), datos].sort(
        (a, b) => a.plazo.localeCompare(b.plazo)
      ),
    }));

    setNuevaSubtarea({
      nombre: "",
      plazo: "",
      horas_estimadas: 2,
    });

setMostrarFormularioSubtarea(false);
setExitoMsg("¡Subtarea agregada correctamente!");

  } catch {
    setErrorNuevaSubtarea(
      "No se pudo conectar con el servidor."
    );
  } finally {
    setGuardandoNuevaSubtarea(false);
  }
};


const eliminarSubtarea = async (subtarea) => {
  const confirmar = window.confirm(
    `¿Seguro que quieres eliminar "${subtarea.nombre}"? Esta acción no se puede deshacer.`
  );

  if (!confirmar) return;

  setErrorAccion("");

  try {
    const respuesta = await fetch(
      `${API_URL}/subtareas/${subtarea.id}/`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );

    if (!respuesta.ok) {
      const datos = await respuesta.json().catch(() => ({}));
      setErrorAccion(
        datos.error || "No se pudo eliminar la subtarea."
      );
      return;
    }

    setEvento((anterior) => ({
      ...anterior,
      subtareas: anterior.subtareas.filter(
        (s) => s.id !== subtarea.id
      ),
    }));

    if (subtareaEditando === subtarea.id) {
      setSubtareaEditando(null);
    }

    setExitoMsg("La subtarea se eliminó correctamente.");
  } catch (err) {
    console.error(err);
    setErrorAccion("No se pudo conectar con el servidor.");
  }
};

const eliminarEvento = async () => {
  const confirmar = window.confirm(
    `¿Seguro que quieres eliminar "${evento.nombre}" y todas sus subtareas? Esta acción no se puede deshacer.`
  );

  if (!confirmar) return;

  setEliminandoEvento(true);
  setErrorAccion("");

  try {
    const respuesta = await fetch(
      `${API_URL}/eventos/${id}/`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );

    if (!respuesta.ok) {
      const datos = await respuesta.json().catch(() => ({}));
      setErrorAccion(
        datos.error || "No se pudo eliminar el evento."
      );
      setEliminandoEvento(false);
      return;
    }

    navigate("/eventos", {
      state: { mensaje: "El evento y sus subtareas se eliminaron correctamente." },
    });
  } catch (err) {
    console.error(err);
    setErrorAccion("No se pudo conectar con el servidor.");
  } finally {
    setEliminandoEvento(false);
  }
};


  if (error) {
    return (
      <div className="pagina pagina-oscura">
        <Header />
        <main className="contenedor contenedor-estrecho pagina-formulario">
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
        <main className="contenedor contenedor-estrecho pagina-formulario">
          <p className="alerta alerta-carga">
            <span className="spinner" /> Cargando evento...
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="pagina pagina-oscura">
      <Header />

      <main className="contenedor contenedor-estrecho pagina-formulario">
        
        
        
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

          {erroresSubtareas.map((error, i) => {
            const detalle = error.detalle;

            if (!detalle) {
              return <p key={i}>{error.mensaje}</p>;
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
                    La gestión <strong>«{detalle.nombre}»</strong> supera el límite
                    diario.
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
                      Te excedes por {exceso} {exceso === 1 ? "hora" : "horas"}.
                    </p>
                  )}
                </div>

                <div className="limite-solucion">
                  <strong>¿Cómo solucionarlo?</strong>
                  <p>
                    Reduce la duración de esta gestión o cambia su fecha a un día
                    con disponibilidad.
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}


        {exitoMsg && (
          <p className="alerta alerta-exito">
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
                Corrige lo que necesites y guarda los cambios. Todo es editable.
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
                    disabled={guardando}
                  />
                  {erroresEdit.nombre && (
                    <span className="error-campo"><IconoError /> {erroresEdit.nombre}</span>
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
                    disabled={guardando}
                  />
                  {erroresEdit.tipo && (
                    <span className="error-campo"><IconoError /> {erroresEdit.tipo}</span>
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
                    disabled={guardando}
                  />
                  {erroresEdit.cliente && (
                    <span className="error-campo"><IconoError /> {erroresEdit.cliente}</span>
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
                    disabled={guardando}
                  />
                  {erroresEdit.fecha_hora && (
                    <span className="error-campo"><IconoError /> {erroresEdit.fecha_hora}</span>
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
                    max={form.fecha_hora ? form.fecha_hora.slice(0, 10) : undefined}
                    aria-invalid={!!erroresEdit.plazo_limite}
                    disabled={guardando}
                  />
                  {erroresEdit.plazo_limite && (
                    <span className="error-campo"><IconoError /> {erroresEdit.plazo_limite}</span>
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
                    disabled={guardando}
                  />
                  {erroresEdit.lugar && (
                    <span className="error-campo"><IconoError /> {erroresEdit.lugar}</span>
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
                  onClick={eliminarEvento}
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

        <div className="paso-encabezado">
          <h2>Plan logístico</h2>
        </div>
        <p className="texto-ayuda">
          {evento.subtareas.length === 0
            ? "Todavía no tienes gestiones registradas para este evento."
            : `${evento.subtareas.length} gestión(es) registrada(s), ordenadas por plazo.`}
        </p>

        

              <div className="nueva-subtarea-contenedor">
                <div className="acciones-subtareas">
                  <Link to="/crear" className="boton-accion-subtarea">
                    <CalendarPlus size={18} />
                    <span>Crear otro evento</span>
                  </Link>

                  <button
                    type="button"
                    className="boton-accion-subtarea"
                    onClick={() => {
                      setMostrarFormularioSubtarea((anterior) => !anterior);
                      setErrorNuevaSubtarea("");
                    }}
                  >
                    <ListPlus size={18} />
                    <span>
                      {mostrarFormularioSubtarea
                        ? "Cancelar"
                        : "Agregar subtarea"}
                    </span>
                  </button>
                </div>
              </div>


          {mostrarFormularioSubtarea && (
            <form
              className="formulario-nueva-subtarea"
              onSubmit={crearNuevaSubtarea}
            >
              <h3>Agregar subtarea</h3>

              <div className="fila-nueva-subtarea">
                <div className="campo-subtarea">
                  <label htmlFor="nueva-subtarea-nombre">Nombre</label>
                  <input
                    id="nueva-subtarea-nombre"
                    type="text"
                    value={nuevaSubtarea.nombre}
                    onChange={(e) =>
                      setNuevaSubtarea((anterior) => ({
                        ...anterior,
                        nombre: e.target.value,
                      }))
                    }
                    placeholder="Ej. Confirmar invitados"
                    required
                    disabled={guardandoNuevaSubtarea}
                  />
                </div>

                <div className="campo-subtarea">
                  <label htmlFor="nueva-subtarea-plazo">Plazo</label>
                  <input
                    id="nueva-subtarea-plazo"
                    type="date"
                    value={nuevaSubtarea.plazo}
                    onChange={(e) =>
                      setNuevaSubtarea((anterior) => ({
                        ...anterior,
                        plazo: e.target.value,
                      }))
                    }
                    required
                    disabled={guardandoNuevaSubtarea}
                  />
                </div>

                <div className="campo-subtarea campo-horas">
                  <label htmlFor="nueva-subtarea-horas">
                    Horas estimadas
                  </label>
                  <input
                    id="nueva-subtarea-horas"
                    type="number"
                    min="1"
                    step="1"
                    value={nuevaSubtarea.horas_estimadas}
                    onChange={(e) =>
                      setNuevaSubtarea((anterior) => ({
                        ...anterior,
                        horas_estimadas: e.target.value,
                      }))
                    }
                    required
                    disabled={guardandoNuevaSubtarea}
                  />
                </div>
              </div>

              {errorNuevaSubtarea && (
                <p className="alerta alerta-error" role="alert">
                  <IconoError /> {errorNuevaSubtarea}
                </p>
              )}

              <div className="acciones-nueva-subtarea">
                <button
                  type="submit"
                  className="boton-principal"
                  disabled={guardandoNuevaSubtarea}
                >
                  {guardandoNuevaSubtarea
                    ? "Guardando..."
                    : "Agregar subtarea"}
                </button>
              </div>
              
            </form>
          )}

          {evento.subtareas.length === 0 ? (

            <p className="estado-vacio">
              Aún no hay gestiones logísticas para este evento.
            </p>
          ) : (
            <div className="lista-gestiones">
              {evento.subtareas.map((subtarea) => (
                <div
                  key={subtarea.id}
                  className="gestion-tarjeta"
                  data-estado={subtarea.estado}
                >
                  {subtareaEditando === subtarea.id ? (
                    <form
                      className="gestion-info"
                      onSubmit={(e) => guardarSubtarea(e, subtarea.id)}
                    >
                      <h3>Editar subtarea</h3>

                      {errorSubtarea && (
                      <p
                        className="alerta alerta-error"
                        role="alert"
                        style={{ whiteSpace: "pre-line" }}
                      >
                        <IconoError /> {errorSubtarea}
                      </p>
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
                          {guardandoSubtarea ? "Guardando..." : "Guardar cambios"}
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
                          <span>
                            Plazo: {formatearSoloFecha(subtarea.plazo)}
                          </span>
                          <span>{subtarea.horas_estimadas} h estimadas</span>
                        </div>
                      </div>

                      <span
                        className="badge-estado"
                        data-estado={subtarea.estado}
                      >
                        {ESTADO_LABEL[subtarea.estado] || subtarea.estado}
                      </span>

                      <div className="evento-acciones">
                        <button
                          type="button"
                          className="boton-secundario"
                          onClick={() => iniciarEdicionSubtarea(subtarea)}
                        >
                          <IconoLapiz /> Editar
                        </button>

                        <button
                          type="button"
                          className="boton-secundario"
                          onClick={() => eliminarSubtarea(subtarea)}
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
      </main>
    </div>
  );
}

export default Evento;
