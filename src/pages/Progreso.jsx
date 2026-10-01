import Header from "../components/Header";

function Progreso() {
  // Datos de ejemplo (luego se reemplazan por la API)
  const resumen = {
    totalEventos: 0,
    gestionesCompletadas: 0,
    gestionesPendientes: 0,
    gestionesVencidas: 0,
  };

  const tarjetas = [
    { valor: resumen.totalEventos, etiqueta: "Eventos activos", color: "var(--violeta)" },
    { valor: resumen.gestionesCompletadas, etiqueta: "Gestiones completadas", color: "var(--verde)" },
    { valor: resumen.gestionesPendientes, etiqueta: "Gestiones pendientes", color: "#f2a33c" },
    { valor: resumen.gestionesVencidas, etiqueta: "Gestiones vencidas", color: "var(--rojo)" },
  ];

  return (
    <div className="pagina">
      <Header />

      <main className="contenedor contenedor-estrecho">
        <div className="cabecera-pagina">
          <h1>Progreso</h1>
          <p>Resumen de tu actividad como organizador de eventos.</p>
        </div>

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
          Cuando el backend exponga estas métricas, aquí verás tu progreso real.
        </p>
      </main>
    </div>
  );
}

export default Progreso;