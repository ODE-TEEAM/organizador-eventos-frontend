import Header from "../components/Header";

function Progreso() {
  // Datos de ejemplo (luego se reemplazan por la API)
  const resumen = {
    totalEventos: 0,
    gestionesCompletadas: 0,
    gestionesPendientes: 0,
    gestionesVencidas: 0,
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <Header />

      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 16px" }}>
        <h1 style={{ margin: "0 0 8px", fontSize: "28px", fontWeight: "700", color: "#1e3a5f" }}>
          Progreso
        </h1>
        <p style={{ margin: "0 0 32px", color: "#64748b", fontSize: "15px" }}>
          Resumen de tu actividad como organizador
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "16px",
          }}
        >
          <div style={cardStyle}>
            <span style={{ ...numeroStyle, color: "#1e3a5f" }}>{resumen.totalEventos}</span>
            <span style={labelStyle}>Eventos activos</span>
          </div>

          <div style={cardStyle}>
            <span style={{ ...numeroStyle, color: "#16a34a" }}>{resumen.gestionesCompletadas}</span>
            <span style={labelStyle}>Gestiones completadas</span>
          </div>

          <div style={cardStyle}>
            <span style={{ ...numeroStyle, color: "#ca8a04" }}>{resumen.gestionesPendientes}</span>
            <span style={labelStyle}>Gestiones pendientes</span>
          </div>

          <div style={cardStyle}>
            <span style={{ ...numeroStyle, color: "#dc2626" }}>{resumen.gestionesVencidas}</span>
            <span style={labelStyle}>Gestiones vencidas</span>
          </div>
        </div>

        <p style={{ marginTop: "40px", color: "#94a3b8", fontSize: "14px", textAlign: "center" }}>
          Cuando el backend esté listo, aquí se mostrará el progreso real de tus eventos.
        </p>
      </main>
    </div>
  );
}

const cardStyle = {
  backgroundColor: "white",
  padding: "24px 20px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "8px",
  textAlign: "center",
};

const numeroStyle = {
  fontSize: "32px",
  fontWeight: "700",
};

const labelStyle = {
  fontSize: "13px",
  color: "#64748b",
};

export default Progreso;