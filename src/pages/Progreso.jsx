import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { getAuthHeaders } from "../auth";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

function Progreso() {
  const [datos, setDatos] = useState(null); // { totalEventos, resumen }
  const [estado, setEstado] = useState("cargando"); // cargando | listo | error
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
        setMensajeError("Tu sesión expiró. Vuelve a iniciar sesión para continuar.");
        setEstado("error");
        return;
      }

      if (!respEventos.ok || !respHoy.ok) {
        throw new Error("No se pudo cargar tu progreso.");
      }

      const listaEventos = await respEventos.json();
      const datosHoy = await respHoy.json();

      setDatos({
        totalEventos: Array.isArray(listaEventos) ? listaEventos.length : 0,
        resumen: datosHoy.resumen || {
          total: 0,
          vencidas: 0,
          para_hoy: 0,
          proximas: 0,
          completadas: 0,
        },
      });
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

  const resumen = datos?.resumen;

  const tarjetas = resumen
    ? [
        {
          valor: datos.totalEventos,
          etiqueta: "Eventos activos",
          color: "var(--violeta)",
        },
        {
          valor: resumen.completadas,
          etiqueta: "Gestiones completadas",
          color: "var(--verde)",
        },
        {
          valor: resumen.para_hoy + resumen.proximas,
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
          <p>Resumen de tu actividad como organizador de eventos.</p>
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
