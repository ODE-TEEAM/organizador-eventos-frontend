
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { getAuthHeaders } from "../auth";
import "../eventos.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

function formatearFecha(valor) {
  if (!valor) return "Sin fecha";

  const fecha = new Date(valor);

  if (isNaN(fecha.getTime())) return valor;

  return fecha.toLocaleString("es-CO", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export default function Eventos() {
  const [eventos, setEventos] = useState([]);
  const [estado, setEstado] = useState("cargando");
  const [mensajeError, setMensajeError] = useState("");

  async function cargarEventos() {
    setEstado("cargando");
    setMensajeError("");

    try {
      const respuesta = await fetch(`${API_URL}/eventos/`, {
        headers: getAuthHeaders(),
      });

      if (respuesta.status === 401) {
        setMensajeError("Tu sesión expiró. Inicia sesión nuevamente.");
        setEstado("error");
        return;
      }

      if (!respuesta.ok) {
        throw new Error(`Error del servidor: ${respuesta.status}`);
      }

      const datos = await respuesta.json();

      if (!Array.isArray(datos)) {
        throw new Error(
          "El servidor no devolvió una lista de eventos."
        );
      }

      setEventos(datos);
      setEstado("listo");
    } catch (error) {
      console.error("Error al cargar eventos:", error);
      setMensajeError(
        error.message ||
          "No pudimos cargar los eventos. Verifica la conexión con el backend."
      );
      setEstado("error");
    }
  }

  useEffect(() => {
    cargarEventos();
  }, []);

  return (
    <div className="pagina pagina-oscura">
      <Header />

      <main className="contenedor">
        <div className="cabecera-pagina">
          <h1>Mis eventos</h1>
          <p>Consulta y administra los eventos que has creado.</p>
        </div>

        {estado === "cargando" && (
          <div className="estado-caja">
            <div className="spinner spinner-grande" />
            <p className="estado-caja-texto">
              Cargando tus eventos...
            </p>
          </div>
        )}

        {estado === "error" && (
          <div className="estado-caja">
            <p className="alerta alerta-error">{mensajeError}</p>
            <button
              type="button"
              className="btn btn-primario"
              onClick={cargarEventos}
            >
              Reintentar
            </button>
          </div>
        )}

        {estado === "listo" && (
          <>
            <p className="texto-ayuda">
              {eventos.length === 0
                ? "Todavía no has creado eventos."
                : `${eventos.length} evento(s) registrado(s).`}
            </p>

            {eventos.length === 0 ? (
              <div className="estado-caja">
                <p>No hay eventos para mostrar.</p>
                <Link to="/crear" className="btn btn-primario">
                  Crear mi primer evento
                </Link>
              </div>
            ) : (
              <div className="lista-gestiones">
                {eventos.map((evento) => (
                  <article
                    key={evento.id}
                    className="gestion-tarjeta"
                  >
                    <div className="gestion-info">
                      <h2>{evento.nombre}</h2>

                      <div className="gestion-meta">
                        <span>
                          Tipo: {evento.tipo || "Sin especificar"}
                        </span>
                        <span>
                          Cliente: {evento.cliente || "Sin especificar"}
                        </span>
                        <span>
                          Fecha: {formatearFecha(evento.fecha_hora)}
                        </span>
                        <span>
                          Lugar: {evento.lugar || "Sin especificar"}
                        </span>
                        <span>
                          Gestiones: {Array.isArray(evento.subtareas)
                            ? evento.subtareas.length
                            : 0}
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/evento/${evento.id}`}
                      className="boton-secundario"
                    >
                      Ver y editar
                    </Link>
                  </article>
                ))}
              </div>
            )}

            <Link to="/hoy" className="enlace-secundario">
              ← Volver a Hoy
            </Link>
          </>
        )}
      </main>
    </div>
  );
}
