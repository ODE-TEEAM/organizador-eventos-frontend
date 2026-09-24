import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import "./formularios.css";

const ESTADO_LABEL = {
  PENDIENTE: "Pendiente",
  pendiente: "Pendiente",
  EJECUTADA: "Ejecutada",
  ejecutada: "Ejecutada",
  POSPUESTA: "Pospuesta",
  pospuesta: "Pospuesta",
};

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

function IconoError() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="13" />
      <circle cx="12" cy="16.2" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Evento() {
  const { id } = useParams();
  const location = useLocation();

  const [evento, setEvento] = useState(null);
  const [error, setError] = useState("");

  // Si Crear.jsx redirigió aquí después de que alguna subtarea fallara al
  // guardarse, viene en location.state.erroresSubtareas.
  const erroresSubtareas = location.state?.erroresSubtareas;

  useEffect(() => {
    const obtenerEvento = async () => {
      try {
        const respuesta = await fetch(
          `http://127.0.0.1:8000/api/eventos/${id}/`
        );

        const datos = await respuesta.json();

        console.log("EVENTO RECIBIDO:", datos);

        if (!respuesta.ok) {
          setError("No se pudo obtener el evento.");
          return;
        }

        setEvento(datos);
      } catch (error) {
        console.error(error);
        setError("No se pudo conectar con el backend.");
      }
    };

    obtenerEvento();
  }, [id]);

  if (error) {
    return (
      <div className="pagina-evento">
        <p className="alerta alerta-error">
          <IconoError /> {error}
        </p>
        <Link to="/crear" className="enlace-secundario">
          ← Volver a crear evento
        </Link>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="pagina-evento">
        <p className="alerta alerta-carga">
          <span className="spinner" /> Cargando evento...
        </p>
      </div>
    );
  }

  return (
    <div className="pagina-evento">
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

      <div className="tarjeta evento-header">
        <h1>{evento.nombre}</h1>
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
    </div>
  );
}

export default Evento;
