import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import AvatarAnimal from "../components/AvatarAnimal";
import { getAuthHeaders, obtenerNombre, obtenerUsuario } from "../auth";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const TIPOS = {
  vencida: { badge: "badge-rojo", label: "Vencida", punto: "#ff6b6e" },
  para_hoy: { badge: "badge-ambar", label: "Hoy", punto: "#f2a33c" },
  proxima: { badge: "badge-teal", label: "Próxima", punto: "#2dd4bf" },
};

function formatearFechaCorta(valor) {
  if (!valor) return "";
  const fecha = new Date(`${valor}T00:00:00`);
  if (isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

function fechaLargaHoy() {
  return new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function Hoy() {
  const [vencidas, setVencidas] = useState([]);
  const [paraHoy, setParaHoy] = useState([]);
  const [proximas, setProximas] = useState([]);
  const [estado, setEstado] = useState("cargando"); // cargando | listo | error | vacio
  const [mensajeError, setMensajeError] = useState("");

  const nombre = obtenerNombre();
  const email = obtenerUsuario()?.email || obtenerUsuario()?.user?.email || "";

  const cargarGestiones = async () => {
    setEstado("cargando");
    setMensajeError("");

    try {
      const respuesta = await fetch(`${API_URL}/hoy/`, {
        headers: getAuthHeaders(),
      });

      if (respuesta.status === 401) {
        setMensajeError("Tu sesión expiró. Vuelve a iniciar sesión para continuar.");
        setEstado("error");
        return;
      }

      if (!respuesta.ok) {
        throw new Error("No se pudieron cargar las gestiones.");
      }

      const datos = await respuesta.json();

      const listaVencidas = datos.vencidas || [];
      const listaParaHoy = datos.para_hoy || [];
      const listaProximas = datos.proximas || [];

      setVencidas(listaVencidas);
      setParaHoy(listaParaHoy);
      setProximas(listaProximas);

      const total =
        listaVencidas.length + listaParaHoy.length + listaProximas.length;

      setEstado(total === 0 ? "vacio" : "listo");
    } catch (err) {
      console.error(err);
      setMensajeError(
        "No pudimos cargar tus gestiones. Verifica que el backend esté encendido e intenta de nuevo."
      );
      setEstado("error");
    }
  };

  useEffect(() => {
    cargarGestiones();
  }, []);

  return (
    <div className="pagina pagina-oscura">
      <Header />

      <section className="hero-hoy">
        <div className="contenedor">
          <span className="hero-hoy-saludo">
            <span className="chip-punto" style={{ background: "var(--lima)" }} />
            {fechaLargaHoy()}
          </span>
          <h1 className="hero-hoy-titulo">Hola, {nombre}</h1>
          <p className="hero-hoy-sub">
            Estas son las gestiones que necesitan tu atención, ordenadas de la
            más urgente a la más lejana.
          </p>
          <div className="hero-hoy-acciones">
            <Link to="/crear" className="btn btn-lima">
              + Crear evento
            </Link>
            <Link to="/progreso" className="btn btn-fantasma-claro">
              Ver mi progreso
            </Link>
          </div>

          {estado === "listo" && (
            <div className="chips-resumen">
              <span className="chip">
                <span className="chip-punto" style={{ background: TIPOS.vencida.punto }} />
                {vencidas.length} vencidas
              </span>
              <span className="chip">
                <span className="chip-punto" style={{ background: TIPOS.para_hoy.punto }} />
                {paraHoy.length} para hoy
              </span>
              <span className="chip">
                <span className="chip-punto" style={{ background: TIPOS.proxima.punto }} />
                {proximas.length} próximas
              </span>
            </div>
          )}
        </div>
      </section>

      <main className="contenedor" style={{ paddingBottom: "3.5rem" }}>
        <details className="caja-regla">
          <summary>¿Cómo se priorizan tus gestiones?</summary>
          <ol>
            <li>
              Primero las <strong>vencidas</strong> (ya pasaron de fecha).
            </li>
            <li>
              Luego las de <strong>hoy</strong>.
            </li>
            <li>
              Después las <strong>próximas</strong>.
            </li>
            <li>
              Dentro de cada grupo se ordenan por fecha y, si empatan, por menor
              esfuerzo estimado.
            </li>
          </ol>
        </details>

        {estado === "cargando" && (
          <div className="estado-caja">
            <div className="spinner spinner-grande" />
            <p className="estado-caja-texto">Cargando tus gestiones del día...</p>
          </div>
        )}

        {estado === "error" && (
          <div className="estado-caja">
            <p className="alerta alerta-error" style={{ margin: 0 }}>
              {mensajeError}
            </p>
            <button onClick={cargarGestiones} className="btn btn-primario">
              Reintentar
            </button>
          </div>
        )}

        {estado === "vacio" && (
          <div className="estado-caja">
            <AvatarAnimal semilla={email} size={84} />
            <p className="estado-caja-titulo">Todo bajo control por ahora</p>
            <p className="estado-caja-texto">
              No tienes gestiones pendientes. Crea un evento y agrega gestiones
              logísticas para verlas organizadas aquí.
            </p>
            <Link to="/crear" className="btn btn-primario">
              + Crear evento
            </Link>
          </div>
        )}

        {estado === "listo" && (
          <>
            {vencidas.length > 0 && (
              <section className="seccion">
                <h2 className="seccion-titulo">
                  <span
                    className="chip-punto"
                    style={{ background: TIPOS.vencida.punto, width: 10, height: 10 }}
                  />
                  Vencidas
                  <span className="seccion-conteo">{vencidas.length}</span>
                </h2>
                <div className="gestion-lista">
                  {vencidas.map((g) => (
                    <GestionCard key={g.id} gestion={g} tipo="vencida" />
                  ))}
                </div>
              </section>
            )}

            <section className="seccion">
              <h2 className="seccion-titulo">
                <span
                  className="chip-punto"
                  style={{ background: TIPOS.para_hoy.punto, width: 10, height: 10 }}
                />
                Para hoy
                <span className="seccion-conteo">{paraHoy.length}</span>
              </h2>
              {paraHoy.length === 0 ? (
                <p className="texto-ayuda-campo" style={{ padding: "0.4rem 0" }}>
                  No tienes gestiones para hoy.
                </p>
              ) : (
                <div className="gestion-lista">
                  {paraHoy.map((g) => (
                    <GestionCard key={g.id} gestion={g} tipo="para_hoy" />
                  ))}
                </div>
              )}
            </section>

            {proximas.length > 0 && (
              <section className="seccion">
                <h2 className="seccion-titulo">
                  <span
                    className="chip-punto"
                    style={{ background: TIPOS.proxima.punto, width: 10, height: 10 }}
                  />
                  Próximas
                  <span className="seccion-conteo">{proximas.length}</span>
                </h2>
                <div className="gestion-lista">
                  {proximas.map((g) => (
                    <GestionCard key={g.id} gestion={g} tipo="proxima" />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function GestionCard({ gestion, tipo }) {
  const config = TIPOS[tipo];

  return (
    <Link to={`/evento/${gestion.evento_id || gestion.id}`} className="gestion-card" data-tipo={tipo}>
      <div className="gestion-card-cuerpo">
        <span className="gestion-card-titulo">{gestion.titulo}</span>
        <span className="gestion-card-evento">{gestion.evento}</span>
        <span className="gestion-card-meta">
          <span>{formatearFechaCorta(gestion.fecha)}</span>
          <span>{gestion.horas_estimadas} h estimadas</span>
        </span>
      </div>
      <span className={`badge ${config.badge}`}>{config.label}</span>
      <svg
        className="flecha"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}