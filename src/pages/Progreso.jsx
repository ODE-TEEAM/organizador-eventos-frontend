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
          {completadas} de {total} gestión{total === 1 ? "" : "es"}
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
          "Tu sesión expiró. Vuelve a iniciar sesión para continuar."
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

      // Si el listado no trae subtareas, pedimos el detalle de cada evento.
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
        "No pudimos cargar tu progreso. Verifica que el backend esté encendido e intenta de nuevo."
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
          etiqueta: "Gestiones completadas",
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

      <main className="contenedor contenedor-estrecho">
        <div className="cabecera-pagina">
          <h1>Progreso</h1>
          <p>Resumen de tu actividad y avance de preparación por evento.</p>
        </div>

        {estado === "cargando" && (
          <div className="estado-caja">
            <div className="spinner spinner-grande" />
            <p className="estado-caja-texto">Cargando tu progreso...</p>
          </div>
        )}

        {estado === "error" && (
          <div className="estado-caja">
            <p className="alerta alerta-error" style={{ margin: 0 }}>
              {mensajeError}
            </p>
            <button onClick={cargarProgreso} className="btn btn-primario">
              Reintentar
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

              {eventos.length === 0 ? (
                <div className="estado-caja">
                  <p className="estado-caja-titulo">Aún no tienes eventos</p>
                  <p className="estado-caja-texto">
                    Crea un evento y agrega gestiones para ver aquí el progreso
                    de preparación.
                  </p>
                  <Link to="/crear" className="btn btn-primario">
                    + Crear evento
                  </Link>
                </div>
              ) : (
                <div className="lista-eventos-progreso">
                  {eventos.map((ev) => {
                    const { total, completadas, porcentaje } = calcularProgreso(
                      ev.subtareas || []
                    );
                    return (
                      <Link
                        key={ev.id}
                        to={`/evento/${ev.id}`}
                        className="evento-progreso-card"
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
                            </p>
                          </div>
                          <span className="badge badge-violeta">
                            {porcentaje}%
                          </span>
                        </div>
                        <BarraProgreso
                          completadas={completadas}
                          total={total}
                          porcentaje={porcentaje}
                        />
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            <p className="progreso-nota">
              Las gestiones pendientes incluyen las de hoy y las próximas. Las
              vencidas necesitan tu atención:{" "}
              <Link to="/hoy" className="enlace-secundario">
                ir a la vista de hoy
              </Link>
              .
            </p>
          </>
        )}
      </main>
    </div>
  );
}

export default Progreso;