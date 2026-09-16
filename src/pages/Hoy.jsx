import { useState } from 'react';

function Hoy() {
  // Datos de ejemplo  basados en el prototipo de Figma
  const gestiones = [
    {
      id: 1,
      titulo: 'Confirmar menu con catering',
      evento: 'Boda de Laura & Carlos',
      estado: 'Pendiente',
      prioridad: 'Alta',
      fecha: '14 sep 2026',
      horas: '2h est.',
      grupo: 'vencidas'
    },
    {
      id: 2,
      titulo: 'Envio de invitaciones digitales',
      evento: 'Cumpleaños de Martina R.',
      estado: 'En progreso',
      prioridad: 'Alta',
      fecha: '15 sep 2026',
      horas: '1h est.',
      grupo: 'vencidas'
    },
    {
      id: 3,
      titulo: 'Confirmar reserva del salon principal',
      evento: 'Evento Corporativo Nexo',
      estado: 'Pendiente',
      prioridad: 'Alta',
      fecha: '16 sep 2026',
      horas: '1h est.',
      grupo: 'hoy'
    },
    {
      id: 4,
      titulo: 'Solicitar cotizacion a proveedor de sonido',
      evento: 'Boda de Laura & Carlos',
      estado: 'Pendiente',
      prioridad: 'Media',
      fecha: '16 sep 2026',
      horas: '3h est.',
      grupo: 'hoy'
    },
    {
      id: 5,
      titulo: 'Coordinar transporte de invitados',
      evento: 'Boda de Laura & Carlos',
      estado: 'En progreso',
      prioridad: 'Media',
      fecha: '16 sep 2026',
      horas: '2h est.',
      grupo: 'hoy'
    },
    {
      id: 6,
      titulo: 'Diseñar programa del evento',
      evento: 'Evento Corporativo Nexo',
      estado: 'Pendiente',
      prioridad: 'Media',
      fecha: '18 sep 2026',
      horas: '4h est.',
      grupo: 'proximas'
    },
    {
      id: 7,
      titulo: 'Seleccionar decoración floral',
      evento: 'Cumpleaños de Martina R.',
      estado: 'Pendiente',
      prioridad: 'Baja',
      fecha: '19 sep 2026',
      horas: '2h est.',
      grupo: 'proximas'
    },
    {
      id: 8,
      titulo: 'Revisar contrato con fotógrafo',
      evento: 'Boda de Laura & Carlos',
      estado: 'Pendiente',
      prioridad: 'Baja',
      fecha: '20 sep 2026',
      horas: '1h est.',
      grupo: 'proximas'
    }
  ];

  const [mostrarVacio, setMostrarVacio] = useState(false);

  const vencidas = gestiones.filter(g => g.grupo === 'vencidas');
  const paraHoy = gestiones.filter(g => g.grupo === 'hoy');
  const proximas = gestiones.filter(g => g.grupo === 'proximas');

  // Estilos simples
  const styles = {
    page: {
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f7f7f5',
      minHeight: '100vh',
      padding: '20px',
      color: '#1a1a1a'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px'
    },
    logo: {
      fontSize: '20px',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    btnCrear: {
      backgroundColor: '#1a1a1a',
      color: 'white',
      border: 'none',
      padding: '10px 18px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: 'bold'
    },
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      marginBottom: '4px'
    },
    subtitle: {
      color: '#666',
      marginBottom: '24px'
    },
    cards: {
      display: 'flex',
      gap: '12px',
      marginBottom: '30px',
      flexWrap: 'wrap'
    },
    card: {
      backgroundColor: 'white',
      padding: '16px 20px',
      borderRadius: '12px',
      minWidth: '120px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
    },
    groupTitle: {
      fontSize: '14px',
      fontWeight: 'bold',
      marginBottom: '12px',
      marginTop: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    gestion: {
      backgroundColor: 'white',
      padding: '14px 16px',
      borderRadius: '10px',
      marginBottom: '10px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      borderLeft: '4px solid'
    },
    empty: {
      textAlign: 'center',
      padding: '80px 20px'
    }
  };

  if (mostrarVacio) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <div style={styles.logo}>⬛ Eventos</div>
          <div>
            <button 
              onClick={() => setMostrarVacio(false)} 
              style={{ marginRight: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
            >
              Ver gestiones
            </button>
            <button style={styles.btnCrear}>+ Crear evento</button>
          </div>
        </div>

        <h1 style={styles.title}>Hoy</h1>
        <p style={styles.subtitle}>Gestiones que requieren tu atención</p>

        <div style={styles.empty}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>✅</div>
          <h2>No tienes gestiones urgentes para hoy</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            Cuando tengas eventos con gestiones pendientes,<br />
            apareceran aqui organizadas por prioridad.
          </p>
          <button style={styles.btnCrear}>+ Crear evento</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>⬛ Eventos</div>
        <div>
          <button 
            onClick={() => setMostrarVacio(true)} 
            style={{ marginRight: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
          >
            Ver estado vacío
          </button>
          <button style={styles.btnCrear}>+ Crear evento</button>
        </div>
      </div>

      {/* Título */}
      <h1 style={styles.title}>Hoy</h1>
      <p style={styles.subtitle}>Gestiones que requieren tu atencion</p>

      {/* Tarjetas resumen */}
      <div style={styles.cards}>
        <div style={styles.card}>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>8</div>
          <div style={{ color: '#666', fontSize: '14px' }}>Total gestiones</div>
        </div>
        <div style={styles.card}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e11d48' }}>2</div>
          <div style={{ color: '#666', fontSize: '14px' }}>Vencidas</div>
        </div>
        <div style={styles.card}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d97706' }}>3</div>
          <div style={{ color: '#666', fontSize: '14px' }}>Para hoy</div>
        </div>
        <div style={styles.card}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>3</div>
          <div style={{ color: '#666', fontSize: '14px' }}>Completadas</div>
        </div>
      </div>

      {/* Vencidas */}
      <div style={{ ...styles.groupTitle, color: '#e11d48' }}>
        ● VENCIDAS <span style={{ background: '#fee2e2', padding: '2px 8px', borderRadius: '10px', fontSize: '12px' }}>{vencidas.length}</span>
      </div>
      {vencidas.map(g => (
        <div key={g.id} style={{ ...styles.gestion, borderLeftColor: '#e11d48' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{g.titulo}</div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '6px' }}>{g.evento}</div>
          <div style={{ fontSize: '13px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: '10px' }}>{g.estado}</span>
            <span style={{ background: '#fee2e2', color: '#be123c', padding: '2px 8px', borderRadius: '10px' }}>{g.prioridad}</span>
            <span>📅 {g.fecha}</span>
            <span>⏱️ {g.horas}</span>
          </div>
        </div>
      ))}

      {/* Para hoy */}
      <div style={{ ...styles.groupTitle, color: '#d97706' }}>
        ● PARA HOY <span style={{ background: '#ffedd5', padding: '2px 8px', borderRadius: '10px', fontSize: '12px' }}>{paraHoy.length}</span>
      </div>
      {paraHoy.map(g => (
        <div key={g.id} style={{ ...styles.gestion, borderLeftColor: '#d97706' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{g.titulo}</div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '6px' }}>{g.evento}</div>
          <div style={{ fontSize: '13px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: '10px' }}>{g.estado}</span>
            <span style={{ background: '#ffedd5', color: '#c2410c', padding: '2px 8px', borderRadius: '10px' }}>{g.prioridad}</span>
            <span>📅 {g.fecha}</span>
            <span>⏱️ {g.horas}</span>
          </div>
        </div>
      ))}

      {/* Próximas */}
      <div style={{ ...styles.groupTitle, color: '#2563eb' }}>
        ● PRÓXIMAS <span style={{ background: '#dbeafe', padding: '2px 8px', borderRadius: '10px', fontSize: '12px' }}>{proximas.length}</span>
      </div>
      {proximas.map(g => (
        <div key={g.id} style={{ ...styles.gestion, borderLeftColor: '#2563eb' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{g.titulo}</div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '6px' }}>{g.evento}</div>
          <div style={{ fontSize: '13px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: '10px' }}>{g.estado}</span>
            <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '10px' }}>{g.prioridad}</span>
            <span>📅 {g.fecha}</span>
            <span>⏱️ {g.horas}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Hoy;