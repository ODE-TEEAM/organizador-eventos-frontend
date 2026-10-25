import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { getAuthHeaders } from "../auth";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

function esCompletada(estado) {
  const e = (estado || "").toLowerCase();
  return e === "completada" || e === "ejecutada";
}

function calcularProgreso(subtareas = []) {
  const total = subtareas.length;
  const completadas = subtareas.filter((s) => esCompletada(s.estado)).length;
  const porcentaje = total === 0 ? 0 : Math.round((completadas / total) * 100);
  return { total, completadas, porcentaje };
}

// Próxima gestión pendiente (la de plazo más cercano que no esté hecha).
function proximaPendiente(subtareas = []) {
  return (
    subtareas
      .filter((s) => !esCompletada(s.estado) && (s.estado || "").toLowerCase() !== "pospuesta")
      .sort((a, b) => String(a.plazo).localeCompare(String(b.plazo)))[0] || null
  );
}

// Días que faltan para el evento (negativo si ya pasó).
function diasParaEvento(fechaHora) {
  if (!fechaHora) return null;
  const fecha = new Date(fechaHora);
  if (isNaN(fecha.getTime())) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fecha.setHours(0, 0, 0, 0);
  return Math.round((fecha - hoy) / 86400000);
}

function textoDias(dias) {
  if (dias === null) return "";
  if (dias < 0) return "Evento ya realizado";
  if (dias === 0) return "Es hoy";
  if (dias === 1) return "Falta 1 día";
  return `Faltan ${dias} días`;
}

// Orden útil para el organizador: primero lo que está más cerca y sin
// terminar; los eventos al 100% o ya realizados van al final.
function ordenarEventos(eventos) {
  return [...eventos].sort((a, b) => {
    const pa = calcularProgreso(a.subtareas || []).porcentaje;
    const pb = calcularProgreso(b.subtareas || []).porcentaje;
    const da = diasParaEvento(a.fecha_hora);
    const db = diasParaEvento(b.fecha_hora);
    const terminadoA = pa === 100 || (da !== null && da < 0);
    const terminadoB = pb === 100 || (db !== null && db < 0);
    if (terminadoA !== terminadoB) return terminadoA ? 1 : -1;
    return (da ?? Infinity) - (db ?? Infinity);
  });
}

