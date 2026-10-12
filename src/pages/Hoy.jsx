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
  const [estado, setEstado] = useState("cargando");
  const [mensajeError, setMensajeError] = useState("");

  const [gestionEditando, setGestionEditando] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [guardandoReprogramacion, setGuardandoReprogramacion] = useState(false);
  const [mensajeReprogramacion, setMensajeReprogramacion] = useState("");
  const [fechaSugerida, setFechaSugerida] = useState("");

  const [gestionAccion, setGestionAccion] = useState(null);
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
        setMensajeError("Tu sesión expiró. Vuelve a iniciar sesión para ver tus gestiones.");
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
        "No pudimos cargar tus gestiones. Revisa tu conexión e intenta de nuevo."
      );
      setEstado("error");
    }
  };

  useEffect(() => {
    cargarGestiones();
  }, []);

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
      setMensajeReprogramacion("Elige la nueva fecha de esta gestión.");
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
            `Ese día te quedarías con ${datos.horas_planificadas} h (tu límite es ${datos.limite_horas} h).`
        );
        setFechaSugerida(datos.fecha_sugerida || "");
        setGuardandoReprogramacion(false);
        return;
      }

      if (!respuesta.ok) {
        setMensajeReprogramacion(
          mensajeDeError(datos, "No pudimos cambiar la fecha. Intenta de nuevo.")
        );
        setGuardandoReprogramacion(false);
        return;
      }

      setGestionEditando(null);
      setNuevaFecha("");
      setMensajeReprogramacion("");
      setExitoAccion(
        `Nueva fecha guardada para "${gestionEditando.titulo}". Actualizamos lo urgente de hoy.`
      );
      await cargarGestiones();
    } catch (err) {
      console.error(err);
      setMensajeReprogramacion(
        "No pudimos guardar la fecha. Intenta de nuevo en unos segundos."
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
          mensajeDeError(datos, "No pudimos mover la gestión a esa fecha.")
        );
        setGuardandoReprogramacion(false);
        return;
      }

      const titulo = gestionEditando.titulo;
      const fechaTexto = formatearFechaLarga(fechaSugerida);
      setGestionEditando(null);
      setNuevaFecha("");
      setMensajeReprogramacion("");
      setFechaSugerida("");
      setExitoAccion(
        `"${titulo}" quedó para el ${fechaTexto}. Actualizamos lo urgente de hoy.`
      );
      await cargarGestiones();
    } catch (err) {
      console.error(err);
      setMensajeReprogramacion(
        "No pudimos guardar la fecha. Intenta de nuevo en unos segundos."
      );
    }

    setGuardandoReprogramacion(false);
  };

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

    const nota = (notaPosponer || "").trim();
    const body =
      tipo === "hecha"
        ? { estado: "completada" }
        : {
            estado: "pospuesta",
            ...(nota ? { nota } : {}),
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
              ? "No pudimos marcarla como hecha. Intenta de nuevo."
              : "No pudimos posponerla. Intenta de nuevo."
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
          ? `Listo. "${gestion.titulo}" quedó hecha y salió de lo urgente de hoy.`
          : nota
            ? `Pospuesta. "${gestion.titulo}" salió de lo urgente y guardamos tu nota.`
            : `Pospuesta. "${gestion.titulo}" salió de lo urgente de hoy.`
      );
      await cargarGestiones();
    } catch (err) {
      console.error(err);
      setMensajeAccion(
        "No pudimos guardar el cambio. Intenta de nuevo en unos segundos."
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
            Estas son las gestiones que necesitan tu atención, de la más urgente
            a la más lejana.
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
              Entendido
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
              Si coinciden en fecha, va primero la de menor esfuerzo (menos horas).
            </li>
          </ol>
        </details>

        {estado === "cargando" && (
          <div className="estado-caja">
            <div className="spinner spinner-grande" />
            <p className="estado-caja-texto">Revisando lo urgente de hoy...</p>
          </div>
        )}

        {estado === "error" && (
          <div className="estado-caja">
            <p className="alerta alerta-error" style={{ margin: 0 }}>
              {mensajeError}
            </p>
            <button onClick={cargarGestiones} className="btn btn-primario">
              Intentar de nuevo
            </button>
          </div>
        )}

        {estado === "vacio" && (
          <div className="estado-caja">
            <AvatarAnimal semilla={email} size={84} />
            <p className="estado-caja-titulo">Hoy no tienes gestiones urgentes</p>
            <p className="estado-caja-texto">
              No hay vencidas, ni de hoy, ni próximas. Crea un evento y agrega
              gestiones (catering, salón, invitaciones) para verlas aquí.
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
                  Nada vence hoy. Las próximas siguen en su fecha.
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
                  Cambiar la fecha
                </h2>
                <p className="modal-subtitulo">
                  Nueva fecha para &quot;{gestionEditando.titulo}&quot;.
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
                  Hoy o más adelante, dentro de los próximos 10 años.
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
                    Ese día ya llegaste al límite de horas
                  </strong>
                  <p style={{ margin: "0 0 0.9rem" }}>
                    Puedes dejarla el{" "}
                    <strong>{formatearFechaLarga(fechaSugerida)}</strong>, que
                    sí tiene espacio.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primario btn-ancho"
                    onClick={aceptarFechaSugerida}
                    disabled={guardandoReprogramacion}
                  >
                    {guardandoReprogramacion
                      ? "Guardando..."
                      : `Mover al ${formatearFechaLarga(fechaSugerida)}`}
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primario btn-ancho"
                disabled={guardandoReprogramacion}
              >
                {guardandoReprogramacion ? "Guardando..." : "Guardar fecha"}
              </button>
            </form>
          </div>
        </div>
      )}

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
                    ? `¿Ya terminaste "${gestionAccion.gestion.titulo}"? Al confirmar, deja de aparecer en lo urgente de hoy y suma al avance del evento.`
                    : `Vas a posponer "${gestionAccion.gestion.titulo}". Dejará de aparecer como urgente. Puedes anotar por qué.`}
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
                  <label htmlFor="nota-posponer">Nota (opcional)</label>
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
                    Queda visible en el evento para que recuerdes el motivo (máx. 300 caracteres).
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
                      ? "Sí, ya está hecha"
                      : "Posponer"}
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
          {gestion.nota ? <span>Nota: {gestion.nota}</span> : null}
        </span>
      </Link>

      <span className={`badge ${config.badge}`}>{config.label}</span>

      <div
        className="gestion-card-acciones"
        style={{
          display: "flex",
          gap: "0.4rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <button
          type="button"
          className="btn btn-fantasma"
          onClick={() => onHecha(gestion)}
        >
          Hecha
        </button>
        <button
          type="button"
          className="btn btn-fantasma"
          onClick={() => onPosponer(gestion)}
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