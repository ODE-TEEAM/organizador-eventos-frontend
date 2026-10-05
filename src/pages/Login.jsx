import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { guardarSesion, estaAutenticado } from "../auth";
import AvatarAnimal from "../components/AvatarAnimal";
import InputPassword from "../components/InputPassword";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const FLOTANTES = [
  { indice: 0, size: 88, style: { top: "14%", left: "7%", animationDelay: "0s" } },
  { indice: 2, size: 64, style: { top: "9%", right: "10%", animationDelay: "1.2s" } },
  { indice: 5, size: 76, style: { bottom: "16%", left: "12%", animationDelay: "2.1s" } },
  { indice: 7, size: 96, style: { bottom: "10%", right: "7%", animationDelay: "0.6s" } },
  { indice: 4, size: 54, style: { top: "44%", left: "22%", animationDelay: "3s" } },
  { indice: 6, size: 58, style: { top: "52%", right: "20%", animationDelay: "1.8s" } },
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (estaAutenticado()) {
      navigate("/hoy", { replace: true });
    }
  }, [navigate]);

  const validar = () => {
    const nuevos = {};
    if (!email.trim()) {
      nuevos.email = "Escribe tu correo para poder entrar.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      nuevos.email = "Ese correo no parece completo. Revísalo e intenta de nuevo.";
    }
    if (!password) {
      nuevos.password = "Escribe tu contraseña para continuar.";
    }
    return nuevos;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorGeneral("");
    const nuevosErrores = validar();
    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorGeneral(
          "No reconocemos ese correo con esa contraseña. " +
            "Revisa que estén bien escritos e intenta de nuevo."
        );
        setLoading(false);
        return;
      }

      guardarSesion(data);
      navigate("/hoy", { replace: true });
    } catch (err) {
      setErrorGeneral(
        "No pudimos conectar con el servidor. " +
          "Verifica que el backend esté encendido e intenta de nuevo."
      );
      setLoading(false);
    }
  };

  return (
    <div className="auth-pagina">
      {FLOTANTES.map((f, i) => (
        <AvatarAnimal
          key={i}
          indice={f.indice}
          size={f.size}
          className="auth-flotante"
          style={f.style}
        />
      ))}

      <div className="auth-tarjeta">
        <div className="auth-cabecera">
          <img src="/hestia-logo.png" alt="HEstia" className="auth-logo" />
          <h1 className="auth-titulo">Bienvenido de nuevo</h1>
          <p className="auth-subtitulo">
            Entra a HEstia y ten cada evento bajo control.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="campo">
            <label htmlFor="login-email">Correo electrónico</label>
            <input
              id="login-email"
              type="email"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errores.email) setErrores({ ...errores, email: undefined });
              }}
              aria-invalid={!!errores.email}
              disabled={loading}
            />
            {errores.email && <span className="error-campo">{errores.email}</span>}
          </div>

          <div className="campo">
            <label htmlFor="login-password">Contraseña</label>
            <InputPassword
              id="login-password"
              name="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errores.password)
                  setErrores({ ...errores, password: undefined });
              }}
              ariaInvalid={!!errores.password}
              disabled={loading}
              autoComplete="current-password"
            />
            {errores.password && (
              <span className="error-campo">{errores.password}</span>
            )}
          </div>

          {errorGeneral && (
            <p className="alerta alerta-error" style={{ margin: "0 0 1rem" }}>
              {errorGeneral}
            </p>
          )}

          <button type="submit" className="btn btn-primario btn-ancho" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? "Entrando..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="auth-pie">
          ¿No tienes cuenta?{" "}
          <Link to="/registro">Regístrate gratis</Link>
        </p>
      </div>
    </div>
  );
}