function formatearFechaCorta(valor) {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function BarraProgreso({ completadas, total, porcentaje }) {
  return (
    <div className="barra-progreso-bloque">
      <div className="barra-progreso-meta">
        <span>
          {completadas} de {total} {total === 1 ? "gestión" : "gestiones"}
        </span>
        <strong>{porcentaje}%</strong>
      </div>
      <div
        className="barra-progreso-track"
        role="progressbar"
        aria-valuenow={porcentaje}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progreso ${porcentaje} por ciento`}
      >
        <div
          className="barra-progreso-fill"
          style={{ width: `${porcentaje}%` }}
          data-completo={porcentaje === 100 ? "true" : "false"}
        />
      </div>
    </div>
  );
}

function Progreso() {
  const [eventos, setEventos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [estado, setEstado] = useState("cargando");
  const [mensajeError, setMensajeError] = useState("");

  const cargarProgreso = async () => {
    setEstado("cargando");
    setMensajeError("");

    try {
      const [respEventos, respHoy] = await Promise.all([
        fetch(`${API_URL}/eventos/`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/hoy/`, { headers: getAuthHeaders() }),
      ]);

      if (respEventos.status === 401 || respHoy.status === 401) {
        setMensajeError(
          "Tu sesión expiró. Vuelve a iniciar sesión para ver tu avance."
        );
        setEstado("error");
        return;
      }

      if (!respEventos.ok || !respHoy.ok) {
        throw new Error("No se pudo cargar tu progreso.");
      }

      const listaEventos = await respEventos.json();
      const datosHoy = await respHoy.json();

      const base = Array.isArray(listaEventos) ? listaEventos : [];

      const conSubtareas = await Promise.all(
        base.map(async (ev) => {
          if (Array.isArray(ev.subtareas)) return ev;
          try {
            const r = await fetch(`${API_URL}/eventos/${ev.id}/`, {
              headers: getAuthHeaders(),
            });
            if (!r.ok) return { ...ev, subtareas: [] };
            return await r.json();
          } catch {
            return { ...ev, subtareas: [] };
          }
        })
      );

      setEventos(conSubtareas);
      setResumen(
        datosHoy.resumen || {
          total: 0,
          vencidas: 0,
          para_hoy: 0,
          proximas: 0,
          completadas: 0,
        }
      );
      setEstado("listo");
    } catch (err) {
      console.error(err);
      setMensajeError(
        "No pudimos cargar tu avance. Revisa tu conexión e intenta de nuevo."
      );
      setEstado("error");
    }
  };

  useEffect(() => {
    cargarProgreso();
  }, []);

  const tarjetas = resumen
    ? [
        {
          valor: eventos.length,
          etiqueta: "Eventos activos",
          color: "var(--violeta)",
        },
        {
          valor: resumen.completadas,
          etiqueta: "Gestiones hechas",
          color: "var(--verde)",
        },
        {
          valor: (resumen.para_hoy || 0) + (resumen.proximas || 0),
          etiqueta: "Gestiones pendientes",
          color: "#f2a33c",
        },
        {
          valor: resumen.vencidas,
          etiqueta: "Gestiones vencidas",
          color: "var(--rojo)",
        },
      ]
    : [];

  return (
    <div className="pagina pagina-oscura">
      <Header />

      <main id="contenido" tabIndex={-1} className="contenedor contenedor-estrecho">
        <div className="cabecera-pagina">
          <h1>Progreso</h1>
          <p>Cuánto llevas preparado en cada evento.</p>
        </div>

        {estado === "cargando" && (
          <div className="estado-caja" role="status" aria-live="polite">
            <div className="spinner spinner-grande" aria-hidden="true" />
            <p className="estado-caja-texto">Revisando el avance de tus eventos...</p>
          </div>
        )}

        {estado === "error" && (
          <div className="estado-caja">
            <p className="alerta alerta-error" role="alert" style={{ margin: 0 }}>
              {mensajeError}
            </p>
            <button onClick={cargarProgreso} className="btn btn-primario">
              Intentar de nuevo
            </button>
          </div>
        )}

        {estado === "listo" && (
          <>
            <div className="progreso-grid">
              {tarjetas.map((t) => (
                <div
                  key={t.etiqueta}
                  className="progreso-card"
                  style={{ "--color-acento": t.color }}
                >
                  <span className="progreso-numero">{t.valor}</span>
                  <span className="progreso-etiqueta">{t.etiqueta}</span>
                </div>
              ))}
            </div>

            <section className="seccion-eventos-progreso">
              <h2 className="seccion-titulo-progreso">Avance por evento</h2>
              {eventos.length > 1 && (
                <p className="progreso-orden">
                  Ordenados por cercanía: primero los eventos próximos que aún
                  tienen gestiones pendientes.
                </p>
              )}

              {eventos.length === 0 ? (
                <div className="estado-caja">
                  <p className="estado-caja-titulo">Todavía no hay eventos</p>
                  <p className="estado-caja-texto">
                    Crea un evento y agrega gestiones para ver aquí cuánto
                    llevas preparado.
                  </p>
                  <Link to="/crear" className="btn btn-primario">
                    + Crear evento
                  </Link>
                </div>
              ) : (
                <div className="lista-eventos-progreso">
                  {ordenarEventos(eventos).map((ev) => {
                    const { total, completadas, porcentaje } = calcularProgreso(
                      ev.subtareas || []
                    );
                    const siguiente = proximaPendiente(ev.subtareas || []);
                    const dias = diasParaEvento(ev.fecha_hora);
                    return (
                      <Link
                        key={ev.id}
                        to={`/evento/${ev.id}`}
                        className="evento-progreso-card"
                        aria-label={`${ev.nombre}: ${porcentaje}% preparado, ${completadas} de ${total} gestiones hechas. ${textoDias(dias)}. Ver detalle.`}
                      >
                        <div className="evento-progreso-cabecera">
                          <div>
                            <h3 className="evento-progreso-nombre">
                              {ev.nombre}
                            </h3>
                            <p className="evento-progreso-meta">
                              {ev.tipo || "Evento"}
                              {ev.fecha_hora
                                ? ` · ${formatearFechaCorta(ev.fecha_hora)}`
                                : ""}
                              {dias !== null ? ` · ${textoDias(dias)}` : ""}
                            </p>
                          </div>
                          <span className="badge badge-violeta">
                            {porcentaje}%
                          </span>
                        </div>
                        {total === 0 ? (
                          <p className="evento-progreso-aviso">
                            Sin gestiones todavía: entra al evento y agrega la
                            primera para empezar a medir el avance.
                          </p>
                        ) : (
                          <>
                            <BarraProgreso
                              completadas={completadas}
                              total={total}
                              porcentaje={porcentaje}
                            />
                            <p className="evento-progreso-siguiente">
                              {porcentaje === 100
                                ? "✓ Todo listo: todas las gestiones están hechas."
                                : siguiente
                                  ? `Siguiente: ${siguiente.nombre} · ${formatearFechaCorta(`${siguiente.plazo}T12:00:00`)}`
                                  : "Las gestiones restantes están pospuestas."}
                            </p>
                          </>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

                        <p
              className="progreso-nota"
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "0.6rem",
              }}
            >
              Las pendientes son las de hoy y las próximas. Las vencidas
              necesitan atención.
              <Link to="/hoy" className="boton-accion-subtarea">
                Ir a la vista de hoy
              </Link>
            </p>
          </>
        )}
      </main>
    </div>
  );
}

export default Progreso;