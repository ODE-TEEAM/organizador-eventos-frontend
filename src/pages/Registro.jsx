import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AvatarAnimal, { animalDe } from "../components/AvatarAnimal";
import InputPassword from "../components/InputPassword";

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
    nombre: "",
    email: "",
    password: "",
    password2: "",
  });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [loading, setLoading] = useState(false);
  const [exito, setExito] = useState(false);

  const manejarCambio = (e) => {
    const valor =
      e.target.name === "email"
        ? e.target.value.toLowerCase()
        : e.target.value;

    setForm({ ...form, [e.target.name]: valor });

    if (errores[e.target.name]) {
    setErrores({ ...errores, [e.target.name]: undefined });
    }
  };

  const validar = () => {
    const nuevos = {};
    if (!form.nombre.trim()) {
      nuevos.nombre = "Cuéntanos tu nombre para personalizar tu cuenta.";
    } else if (form.nombre.trim().length < 3) {
      nuevos.nombre = "Tu nombre debe tener al menos 3 caracteres.";
    }
    if (!form.email.trim()) {
      nuevos.email = "Necesitamos tu correo para crear la cuenta.";
    } else if (!/^[a-z0-9._%+-]+@gmail\.com$/.test(form.email)) {
      nuevos.email = "Debes ingresar un correo Gmail válido, por ejemplo: ejemplo@gmail.com";
    }
    if (!form.password) {
      nuevos.password = "Crea una contraseña para proteger tu cuenta.";
    } else if (form.password.length < 6) {
      nuevos.password = "Tu contraseña debe tener al menos 6 caracteres.";
    }
    if (!form.password2) {
      nuevos.password2 = "Repite tu contraseña para confirmarla.";
    } else if (form.password !== form.password2) {
      nuevos.password2 = "Las contraseñas no coinciden. Escríbelas igual en ambos campos.";
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
          nombre: form.nombre.trim(),
          email: form.email,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.email) {
          setErrores({ email: Array.isArray(data.email) ? data.email[0] : data.email });
        }
        if (data.nombre) {
          setErrores({ nombre: Array.isArray(data.nombre) ? data.nombre[0] : data.nombre });
        }
        setErrorGeneral(
          "No pudimos crear tu cuenta. Revisa los campos marcados e intenta de nuevo."
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
        "No pudimos conectar con el servidor. Verifica que el backend esté encendido e intenta de nuevo."
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
                <label htmlFor="registro-nombre">Nombre</label>
                <input
                  id="registro-nombre"
                  type="text"
                  name="nombre"
                  placeholder="Ej. Mauricio"
                  value={form.nombre}
                  onChange={manejarCambio}
                  aria-invalid={!!errores.nombre}
                  disabled={loading}
                  autoComplete="name"
                />
                {errores.nombre && (
                  <span className="error-campo">{errores.nombre}</span>
                )}
              </div>

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
                  autoComplete="email"
                />
                {errores.email && <span className="error-campo">{errores.email}</span>}
              </div>

              <div className="campo">
                <label htmlFor="registro-password">Contraseña</label>
                <InputPassword
                  id="registro-password"
                  name="password"
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={manejarCambio}
                  ariaInvalid={!!errores.password}
                  disabled={loading}
                  autoComplete="new-password"
                />
                {errores.password && (
                  <span className="error-campo">{errores.password}</span>
                )}
              </div>

              <div className="campo">
                <label htmlFor="registro-password2">Confirmar contraseña</label>
                <InputPassword
                  id="registro-password2"
                  name="password2"
                  placeholder="Repite la contraseña"
                  value={form.password2}
                  onChange={manejarCambio}
                  ariaInvalid={!!errores.password2}
                  disabled={loading}
                  autoComplete="new-password"
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