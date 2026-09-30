import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { getAuthHeaders } from "../auth";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export default function Hoy() {
  const [vencidas, setVencidas] = useState([]);
  const [paraHoy, setParaHoy] = useState([]);
  const [proximas, setProximas] = useState([]);
  const [estado, setEstado] = useState("cargando"); // cargando | listo | error | vacio
  const [mensajeError, setMensajeError] = useState("");

  const cargarGestiones = async () => {
    setEstado("cargando");
    setMensajeError("");

    try {
      const respuesta = await fetch(`${API_URL}/hoy/`, {
        headers: getAuthHeaders(),
      });

      if (respuesta.status === 401) {
        setMensajeError("Tu sesión expiró. Vuelve a iniciar sesión.");
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

      if (total === 0) {
        setEstado("vacio");
      } else {
        setEstado("listo");
      }
    } catch (err) {
      console.error(err);
      setMensajeError(
        "No se pudieron cargar las gestiones. Verifica que el backend esté encendido."
      );
      setEstado("error");
    }
  };

  useEffect(() => {
    cargarGestiones();
  }, []);

  return (
    <div style={styles.page}>
      <Header />

      <main style={styles.main}>
        <div style={styles.topBar}>
          <h1 style={styles.title}>Hoy</h1>
          <Link to="/crear" style={styles.btnCrear}>
            + Crear evento
          </Link>
        </div>

        {/* Regla de priorización (C3) */}
        <div style={styles.regla}>
          <strong>Cómo se priorizan tus gestiones:</strong>
          <p style={styles.reglaTexto}>
            1. Primero las <strong>vencidas</strong> (ya pasaron de fecha).
            <br />
            2. Luego las de <strong>hoy</strong>.
            <br />
            3. Después las <strong>próximas</strong>.
            <br />
            Dentro de cada grupo se ordenan por fecha y, si empatan, por menor
            esfuerzo estimado.
          </p>
        </div>

        {/* Cargando */}
        {estado === "cargando" && (
          <div style={styles.estadoBox}>
            <div style={styles.spinner} />
            <p>Cargando tus gestiones del día...</p>
          </div>
        )}

        {/* Error */}
        {estado === "error" && (
          <div style={styles.estadoBox}>
            <p style={{ color: "#dc2626", marginBottom: "12px" }}>
              {mensajeError}
            </p>
            <button onClick={cargarGestiones} style={styles.btnReintentar}>
              Reintentar
            </button>
          </div>
        )}

        {/* Vacío */}
        {estado === "vacio" && (
          <div style={styles.estadoBox}>
            <p style={{ marginBottom: "8px" }}>
              No tienes gestiones pendientes por ahora.
            </p>
            <p style={{ color: "#64748b", marginBottom: "16px" }}>
              Crea un evento y agrega gestiones logísticas para verlas aquí.
            </p>
            <Link to="/crear" style={styles.btnCrear}>
              + Crear evento
            </Link>
          </div>
        )}

        {/* Listo */}
        {estado === "listo" && (
          <>
            {vencidas.length > 0 && (
              <section style={styles.section}>
                <h2 style={{ ...styles.sectionTitle, color: "#dc2626" }}>
                  Vencidas ({vencidas.length})
                </h2>
                <div style={styles.lista}>
                  {vencidas.map((g) => (
                    <GestionCard key={g.id} gestion={g} tipo="vencida" />
                  ))}
                </div>
              </section>
            )}

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>
                Para hoy ({paraHoy.length})
              </h2>
              {paraHoy.length === 0 ? (
                <p style={styles.empty}>No tienes gestiones para hoy</p>
              ) : (
                <div style={styles.lista}>
                  {paraHoy.map((g) => (
                    <GestionCard key={g.id} gestion={g} tipo="para_hoy" />
                  ))}
                </div>
              )}
            </section>

            {proximas.length > 0 && (
              <section style={styles.section}>
                <h2 style={styles.sectionTitle}>
                  Próximas ({proximas.length})
                </h2>
                <div style={styles.lista}>
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
  const colorBorde =
    tipo === "vencida"
      ? "#fecaca"
      : tipo === "para_hoy"
      ? "#fde68a"
      : "#e2e8f0";

  return (
    <Link
      to={`/evento/${gestion.evento_id || gestion.id}`}
      style={{
        ...styles.card,
        borderColor: colorBorde,
        borderLeftWidth: "4px",
      }}
    >
      <div style={styles.cardLeft}>
        <strong style={styles.cardTitulo}>{gestion.titulo}</strong>
        <span style={styles.cardEvento}>{gestion.evento}</span>
        <span style={styles.cardMeta}>
          {gestion.fecha} · {gestion.horas_estimadas} h
        </span>
      </div>
      <div style={styles.cardRight}>
        {tipo === "vencida" && (
          <span
            style={{
              ...styles.badge,
              backgroundColor: "#fee2e2",
              color: "#b91c1c",
            }}
          >
            Vencida
          </span>
        )}
        {tipo === "para_hoy" && (
          <span
            style={{
              ...styles.badge,
              backgroundColor: "#fef3c7",
              color: "#b45309",
            }}
          >
            Hoy
          </span>
        )}
        {tipo === "proxima" && (
          <span
            style={{
              ...styles.badge,
              backgroundColor: "#e0f2fe",
              color: "#0369a1",
            }}
          >
            Próxima
          </span>
        )}
      </div>
    </Link>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  main: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "24px 16px",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  title: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "700",
    color: "#1e3a5f",
  },
  btnCrear: {
    backgroundColor: "#1e3a5f",
    color: "white",
    padding: "10px 18px",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "600",
  },
  regla: {
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "10px",
    padding: "14px 16px",
    marginBottom: "28px",
    fontSize: "14px",
    color: "#1e3a5f",
  },
  reglaTexto: {
    margin: "8px 0 0",
    lineHeight: 1.5,
    color: "#334155",
  },
  section: {
    marginBottom: "32px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#334155",
    marginBottom: "12px",
  },
  empty: {
    color: "#64748b",
    fontSize: "15px",
    padding: "12px 0",
  },
  lista: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  card: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: "16px 18px",
    borderRadius: "10px",
    textDecoration: "none",
    color: "inherit",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    border: "1px solid #e2e8f0",
  },
  cardLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },
  cardTitulo: {
    fontSize: "15px",
    color: "#1e293b",
  },
  cardEvento: {
    fontSize: "13px",
    color: "#64748b",
  },
  cardMeta: {
    fontSize: "12px",
    color: "#94a3b8",
  },
  cardRight: {},
  badge: {
    fontSize: "12px",
    fontWeight: "600",
    padding: "4px 10px",
    borderRadius: "20px",
  },
  estadoBox: {
    textAlign: "center",
    padding: "40px 20px",
    backgroundColor: "white",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  spinner: {
    width: "28px",
    height: "28px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#1e3a5f",
    borderRadius: "50%",
    margin: "0 auto 12px",
    animation: "spin 0.8s linear infinite",
  },
  btnReintentar: {
    backgroundColor: "#1e3a5f",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
};