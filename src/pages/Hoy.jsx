import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import AvatarAnimal from "../components/AvatarAnimal";
import { getAuthHeaders, obtenerNombre, obtenerUsuario } from "../auth";
import { hoyLocalISO, dentroDeAniosInput, mensajeDeError } from "../utils/validacion";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const TIPOS = {
  vencida: { badge: "badge-rojo", label: "Vencida", punto: "#ff6b6e" },
  para_hoy: { badge: "badge-ambar", label: "Hoy", punto: "#f2a33c" },
  proxima: { badge: "badge-teal", label: "Próxima", punto: "#2dd4bf" },
};

function formatearFechaLarga(valor) {
  if (!valor) return "";
  const fecha = new Date(`${valor}T00:00:00`);
  if (isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

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

  // Reprogramar
  const [gestionEditando, setGestionEditando] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [guardandoReprogramacion, setGuardandoReprogramacion] = useState(false);
  const [mensajeReprogramacion, setMensajeReprogramacion] = useState("");
  const [fechaSugerida, setFechaSugerida] = useState("");

  // Marcar Hecha / Posponer (C1 Sprint 4)
  const [gestionAccion, setGestionAccion] = useState(null); // { gestion, tipo: 'hecha' | 'posponer' }
  const [notaPosponer, setNotaPosponer] = useState("");
  const [guardandoAccion, setGuardandoAccion] = useState(false);
  const [mensajeAccion, setMensajeAccion] = useState("");
  const [exitoAccion, setExitoAccion] = useState("");

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

  // Escape cierra modales
  useEffect(() => {
    const tecla = (e) => {
      if (e.key !== "Escape") return;
      if (guardandoReprogramacion || guardandoAccion) return;

      if (gestionEditando) {
        setGestionEditando(null);
        setNuevaFecha("");
        setMensajeReprogramacion("");
        setFechaSugerida("");
      }
      if (gestionAccion) {
        setGestionAccion(null);
        setNotaPosponer("");
        setMensajeAccion("");
      }
    };

    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [gestionEditando, gestionAccion, guardandoReprogramacion, guardandoAccion]);

  // ---- Reprogramar ----
  const abrirReprogramacion = (gestion) => {
    setGestionEditando(gestion);
    setNuevaFecha(gestion.fecha || "");
    setMensajeReprogramacion("");
    setFechaSugerida("");
  };

  const cerrarReprogramacion = () => {
    if (guardandoReprogramacion) return;
    setGestionEditando(null);
    setNuevaFecha("");
    setMensajeReprogramacion("");
    setFechaSugerida("");
  };

  const guardarReprogramacion = async (e) => {
    e.preventDefault();

    if (!gestionEditando || !nuevaFecha) {
      setMensajeReprogramacion("Selecciona una nueva fecha.");
      return;
    }

    setGuardandoReprogramacion(true);
    setMensajeReprogramacion("");

    try {
      const respuesta = await fetch(
        `${API_URL}/subtareas/${gestionEditando.id}/`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ plazo: nuevaFecha }),
        }
      );

      const datos = await respuesta.json();

      if (respuesta.status === 409 && datos?.conflicto) {
        setMensajeReprogramacion(
          datos.mensaje ||
            `Quedarías con ${datos.horas_planificadas} horas planificadas (límite ${datos.limite_horas} horas).`
        );
        setFechaSugerida(datos.fecha_sugerida || "");
        setGuardandoReprogramacion(false);
        return;
      }

      if (!respuesta.ok) {
        setMensajeReprogramacion(
          mensajeDeError(datos, "No pudimos reprogramar la gestión.")
        );
        setGuardandoReprogramacion(false);
        return;
      }

      setGestionEditando(null);
      setNuevaFecha("");
      setMensajeReprogramacion("");
      setExitoAccion("Gestión reprogramada correctamente.");
      await cargarGestiones();
    } catch (err) {
      console.error(err);
      setMensajeReprogramacion(
        "No pudimos conectar con el servidor. Intenta nuevamente."
      );
    }

    setGuardandoReprogramacion(false);
  };

  const aceptarFechaSugerida = async () => {
    if (!gestionEditando || !fechaSugerida) return;

    setGuardandoReprogramacion(true);
    setMensajeReprogramacion("");

    try {
      const respuesta = await fetch(
        `${API_URL}/subtareas/${gestionEditando.id}/`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ plazo: fechaSugerida }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setMensajeReprogramacion(
          mensajeDeError(datos, "No pudimos mover la gestión a la fecha sugerida.")
        );
        setGuardandoReprogramacion(false);
        return;
      }

      setGestionEditando(null);
      setNuevaFecha("");
      setMensajeReprogramacion("");
      setFechaSugerida("");
      setExitoAccion("Gestión movida a la fecha sugerida.");
      await cargarGestiones();
    } catch (err) {
      console.error(err);
      setMensajeReprogramacion(
        "No pudimos conectar con el servidor. Intenta nuevamente."
      );
    }

    setGuardandoReprogramacion(false);
  };

  // ---- C1: Hecha / Posponer ----
  const abrirHecha = (gestion) => {
    setGestionAccion({ gestion, tipo: "hecha" });
    setNotaPosponer("");
    setMensajeAccion("");
  };

  const abrirPosponer = (gestion) => {
    setGestionAccion({ gestion, tipo: "posponer" });
    setNotaPosponer("");
    setMensajeAccion("");
  };

  const cerrarAccion = () => {
    if (guardandoAccion) return;
    setGestionAccion(null);
    setNotaPosponer("");
    setMensajeAccion("");
  };

  const confirmarAccion = async (e) => {
    e?.preventDefault?.();
    if (!gestionAccion) return;

    const { gestion, tipo } = gestionAccion;
    setGuardandoAccion(true);
    setMensajeAccion("");

    const body =
      tipo === "hecha"
        ? { estado: "completada" }
        : {
            estado: "pospuesta",
            nota: (notaPosponer || "").trim(),
          };

    try {
      const respuesta = await fetch(`${API_URL}/subtareas/${gestion.id}/`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });

      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        setMensajeAccion(
          mensajeDeError(
            datos,
            tipo === "hecha"
              ? "No pudimos marcar la gestión como hecha. Intenta de nuevo."
              : "No pudimos posponer la gestión. Intenta de nuevo."
          )
        );
        setGuardandoAccion(false);
        return;
      }

      setGestionAccion(null);
      setNotaPosponer("");
      setMensajeAccion("");
      setExitoAccion(
        tipo === "hecha"
          ? `Listo. "${gestion.titulo}" quedó marcada como hecha.`
          : `Gestión pospuesta${(notaPosponer || "").trim() ? " y nota guardada" : ""}.`
      );
      await cargarGestiones();
    } catch (err) {
      console.error(err);
      setMensajeAccion(
        "No pudimos conectar con el servidor. Verifica que el backend esté encendido."
      );
    }

    setGuardandoAccion(false);
  };

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
                <span
                  className="chip-punto"
                  style={{ background: TIPOS.vencida.punto }}
                />
                {vencidas.length} vencidas
              </span>
              <span className="chip">
                <span
                  className="chip-punto"
                  style={{ background: TIPOS.para_hoy.punto }}
                />
                {paraHoy.length} para hoy
              </span>
              <span className="chip">
                <span
                  className="chip-punto"
                  style={{ background: TIPOS.proxima.punto }}
                />
                {proximas.length} próximas
              </span>
            </div>
          )}
        </div>
      </section>

      <main className="contenedor" style={{ paddingBottom: "3.5rem" }}>
        {exitoAccion && (
          <p className="alerta alerta-exito" role="status" style={{ marginBottom: "1rem" }}>
            {exitoAccion}
            <button
              type="button"
              className="btn btn-fantasma"
              style={{ marginLeft: "0.75rem" }}
              onClick={() => setExitoAccion("")}
            >
              Cerrar
            </button>
          </p>
        )}

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
                    style={{
                      background: TIPOS.vencida.punto,
                      width: 10,
                      height: 10,
                    }}
                  />
                  Vencidas
                  <span className="seccion-conteo">{vencidas.length}</span>
                </h2>
                <div className="gestion-lista">
                  {vencidas.map((g) => (
                    <GestionCard
                      key={g.id}
                      gestion={g}
                      tipo="vencida"
                      onReprogramar={abrirReprogramacion}
                      onHecha={abrirHecha}
                      onPosponer={abrirPosponer}
                    />
                  ))}
                </div>
              </section>
            )}

            <section className="seccion">
              <h2 className="seccion-titulo">
                <span
                  className="chip-punto"
                  style={{
                    background: TIPOS.para_hoy.punto,
                    width: 10,
                    height: 10,
                  }}
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
                    <GestionCard
                      key={g.id}
                      gestion={g}
                      tipo="para_hoy"
                      onReprogramar={abrirReprogramacion}
                      onHecha={abrirHecha}
                      onPosponer={abrirPosponer}
                    />
                  ))}
                </div>
              )}
            </section>

            {proximas.length > 0 && (
              <section className="seccion">
                <h2 className="seccion-titulo">
                  <span
                    className="chip-punto"
                    style={{
                      background: TIPOS.proxima.punto,
                      width: 10,
                      height: 10,
                    }}
                  />
                  Próximas
                  <span className="seccion-conteo">{proximas.length}</span>
                </h2>
                <div className="gestion-lista">
                  {proximas.map((g) => (
                    <GestionCard
                      key={g.id}
                      gestion={g}
                      tipo="proxima"
                      onReprogramar={abrirReprogramacion}
                      onHecha={abrirHecha}
                      onPosponer={abrirPosponer}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Modal Reprogramar */}
      {gestionEditando && (
        <div className="modal-fondo" onMouseDown={cerrarReprogramacion}>
          <div
            className="modal"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reprogramar-titulo"
          >
            <div className="modal-cabecera">
              <div>
                <h2 id="reprogramar-titulo" className="modal-titulo">
                  Reprogramar gestión
                </h2>
                <p className="modal-subtitulo">
                  Cambia la fecha objetivo de &quot;{gestionEditando.titulo}&quot;.
                </p>
              </div>
              <button
                type="button"
                className="modal-cerrar"
                onClick={cerrarReprogramacion}
                disabled={guardandoReprogramacion}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardarReprogramacion} noValidate>
              <div className="campo">
                <label htmlFor="nueva-fecha">Nueva fecha</label>
                <input
                  id="nueva-fecha"
                  type="date"
                  value={nuevaFecha}
                  min={hoyLocalISO()}
                  max={dentroDeAniosInput(10).slice(0, 10)}
                  onChange={(e) => {
                    setNuevaFecha(e.target.value);
                    setMensajeReprogramacion("");
                    setFechaSugerida("");
                  }}
                  disabled={guardandoReprogramacion}
                  aria-invalid={!!mensajeReprogramacion}
                />
                <span className="texto-ayuda-campo">
                  Elige una fecha de hoy en adelante, dentro de los próximos 10
                  años.
                </span>
                {mensajeReprogramacion && (
                  <span className="error-campo">{mensajeReprogramacion}</span>
                )}
              </div>

              {fechaSugerida && (
                <div
                  style={{
                    marginTop: "1rem",
                    padding: "1rem",
                    borderRadius: "14px",
                    background: "#f4f8ff",
                    border: "1px solid #d8e5ff",
                  }}
                >
                  <strong style={{ display: "block", marginBottom: "0.35rem" }}>
                    Tenemos una fecha disponible
                  </strong>
                  <p style={{ margin: "0 0 0.9rem" }}>
                    Puedes mover esta gestión al{" "}
                    <strong>{formatearFechaLarga(fechaSugerida)}</strong>.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primario btn-ancho"
                    onClick={aceptarFechaSugerida}
                    disabled={guardandoReprogramacion}
                  >
                    {guardandoReprogramacion
                      ? "Moviendo..."
                      : `Mover al ${formatearFechaLarga(fechaSugerida)}`}
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primario btn-ancho"
                disabled={guardandoReprogramacion}
              >
                {guardandoReprogramacion ? "Guardando..." : "Guardar nueva fecha"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hecha / Posponer (C1) */}
      {gestionAccion && (
        <div className="modal-fondo" onMouseDown={cerrarAccion}>
          <div
            className="modal"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="accion-titulo"
          >
            <div className="modal-cabecera">
              <div>
                <h2 id="accion-titulo" className="modal-titulo">
                  {gestionAccion.tipo === "hecha"
                    ? "Marcar como hecha"
                    : "Posponer gestión"}
                </h2>
                <p className="modal-subtitulo">
                  {gestionAccion.tipo === "hecha"
                    ? `¿Confirmas que ya completaste "${gestionAccion.gestion.titulo}"?`
                    : `Vas a posponer "${gestionAccion.gestion.titulo}". Puedes dejar una nota opcional.`}
                </p>
              </div>
              <button
                type="button"
                className="modal-cerrar"
                onClick={cerrarAccion}
                disabled={guardandoAccion}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={confirmarAccion} noValidate>
              {gestionAccion.tipo === "posponer" && (
                <div className="campo">
                  <label htmlFor="nota-posponer">
                    Nota (opcional)
                  </label>
                  <textarea
                    id="nota-posponer"
                    rows={3}
                    value={notaPosponer}
                    onChange={(e) => {
                      setNotaPosponer(e.target.value);
                      setMensajeAccion("");
                    }}
                    placeholder="Ej. Esperando confirmación del salón"
                    disabled={guardandoAccion}
                    maxLength={300}
                  />
                  <span className="texto-ayuda-campo">
                    Útil para recordar por qué la pospusiste (máx. 300 caracteres).
                  </span>
                </div>
              )}

              {mensajeAccion && (
                <p className="alerta alerta-error" role="alert">
                  {mensajeAccion}
                </p>
              )}

              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button
                  type="submit"
                  className="btn btn-primario"
                  disabled={guardandoAccion}
                  style={{ flex: 1 }}
                >
                  {guardandoAccion
                    ? "Guardando..."
                    : gestionAccion.tipo === "hecha"
                      ? "Sí, marcar como hecha"
                      : "Posponer gestión"}
                </button>
                <button
                  type="button"
                  className="btn btn-fantasma"
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
    </div>
  );
}

function GestionCard({ gestion, tipo, onReprogramar, onHecha, onPosponer }) {
  const config = TIPOS[tipo];

  return (
    <div className="gestion-card" data-tipo={tipo}>
      <Link
        to={`/evento/${gestion.evento_id || gestion.id}`}
        className="gestion-card-cuerpo"
      >
        <span className="gestion-card-titulo">{gestion.titulo}</span>
        <span className="gestion-card-evento">{gestion.evento}</span>
        <span className="gestion-card-meta">
          <span>{formatearFechaCorta(gestion.fecha)}</span>
          <span>{gestion.horas_estimadas} h estimadas</span>
        </span>
      </Link>

      <span className={`badge ${config.badge}`}>{config.label}</span>

      <div className="gestion-card-acciones" style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="button"
          className="btn btn-fantasma"
          onClick={() => onHecha(gestion)}
          title="Marcar como hecha"
        >
          Hecha
        </button>
        <button
          type="button"
          className="btn btn-fantasma"
          onClick={() => onPosponer(gestion)}
          title="Posponer con nota"
        >
          Posponer
        </button>
        <button
          type="button"
          className="btn btn-fantasma"
          onClick={() => onReprogramar(gestion)}
        >
          Reprogramar
        </button>
      </div>

      <Link
        to={`/evento/${gestion.evento_id || gestion.id}`}
        className="flecha"
        aria-label={`Ver ${gestion.titulo}`}
      >
        <svg
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
    </div>
  );
}