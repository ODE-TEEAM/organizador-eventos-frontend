import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export default function Registro() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    password2: "",
  });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [loading, setLoading] = useState(false);
  const [exito, setExito] = useState(false);

  const manejarCambio = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errores[e.target.name]) {
      setErrores({ ...errores, [e.target.name]: undefined });
    }
  };

  const validar = () => {
    const nuevos = {};
    if (!form.email.trim()) {
      nuevos.email = "El correo es obligatorio.";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      nuevos.email = "Escribe un correo válido.";
    }
    if (!form.password) {
      nuevos.password = "La contraseña es obligatoria.";
    } else if (form.password.length < 6) {
      nuevos.password = "Mínimo 6 caracteres.";
    }
    if (!form.password2) {
      nuevos.password2 = "Confirma tu contraseña.";
    } else if (form.password !== form.password2) {
      nuevos.password2 = "Las contraseñas no coinciden.";
    }
    return nuevos;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorGeneral("");
    setExito(false);

    const nuevosErrores = validar();
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    setLoading(true);

    try {
      // Endpoint típico de registro. Si tu BE usa otro, cámbialo aquí.
      const response = await fetch(`${API_URL}/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Si el backend devuelve errores por campo
        if (data.email) {
          setErrores({ email: Array.isArray(data.email) ? data.email[0] : data.email });
        }
        setErrorGeneral(
          data.detail || data.message || "No se pudo crear la cuenta. Intenta de nuevo."
        );
        setLoading(false);
        return;
      }

      setExito(true);
      setLoading(false);

      // Después de 1.5s manda al login
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setErrorGeneral(
        "No se pudo conectar con el servidor. Verifica que el backend esté encendido."
      );
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <img src="/hestia-logo.png" alt="HEstia" style={styles.logo} />
          <h1 style={styles.title}>Crear cuenta</h1>
          <p style={styles.subtitle}>Regístrate para empezar a organizar eventos</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <div style={styles.field}>
            <label style={styles.label}>Correo electrónico</label>
            <input
              type="email"
              name="email"
              placeholder="ejemplo@correo.com"
              value={form.email}
              onChange={manejarCambio}
              style={{
                ...styles.input,
                borderColor: errores.email ? "#dc2626" : "#cbd5e1",
              }}
              disabled={loading}
            />
            {errores.email && <p style={styles.errorCampo}>{errores.email}</p>}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              name="password"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={manejarCambio}
              style={{
                ...styles.input,
                borderColor: errores.password ? "#dc2626" : "#cbd5e1",
              }}
              disabled={loading}
            />
            {errores.password && (
              <p style={styles.errorCampo}>{errores.password}</p>
            )}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Confirmar contraseña</label>
            <input
              type="password"
              name="password2"
              placeholder="Repite la contraseña"
              value={form.password2}
              onChange={manejarCambio}
              style={{
                ...styles.input,
                borderColor: errores.password2 ? "#dc2626" : "#cbd5e1",
              }}
              disabled={loading}
            />
            {errores.password2 && (
              <p style={styles.errorCampo}>{errores.password2}</p>
            )}
          </div>

          {errorGeneral && <p style={styles.errorGeneral}>{errorGeneral}</p>}
          {exito && (
            <p style={styles.exito}>
              Cuenta creada correctamente. Redirigiendo al login...
            </p>
          )}

          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            disabled={loading}
          >
            {loading ? "Creando cuenta..." : "Registrarme"}
          </button>
        </form>

        <p style={styles.footer}>
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" style={styles.link}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f4f8",
    padding: "20px",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "40px 32px",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  },
  logoContainer: {
    textAlign: "center",
    marginBottom: "28px",
  },
  logo: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    objectFit: "cover",
    marginBottom: "12px",
  },
  title: {
    margin: 0,
    fontSize: "26px",
    fontWeight: "700",
    color: "#1e3a5f",
  },
  subtitle: {
    margin: "6px 0 0",
    fontSize: "14px",
    color: "#64748b",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#334155",
  },
  input: {
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    outline: "none",
  },
  errorCampo: {
    margin: 0,
    fontSize: "13px",
    color: "#dc2626",
  },
  errorGeneral: {
    margin: 0,
    fontSize: "14px",
    color: "#dc2626",
    textAlign: "center",
    backgroundColor: "#fef2f2",
    padding: "10px",
    borderRadius: "8px",
  },
  exito: {
    margin: 0,
    fontSize: "14px",
    color: "#166534",
    textAlign: "center",
    backgroundColor: "#dcfce7",
    padding: "10px",
    borderRadius: "8px",
  },
  button: {
    marginTop: "8px",
    padding: "14px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#1e3a5f",
    color: "white",
    fontSize: "16px",
    fontWeight: "600",
  },
  footer: {
    marginTop: "24px",
    textAlign: "center",
    fontSize: "14px",
    color: "#64748b",
  },
  link: {
    color: "#1e3a5f",
    fontWeight: "600",
    textDecoration: "none",
  },
};