import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AvatarAnimal, { animalDe } from "../components/AvatarAnimal";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const FLOTANTES = [
  { indice: 1, size: 84, style: { top: "12%", left: "9%", animationDelay: "0.4s" } },
  { indice: 3, size: 62, style: { top: "16%", right: "8%", animationDelay: "1.6s" } },
  { indice: 6, size: 78, style: { bottom: "14%", left: "10%", animationDelay: "2.4s" } },
  { indice: 0, size: 92, style: { bottom: "12%", right: "9%", animationDelay: "0.9s" } },
  { indice: 5, size: 52, style: { top: "48%", left: "24%", animationDelay: "3.2s" } },
  { indice: 2, size: 56, style: { top: "40%", right: "22%", animationDelay: "2s" } },
];

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

      setTimeout(() => {
        navigate("/login");
      }, 2600);
    } catch (err) {
      setErrorGeneral(
        "No se pudo conectar con el servidor. Verifica que el backend esté encendido."
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
        {exito ? (
          <div className="auth-exito">
            <div className="auth-exito-avatar">
              <AvatarAnimal semilla={form.email} size={104} />
            </div>
            <h2 className="auth-exito-titulo">¡Cuenta creada!</h2>
            <p className="auth-exito-texto">
              Te presentamos a tu compañero animal: te acompañará en cada evento
              que organices. Te llevamos al inicio de sesión…
            </p>
            <span className="auth-exito-animal">
              ✦ {animalDe(form.email).nombre}
            </span>
          </div>
        ) : (
          <>
            <div className="auth-cabecera">
              <img src="/hestia-logo.png" alt="HEstia" className="auth-logo" />
              <h1 className="auth-titulo">Crea tu cuenta</h1>
              <p className="auth-subtitulo">
                Regístrate y empieza a organizar eventos sin caos.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="campo">
                <label htmlFor="registro-email">Correo electrónico</label>
                <input
                  id="registro-email"
                  type="email"
                  name="email"
                  placeholder="ejemplo@correo.com"
                  value={form.email}
                  onChange={manejarCambio}
                  aria-invalid={!!errores.email}
                  disabled={loading}
                />
                {errores.email && <span className="error-campo">{errores.email}</span>}
              </div>

              <div className="campo">
                <label htmlFor="registro-password">Contraseña</label>
                <input
                  id="registro-password"
                  type="password"
                  name="password"
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={manejarCambio}
                  aria-invalid={!!errores.password}
                  disabled={loading}
                />
                {errores.password && (
                  <span className="error-campo">{errores.password}</span>
                )}
              </div>

              <div className="campo">
                <label htmlFor="registro-password2">Confirmar contraseña</label>
                <input
                  id="registro-password2"
                  type="password"
                  name="password2"
                  placeholder="Repite la contraseña"
                  value={form.password2}
                  onChange={manejarCambio}
                  aria-invalid={!!errores.password2}
                  disabled={loading}
                />
                {errores.password2 && (
                  <span className="error-campo">{errores.password2}</span>
                )}
              </div>

              {errorGeneral && (
                <p className="alerta alerta-error" style={{ margin: "0 0 1rem" }}>
                  {errorGeneral}
                </p>
              )}

              <button type="submit" className="btn btn-primario btn-ancho" disabled={loading}>
                {loading && <span className="spinner" />}
                {loading ? "Creando cuenta..." : "Registrarme"}
              </button>
            </form>

            <p className="auth-pie">
              ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}