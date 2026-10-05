import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import Header from "../components/Header";
import { getAuthHeaders } from "../auth";
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

  // Si Crear.jsx redirigió aquí después de que alguna subtarea fallara al
  // guardarse, viene en location.state.erroresSubtareas.
  const erroresSubtareas = location.state?.erroresSubtareas;

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
    }
    if (!esTextoValido(form.lugar)) {
      errores.lugar = "Escribe un lugar válido (mínimo 3 caracteres, con letras).";
    }
    if (!form.plazo_limite) {
      errores.plazo_limite = "El plazo límite es obligatorio.";
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
    if (Object.keys(errores).length > 0) return;

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
        if (datos && typeof datos === "object") {
          setErroresEdit(datos);
        }
        setGuardando(false);
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

  if (error) {
    return (
      <div className="pagina">
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
      <div className="pagina">
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
    <div className="pagina">
      <Header />

      <main className="contenedor contenedor-estrecho pagina-formulario">
        {erroresSubtareas && erroresSubtareas.length > 0 && (
          <p className="alerta alerta-error">
            <IconoError />
            <span>
              <strong>Atención:</strong> el evento se creó, pero {erroresSubtareas.length}{" "}
              gestión(es) logística(s) no se pudieron guardar. Puedes volver a intentarlo.
              <ul>
                {erroresSubtareas.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </span>
          </p>
        )}

        {exitoMsg && (
          <p className="alerta alerta-exito">
            <IconoExito /> {exitoMsg}
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

              {erroresEdit.general && (
                <p className="alerta alerta-error"><IconoError /> {erroresEdit.general}</p>
              )}

              <div className="evento-acciones">
                <button type="submit" className="boton-principal" disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  type="button"
                  className="boton-secundario"
                  onClick={cancelarEdicion}
                  disabled={guardando}
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
                  <button type="button" className="boton-secundario" onClick={iniciarEdicion}>
                    <IconoLapiz /> Editar
                  </button>
                </div>
              </div>
              <dl className="detalle-grid">
                <dt>Tipo</dt>
                <dd>{evento.tipo}</dd>

                <dt>Cliente</dt>
                <dd>{evento.cliente}</dd>

                <dt>Fecha del evento</dt>
                <dd>{formatearFecha(evento.fecha_hora)}</dd>

                <dt>Lugar</dt>
                <dd>{evento.lugar}</dd>

                <dt>Plazo límite</dt>
                <dd>{formatearSoloFecha(evento.plazo_limite)}</dd>
              </dl>
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
                <div className="gestion-info">
                  <h3>{subtarea.nombre}</h3>
                  <div className="gestion-meta">
                    <span>Plazo: {formatearSoloFecha(subtarea.plazo)}</span>
                    <span>{subtarea.horas_estimadas} h estimadas</span>
                  </div>
                </div>
                <span className="badge-estado" data-estado={subtarea.estado}>
                  {ESTADO_LABEL[subtarea.estado] || subtarea.estado}
                </span>
              </div>
            ))}
          </div>
        )}

        <Link to="/crear" className="enlace-secundario">
          + Crear otro evento
        </Link>
      </main>
    </div>
  );
}

export default Evento;
