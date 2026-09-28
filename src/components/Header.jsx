import { useNavigate } from 'react-router-dom';
import { cerrarSesion, obtenerUsuario } from '../auth';

export default function Header() {
  const navigate = useNavigate();
  const usuario = obtenerUsuario();

  const handleLogout = () => {
    cerrarSesion();
    navigate('/login', { replace: true });
  };

  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <img
          src="/hestia-logo.png"
          alt="HEstia"
          style={styles.logo}
        />
        <span style={styles.brand}>HEstia</span>
      </div>

      <div style={styles.right}>
        {usuario && (
          <span style={styles.user}>
            {usuario.email || usuario.nombre || 'Organizador'}
          </span>
        )}
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 24px',
    backgroundColor: '#1e3a5f',
    color: 'white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logo: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  brand: {
    fontSize: '18px',
    fontWeight: '700',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  user: {
    fontSize: '14px',
    opacity: 0.9,
  },
  logoutBtn: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(255,255,255,0.4)',
    color: 'white',
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: '500',
  },
};