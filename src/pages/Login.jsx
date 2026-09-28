import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { guardarSesion, estaAutenticado } from '../auth';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Si ya está autenticado, mandarlo a /hoy
  useEffect(() => {
    if (estaAutenticado()) {
      navigate('/hoy', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validación básica
    if (!email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || data.message || 'Credenciales incorrectas.');
        setLoading(false);
        return;
      }

      // Guardar sesión
      guardarSesion(data);

      // Redirigir a Hoy
      navigate('/hoy', { replace: true });
    } catch (err) {
      setError('No se pudo conectar con el servidor. Verifique que el backend esté encendido.');
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoContainer}>
          <img
            src="/hestia-logo.png"
            alt="HEstia"
            style={styles.logo}
          />
          <h1 style={styles.title}>HEstia</h1>
          <p style={styles.subtitle}>Organizador de eventos independientes</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Correo electrónico</label>
            <input
              type="email"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              disabled={loading}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f4f8',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '40px 32px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
  },
  logoContainer: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logo: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    objectFit: 'cover',
    marginBottom: '12px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e3a5f',
  },
  subtitle: {
    margin: '6px 0 0',
    fontSize: '14px',
    color: '#64748b',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#334155',
  },
  input: {
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '15px',
    outline: 'none',
  },
  error: {
    color: '#dc2626',
    fontSize: '14px',
    margin: 0,
    textAlign: 'center',
  },
  button: {
    marginTop: '8px',
    padding: '14px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#1e3a5f',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
  },
};