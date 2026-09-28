import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

export default function Hoy() {
  // Datos de ejemplo (luego se reemplazan por la API)
  const [gestiones] = useState([
    {
      id: 1,
      titulo: 'Confirmar catering',
      evento: 'Boda Ana & Carlos',
      fecha: '2026-09-28',
      estado: 'pendiente',
      prioridad: 'alta',
    },
    {
      id: 2,
      titulo: 'Enviar invitaciones',
      evento: 'Cumpleaños 30',
      fecha: '2026-09-28',
      estado: 'pendiente',
      prioridad: 'media',
    },
    {
      id: 3,
      titulo: 'Reservar local',
      evento: 'Lanzamiento producto',
      fecha: '2026-09-27',
      estado: 'vencida',
      prioridad: 'alta',
    },
    {
      id: 4,
      titulo: 'Reunión con proveedor',
      evento: 'Boda Ana & Carlos',
      fecha: '2026-09-30',
      estado: 'proxima',
      prioridad: 'baja',
    },
  ]);

  const vencidas = gestiones.filter((g) => g.estado === 'vencida');
  const paraHoy = gestiones.filter((g) => g.estado === 'pendiente');
  const proximas = gestiones.filter((g) => g.estado === 'proxima');

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

        {/* Vencidas */}
        {vencidas.length > 0 && (
          <section style={styles.section}>
            <h2 style={{ ...styles.sectionTitle, color: '#dc2626' }}>
              Vencidas ({vencidas.length})
            </h2>
            <div style={styles.lista}>
              {vencidas.map((g) => (
                <GestionCard key={g.id} gestion={g} />
              ))}
            </div>
          </section>
        )}

        {/* Para hoy */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            Para hoy ({paraHoy.length})
          </h2>
          {paraHoy.length === 0 ? (
            <p style={styles.empty}>No tienes gestiones para hoy 🎉</p>
          ) : (
            <div style={styles.lista}>
              {paraHoy.map((g) => (
                <GestionCard key={g.id} gestion={g} />
              ))}
            </div>
          )}
        </section>

        {/* Próximas */}
        {proximas.length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              Próximas ({proximas.length})
            </h2>
            <div style={styles.lista}>
              {proximas.map((g) => (
                <GestionCard key={g.id} gestion={g} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function GestionCard({ gestion }) {
  return (
    <Link to={`/evento/${gestion.id}`} style={styles.card}>
      <div style={styles.cardLeft}>
        <strong style={styles.cardTitulo}>{gestion.titulo}</strong>
        <span style={styles.cardEvento}>{gestion.evento}</span>
      </div>
      <div style={styles.cardRight}>
        <span
          style={{
            ...styles.badge,
            backgroundColor:
              gestion.prioridad === 'alta'
                ? '#fee2e2'
                : gestion.prioridad === 'media'
                ? '#fef3c7'
                : '#e0f2fe',
            color:
              gestion.prioridad === 'alta'
                ? '#b91c1c'
                : gestion.prioridad === 'media'
                ? '#b45309'
                : '#0369a1',
          }}
        >
          {gestion.prioridad}
        </span>
      </div>
    </Link>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  main: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '24px 16px',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e3a5f',
  },
  btnCrear: {
    backgroundColor: '#1e3a5f',
    color: 'white',
    padding: '10px 18px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
  },
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '12px',
  },
  empty: {
    color: '#64748b',
    fontSize: '15px',
    padding: '20px 0',
  },
  lista: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  card: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: '16px 18px',
    borderRadius: '10px',
    textDecoration: 'none',
    color: 'inherit',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0',
  },
  cardLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  cardTitulo: {
    fontSize: '15px',
    color: '#1e293b',
  },
  cardEvento: {
    fontSize: '13px',
    color: '#64748b',
  },
  cardRight: {},
  badge: {
    fontSize: '12px',
    fontWeight: '600',
    padding: '4px 10px',
    borderRadius: '20px',
    textTransform: 'capitalize',
  },
};