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

  const [requiereReorganizacion, setRequiereReorganizacion] = useState(false);
  const [limiteHorasDiarias, setLimiteHorasDiarias] = useState(6);
  const [horasPendientesHoy, setHorasPendientesHoy] = useState(0);
  const [excesoHorasHoy, setExcesoHorasHoy] = useState(0);
  const [mostrarResolucionHoras, setMostrarResolucionHoras] = useState(false);
  const [modoResolucionHoras, setModoResolucionHoras] = useState(null);
  const [nuevoLimiteHoras, setNuevoLimiteHoras] = useState(6);
  const [guardandoLimiteHoras, setGuardandoLimiteHoras] = useState(false);
  const [mensajeLimiteHoras, setMensajeLimiteHoras] = useState("");
  const [gestionesSeleccionadas, setGestionesSeleccionadas] = useState([]);
  const [mensajeReorganizacion, setMensajeReorganizacion] = useState("");

  const [gestionEditando, setGestionEditando] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [guardandoReprogramacion, setGuardandoReprogramacion] = useState(false);
  const [mensajeReprogramacion, setMensajeReprogramacion] = useState("");
  const [fechaSugerida, setFechaSugerida] = useState("");
  const [fechasSugeridas, setFechasSugeridas] = useState([]);

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
        setMensajeError(
          "Tu sesión expiró. Vuelve a iniciar sesión para ver tus gestiones."
        );
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

      const limite = Number(datos.limite_horas_diarias ?? 6);
      const horas = Number(datos.resumen?.horas_pendientes_hoy ?? 0);
      const exceso = Number(
        datos.exceso_horas_hoy ?? Math.max(0, horas - limite)
      );
      const requiere = datos.requiere_reorganizacion === true || exceso > 0;

      setLimiteHorasDiarias(limite);
      setNuevoLimiteHoras(limite);
      setHorasPendientesHoy(horas);
      setExcesoHorasHoy(exceso);
      setRequiereReorganizacion(requiere);
      setMostrarResolucionHoras(requiere);

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

  const guardarNuevoLimite = async (e) => {
    e.preventDefault();
    setMensajeLimiteHoras("");

    const limite = Number(nuevoLimiteHoras);

    if (!Number.isInteger(limite) || limite < 1 || limite > 16) {
      setMensajeLimiteHoras("El límite debe ser un número entero entre 1 y 16.");
      return;
    }

    setGuardandoLimiteHoras(true);

    try {
      const respuesta = await fetch(`${API_URL}/configuracion/limite-horas/`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ limite_horas_diarias: limite }),
      });

      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        const errorLimite = datos.limite_horas_diarias;
        const mensaje = Array.isArray(errorLimite)
          ? errorLimite[0]
          : typeof errorLimite === "string"
            ? errorLimite
            : "No pudimos cambiar el límite. Revisa las horas asignadas e intenta de nuevo.";

        setMensajeLimiteHoras(mensaje);
        return;
      }

      setLimiteHorasDiarias(Number(datos.limite_horas_diarias ?? limite));
      setModoResolucionHoras(null);
      setMostrarResolucionHoras(false);
      await cargarGestiones();
    } catch (err) {
      console.error(err);
      setMensajeLimiteHoras(
        "No pudimos guardar el límite. Revisa tu conexión e intenta de nuevo."
      );
    } finally {
      setGuardandoLimiteHoras(false);
    }
  };

  const abrirOpcionesReprogramacion = () => {
    setModoResolucionHoras("reprogramar");
    setGestionesSeleccionadas([]);
    setMensajeReorganizacion("");
  };

  const elegirGestionParaReprogramar = () => {
    const gestion = paraHoy.find((g) =>
      gestionesSeleccionadas.includes(g.id)
    );

    if (!gestion) {
      setMensajeReorganizacion("Selecciona una gestión para cambiar su fecha.");
      return;
    }

    setMostrarResolucionHoras(false);
    setModoResolucionHoras(null);
    setMensajeReorganizacion("");
    abrirReprogramacion(gestion);
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
  }, [
    gestionEditando,
    gestionAccion,
    guardandoReprogramacion,
    guardandoAccion,
  ]);

  const abrirReprogramacion = (gestion) => {
    setGestionEditando(gestion);
    setNuevaFecha(gestion.fecha || "");
    setMensajeReprogramacion("");
    setFechaSugerida("");
    setFechasSugeridas([]);
  };

  const cerrarReprogramacion = () => {
    if (guardandoReprogramacion) return;
    setGestionEditando(null);
    setNuevaFecha("");
    setMensajeReprogramacion("");
    setFechaSugerida("");
    setFechasSugeridas([]);
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

        setFechasSugeridas(datos.fechas_sugeridas || []);
        setFechaSugerida(
          datos.fechas_sugeridas?.[0]?.fecha || datos.fecha_sugerida || ""
        );

        setGuardandoReprogramacion(false);
        return;
      }

      if (!respuesta.ok) {
        setMensajeReprogramacion(
          mensajeDeError(datos, "No pudimos mover la gestión a esa fecha.")
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

      <section id="contenido" tabIndex={-1} className="hero-hoy">
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
          <p
            className="alerta alerta-exito"
            role="status"
            style={{ marginBottom: "1rem" }}
          >
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
              Si coinciden en fecha, va primero la de menor esfuerzo (menos
              horas).
            </li>
          </ol>
        </details>

        {estado === "cargando" && (
          <div className="estado-caja" role="status" aria-live="polite">
            <div className="spinner spinner-grande" aria-hidden="true" />
            <p className="estado-caja-texto">Revisando lo urgente de hoy...</p>
          </div>
        )}

        {estado === "error" && (
          <div className="estado-caja">
            <p className="alerta alerta-error" role="alert" style={{ margin: 0 }}>
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
            <p className="estado-caja-titulo">
              Hoy no tienes gestiones urgentes
            </p>
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
                <p
                  className="texto-ayuda-campo"
                  style={{ padding: "0.4rem 0" }}
                >
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

      {mostrarResolucionHoras && (
        <div
          className="modal-fondo resolucion-horas-fondo"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
            background: "rgba(21, 10, 46, 0.72)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <div
            className="modal resolucion-horas-tarjeta"
            role="dialog"
            aria-modal="true"
            aria-labelledby="resolucion-horas-titulo"
            style={{
              width: "100%",
              maxWidth: "560px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "2.2rem",
              borderRadius: "28px",
              background: "#150a2e",
              color: "#ffffff",
              border: "1px solid rgba(109,77,246,0.4)",
              boxShadow: "0 30px 100px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏳</div>

            <p
              style={{
                margin: "0 0 0.6rem",
                color: "#d7f25e",
                fontSize: "0.78rem",
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              ORGANIZACIÓN DIARIA
            </p>

            <h2
              id="resolucion-horas-titulo"
              style={{
                margin: "0 0 0.8rem",
                color: "#ffffff",
                fontSize: "clamp(1.7rem, 4vw, 2.15rem)",
                lineHeight: 1.15,
                letterSpacing: "-0.04em",
                fontWeight: 800,
              }}
            >
              Tu día necesita reorganizarse
            </h2>

            <p
              style={{
                margin: "0 0 1.5rem",
                color: "#d4cee8",
                fontSize: "1rem",
                lineHeight: 1.7,
              }}
            >
              Tu planificación supera el tiempo que tienes disponible.
              Ajustémosla para que puedas avanzar sin sobrecargar tu día.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "0.7rem",
                marginBottom: "1.4rem",
              }}
            >
              <div
                style={{
                  padding: "1rem 0.6rem",
                  borderRadius: "16px",
                  background: "#2a1758",
                  border: "1px solid rgba(109, 77, 246, 0.4)",
                  textAlign: "center",
                }}
              >
                <span
                  style={{
                    display: "block",
                    color: "#c9bfff",
                    fontSize: "0.78rem",
                  }}
                >
                  Programadas
                </span>
                <strong
                  style={{
                    display: "block",
                    marginTop: "0.4rem",
                    fontSize: "1.7rem",
                    color: "#ffffff",
                  }}
                >
                  {horasPendientesHoy} h
                </strong>
              </div>

              <div
                style={{
                  padding: "1rem 0.6rem",
                  borderRadius: "16px",
                  background: "rgba(20, 184, 166, 0.15)",
                  border: "1px solid rgba(20, 184, 166, 0.4)",
                  textAlign: "center",
                }}
              >
                <span
                  style={{
                    display: "block",
                    color: "#7cebe0",
                    fontSize: "0.78rem",
                  }}
                >
                  Tu límite
                </span>
                <strong
                  style={{
                    display: "block",
                    marginTop: "0.4rem",
                    fontSize: "1.7rem",
                    color: "#14b8a6",
                  }}
                >
                  {limiteHorasDiarias} h
                </strong>
              </div>

              <div
                style={{
                  padding: "1rem 0.6rem",
                  borderRadius: "16px",
                  background: "rgba(215, 242, 94, 0.12)",
                  border: "1px solid rgba(215, 242, 94, 0.35)",
                  textAlign: "center",
                }}
              >
                <span
                  style={{
                    display: "block",
                    color: "#ffb4a8",
                    fontSize: "0.78rem",
                  }}
                >
                  Exceso
                </span>
                <strong
                  style={{
                    display: "block",
                    marginTop: "0.4rem",
                    fontSize: "1.7rem",
                    color: "#ff8a7a",
                  }}
                >
                  {excesoHorasHoy} h
                </strong>
              </div>
            </div>

            <p
              style={{
                margin: "0 0 1.2rem",
                color: "#d4cee8",
                fontSize: "0.96rem",
                lineHeight: 1.6,
              }}
            >
              ¿Cómo quieres resolverlo? Elige una opción para continuar.
            </p>

            {modoResolucionHoras === null && (
              <div style={{ display: "grid", gap: "0.8rem" }}>
                <button
                  type="button"
                  className="btn btn-primario btn-ancho"
                  onClick={abrirOpcionesReprogramacion}
                >
                  Reprogramar gestiones
                </button>

                <button
                  type="button"
                  className="btn btn-fantasma btn-ancho"
                  style={{ color: "#ffffff" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#000000";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#ffffff";
                  }}
                  onClick={() => {
                    setNuevoLimiteHoras(limiteHorasDiarias);
                    setMensajeLimiteHoras("");
                    setModoResolucionHoras("limite");
                  }}
                >
                  Cambiar mi límite
                </button>
              </div>
            )}

            {modoResolucionHoras === "reprogramar" && (
              <div style={{ marginTop: "1rem" }}>
                <p>Selecciona una gestión de hoy para cambiarle la fecha:</p>

                {paraHoy.length === 0 ? (
                  <p className="texto-ayuda-campo">
                    No hay gestiones con fecha de hoy para seleccionar.
                  </p>
                ) : (
                  <div style={{ display: "grid", gap: "0.65rem" }}>
                    {paraHoy.map((gestion) => (
                      <label
                        key={gestion.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.7rem",
                          padding: "0.8rem",
                          border: "1px solid var(--borde, #d7dce2)",
                          borderRadius: "12px",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="radio"
                          name="gestion-reprogramar"
                          checked={gestionesSeleccionadas.includes(gestion.id)}
                          onChange={() => {
                            setGestionesSeleccionadas([gestion.id]);
                            setMensajeReorganizacion("");
                          }}
                        />
                        <span>
                          <strong>{gestion.titulo}</strong>
                          <span
                            style={{ display: "block", fontSize: "0.9rem" }}
                          >
                            {gestion.horas_estimadas} h estimadas
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {mensajeReorganizacion && (
                  <p className="alerta alerta-error" role="alert">
                    {mensajeReorganizacion}
                  </p>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: "0.7rem",
                    marginTop: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-primario"
                    style={{ flex: 1 }}
                    onClick={elegirGestionParaReprogramar}
                    disabled={paraHoy.length === 0}
                  >
                    Cambiar fecha
                  </button>

                  <button
                    type="button"
                    className="btn btn-fantasma"
                    style={{ color: "#ffffff" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#000000";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#ffffff";
                    }}
                    onClick={() => {
                      setModoResolucionHoras(null);
                      setGestionesSeleccionadas([]);
                      setMensajeReorganizacion("");
                    }}
                  >
                    Volver
                  </button>
                </div>
              </div>
            )}

            {modoResolucionHoras === "limite" && (
              <form
                onSubmit={guardarNuevoLimite}
                style={{ marginTop: "1rem" }}
              >
                <div className="campo">
                  <label htmlFor="nuevo-limite-horas">
                    Nuevo límite de horas por día
                  </label>
                  <input
                    id="nuevo-limite-horas"
                    type="number"
                    min="1"
                    max="16"
                    step="1"
                    value={nuevoLimiteHoras}
                    onChange={(e) => {
                      setNuevoLimiteHoras(e.target.value);
                      setMensajeLimiteHoras("");
                    }}
                    disabled={guardandoLimiteHoras}
                    required
                  />
                  <span className="texto-ayuda-campo">
                    Introduce un número entero entre 1 y 16.
                  </span>
                </div>

                {mensajeLimiteHoras && (
                  <p className="alerta alerta-error" role="alert">
                    {mensajeLimiteHoras}
                  </p>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: "0.7rem",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="submit"
                    className="btn btn-primario"
                    style={{ flex: 1 }}
                    disabled={guardandoLimiteHoras}
                  >
                    {guardandoLimiteHoras
                      ? "Guardando..."
                      : "Guardar límite"}
                  </button>

                  <button
                    type="button"
                    className="btn btn-fantasma"
                    style={{ color: "#ffffff" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#000000";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#ffffff";
                    }}
                    onClick={() => {
                      setModoResolucionHoras(null);
                      setGestionesSeleccionadas([]);
                      setMensajeReorganizacion("");
                    }}
                  >
                    Volver
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

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
                    setFechasSugeridas([]);
                  }}
                  disabled={guardandoReprogramacion}
                  aria-invalid={!!mensajeReprogramacion}
                  aria-describedby={mensajeReprogramacion ? "nueva-fecha-error" : "nueva-fecha-ayuda"}
                />
                <span className="texto-ayuda-campo" id="nueva-fecha-ayuda">
                  Hoy o más adelante, dentro de los próximos 10 años.
                </span>
                {mensajeReprogramacion && (
                  <span className="error-campo" id="nueva-fecha-error" role="alert">
                    {mensajeReprogramacion}
                  </span>
                )}
              </div>

              {(fechasSugeridas.length > 0 || fechaSugerida) && (
                <div
                  style={{
                    marginTop: "1rem",
                    padding: "1rem",
                    borderRadius: "14px",
                    background: "#f4f8ff",
                    border: "1px solid #d8e5ff",
                  }}
                >
                  <strong style={{ display: "block", marginBottom: "0.4rem" }}>
                    Busquemos un día con espacio
                  </strong>

                  <p id="sugeridas-texto" style={{ margin: "0 0 1rem" }}>
                    La fecha elegida supera tu límite de horas. Estas son las
                    primeras fechas disponibles:
                  </p>
                  <div role="radiogroup" aria-labelledby="sugeridas-texto">

                  {fechasSugeridas.map((opcion) => (
                    <label
                      key={opcion.fecha}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        padding: "0.7rem",
                        marginBottom: "0.5rem",
                        borderRadius: "10px",
                        border:
                          fechaSugerida === opcion.fecha
                            ? "2px solid #6478e8"
                            : "1px solid #d8deea",
                        background: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="fecha-sugerida"
                        value={opcion.fecha}
                        checked={fechaSugerida === opcion.fecha}
                        onChange={() => setFechaSugerida(opcion.fecha)}
                        disabled={guardandoReprogramacion}
                      />

                      <span style={{ flex: 1 }}>
                        <strong>{formatearFechaLarga(opcion.fecha)}</strong>
                        <br />
                        <small>
                          {opcion.horas_disponibles} horas disponibles
                        </small>
                      </span>
                    </label>
                  ))}
                  </div>

                  <button
                    type="button"
                    className="btn btn-primario btn-ancho"
                    onClick={aceptarFechaSugerida}
                    disabled={guardandoReprogramacion || !fechaSugerida}
                  >
                    {guardandoReprogramacion
                      ? "Guardando..."
                      : "Confirmar fecha seleccionada"}
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
                    Queda visible en el evento para que recuerdes el motivo
                    (máx. 300 caracteres).
                  </span>
                </div>
              )}

              {mensajeAccion && (
                <p className="alerta alerta-error" role="alert">
                  {mensajeAccion}
                </p>
              )}

              <div
                style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}
              >
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
          aria-label={`Marcar como hecha: ${gestion.titulo}`}
        >
          Hecha
        </button>
        <button
          type="button"
          className="btn btn-fantasma"
          onClick={() => onPosponer(gestion)}
          aria-label={`Posponer: ${gestion.titulo}`}
        >
          Posponer
        </button>
        <button
          type="button"
          className="btn btn-fantasma"
          onClick={() => onReprogramar(gestion)}
          aria-label={`Reprogramar: ${gestion.titulo}`}
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
