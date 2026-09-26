import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./formularios.css";

// Usa la variable de entorno que ya está en .env.example; si no existe,
// cae de vuelta a la URL fija que ya tenías.
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

// ---- Reglas de validación reutilizables ----
const LONGITUD_MINIMA_TEXTO = 3;
const CONTIENE_LETRA = /[a-zA-ZÀ-ÿ]/;

// Un texto "válido" (nombre, cliente, lugar, tipo): sin espacios sobrantes,
// con un mínimo de caracteres y con al menos una letra (bloquea "a", "12", " ").
function esTextoValido(valor) {
  const limpio = (valor || "").trim();
  return limpio.length >= LONGITUD_MINIMA_TEXTO && CONTIENE_LETRA.test(limpio);
}

// YYYY-MM-DD de hoy, para el atributo min de los <input type="date">.
function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

// YYYY-MM-DDTHH:mm de ahora mismo (hora local), para min de datetime-local.
function ahoraLocalISO() {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

// ¿La fecha+hora ingresada es hoy o en el futuro? (con 1 min de tolerancia)
function esFechaHoraFutura(valor) {
  if (!valor) return false;
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return false;
  return fecha.getTime() >= Date.now() - 60000;
}

// ¿La fecha (sin hora) ingresada es hoy o en el futuro?
function esFechaFutura(valor) {
  if (!valor) return false;
  const fecha = new Date(`${valor}T00:00:00`);
  if (isNaN(fecha.getTime())) return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return fecha.getTime() >= hoy.getTime();
}

// ---- Iconos inline (sin dependencias externas) ----
function IconoError() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="13" />
      <circle cx="12" cy="16.2" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconoExito() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="12" cy="12" r="9" />
      <polyline points="8 12.5 11 15.5 16 9.5" />
    </svg>
  );
}

function Crear() {
  const navigate = useNavigate();

  const [formulario, setFormulario] = useState({
    nombre: "",
    tipo: "",
    cliente: "",
    fecha_hora: "",
    lugar: "",
    plazo_limite: "",
  });
  const [erroresFormulario, setErroresFormulario] = useState({});

  // Lista de gestiones logísticas que el usuario arma ANTES de guardar
  // (aún no se envían al backend, solo viven en el navegador).
  const [subtareas, setSubtareas] = useState([]);
  const [nuevaSubtarea, setNuevaSubtarea] = useState({
    nombre: "",
    plazo: "",
    horas_estimadas: "",
  });
  const [errorSubtarea, setErrorSubtarea] = useState("");

  // Estado UX explícito del envío del formulario completo:
  // idle | guardando-evento | guardando-subtareas | exito | error
  const [estadoEnvio, setEstadoEnvio] = useState("idle");
  const [mensajeError, setMensajeError] = useState("");

  const enviando =
    estadoEnvio === "guardando-evento" || estadoEnvio === "guardando-subtareas";

  const manejarCambio = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value,
    });
    // Si el usuario ya corrigió el campo, le quitamos el error apenas escribe.
    if (erroresFormulario[e.target.name]) {
      setErroresFormulario({ ...erroresFormulario, [e.target.name]: undefined });
    }
  };

  const manejarCambioSubtarea = (e) => {
    setNuevaSubtarea({
      ...nuevaSubtarea,
      [e.target.name]: e.target.value,
    });
  };

  // Validación de campos obligatorios del EVENTO (front-end).
  // El backend valida lo mismo (nombre requerido); esto es solo para dar
  // feedback inmediato al organizador sin esperar la respuesta del servidor.
  const validarFormulario = () => {
    const errores = {};

    if (!esTextoValido(formulario.nombre)) {
      errores.nombre = "Escribe un nombre real para el evento (mínimo 3 caracteres, con letras).";
    }
    if (!esTextoValido(formulario.tipo)) {
      errores.tipo = "Indica un tipo de evento válido (ej. Boda, Cumpleaños), mínimo 3 caracteres.";
    }
    if (!esTextoValido(formulario.cliente)) {
      errores.cliente = "Escribe el nombre real del cliente (mínimo 3 caracteres, con letras).";
    }
    if (!formulario.fecha_hora) {
      errores.fecha_hora = "La fecha y hora del evento son obligatorias.";
    } else if (!esFechaHoraFutura(formulario.fecha_hora)) {
      errores.fecha_hora = "La fecha y hora del evento deben ser hoy o en el futuro.";
    }
    if (!esTextoValido(formulario.lugar)) {
      errores.lugar = "Escribe un lugar válido (ej. nombre del salón, dirección o ciudad), mínimo 3 caracteres.";
    }
    if (!formulario.plazo_limite) {
      errores.plazo_limite = "El plazo límite es obligatorio.";
    } else if (!esFechaFutura(formulario.plazo_limite)) {
      errores.plazo_limite = "El plazo límite debe ser hoy o una fecha futura.";
    } else if (
      formulario.fecha_hora &&
      new Date(formulario.plazo_limite) > new Date(formulario.fecha_hora)
    ) {
      errores.plazo_limite = "El plazo límite no puede ser después de la fecha del evento.";
    }

    return errores;
  };

  const agregarSubtarea = () => {
    setErrorSubtarea("");

    if (!esTextoValido(nuevaSubtarea.nombre)) {
      setErrorSubtarea("Escribe un nombre real para la gestión (mínimo 3 caracteres, con letras).");
      return;
    }
    if (!nuevaSubtarea.plazo) {
      setErrorSubtarea("El plazo de la gestión es obligatorio.");
      return;
    }
    if (!esFechaFutura(nuevaSubtarea.plazo)) {
      setErrorSubtarea("El plazo de la gestión debe ser hoy o una fecha futura.");
      return;
    }
    if (
      formulario.fecha_hora &&
      new Date(nuevaSubtarea.plazo) > new Date(formulario.fecha_hora)
    ) {
      setErrorSubtarea("El plazo de la gestión no puede ser después de la fecha del evento.");
      return;
    }
    const horas = parseFloat(nuevaSubtarea.horas_estimadas);
    if (!nuevaSubtarea.horas_estimadas || isNaN(horas) || horas <= 0) {
      setErrorSubtarea("Las horas estimadas deben ser mayores a 0.");
      return;
    }

    setSubtareas([...subtareas, nuevaSubtarea]);
    setNuevaSubtarea({ nombre: "", plazo: "", horas_estimadas: "" });
  };

  const quitarSubtarea = (index) => {
    setSubtareas(subtareas.filter((_, i) => i !== index));
  };

  // Crea la subtarea en el backend: POST /api/eventos/:id/subtareas/
  const crearSubtareaEnBackend = async (eventoId, subtarea) => {
    const respuesta = await fetch(`${API_URL}/eventos/${eventoId}/subtareas/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subtarea),
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        `No se pudo guardar la gestión "${subtarea.nombre}": ${JSON.stringify(datos)}`
      );
    }

    return datos;
  };

  const crearEvento = async (e) => {
    e.preventDefault();
    setMensajeError("");

    // 0) Validación en cliente antes de llamar al backend.
    const errores = validarFormulario();
    setErroresFormulario(errores);
    if (Object.keys(errores).length > 0) {
      setEstadoEnvio("error");
      setMensajeError("Revisa los campos marcados en rojo antes de continuar.");
      return;
    }

    setEstadoEnvio("guardando-evento");

    try {
      // 1) Crear el evento
      const respuesta = await fetch(`${API_URL}/eventos/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formulario),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        console.log(datos);
        // El backend devuelve errores por campo (ej. {"nombre": ["..."]});
        // los mostramos junto a cada input, igual que los del cliente.
        if (datos && typeof datos === "object") {
          setErroresFormulario(datos);
        }
        setEstadoEnvio("error");
        setMensajeError("No se pudo crear el evento. Revisa los campos señalados.");
        return;
      }

      console.log("Evento creado:", datos);
      const eventoId = datos.id;

      // 2) Crear cada subtarea logística asociada a ese evento
      const erroresSubtareas = [];
      if (subtareas.length > 0) {
        setEstadoEnvio("guardando-subtareas");

        for (const subtarea of subtareas) {
          try {
            await crearSubtareaEnBackend(eventoId, subtarea);
          } catch (err) {
            console.error(err);
            erroresSubtareas.push(err.message);
          }
        }
      }

      setEstadoEnvio("exito");

      // 3) Ir al detalle del evento; si alguna subtarea falló, se avisa allá
      navigate(`/evento/${eventoId}`, {
        state: erroresSubtareas.length > 0 ? { erroresSubtareas } : undefined,
      });
    } catch (error) {
      console.error(error);
      setEstadoEnvio("error");
      setMensajeError("No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.");
    }
  };

  return (
    <div className="pagina-crear">
      <h1>Crear evento</h1>
      <p className="subtitulo">
        Completa estos dos pasos y te llevaremos directo a la página del evento,
        donde verás todo lo que acabas de registrar.
      </p>

      <form onSubmit={crearEvento} noValidate>
        <div className="paso-encabezado">
          <span className="paso-numero">1</span>
          <h2>Datos del evento</h2>
        </div>
        <p className="texto-ayuda">Esta información es obligatoria.</p>

        <div className="tarjeta">
          <div className="campo">
            <label htmlFor="nombre">Nombre del evento</label>
            <input
              id="nombre"
              type="text"
              name="nombre"
              value={formulario.nombre}
              onChange={manejarCambio}
              placeholder="Ej. Boda de Camila y Julián"
              aria-invalid={!!erroresFormulario.nombre}
            />
            {erroresFormulario.nombre && (
              <span className="error-campo">
                <IconoError /> {erroresFormulario.nombre}
              </span>
            )}
          </div>

          <div className="campo">
            <label htmlFor="tipo">Tipo de evento</label>
            <input
              id="tipo"
              type="text"
              name="tipo"
              value={formulario.tipo}
              onChange={manejarCambio}
              placeholder="Ej. Boda, Cumpleaños, Corporativo"
              aria-invalid={!!erroresFormulario.tipo}
            />
            {erroresFormulario.tipo && (
              <span className="error-campo">
                <IconoError /> {erroresFormulario.tipo}
              </span>
            )}
          </div>

          <div className="campo">
            <label htmlFor="cliente">Cliente</label>
            <input
              id="cliente"
              type="text"
              name="cliente"
              value={formulario.cliente}
              onChange={manejarCambio}
              placeholder="Nombre de la persona o empresa que contrata"
              aria-invalid={!!erroresFormulario.cliente}
            />
            {erroresFormulario.cliente && (
              <span className="error-campo">
                <IconoError /> {erroresFormulario.cliente}
              </span>
            )}
          </div>

          <div className="campo">
            <label htmlFor="fecha_hora">Fecha y hora del evento</label>
            <input
              id="fecha_hora"
              type="datetime-local"
              name="fecha_hora"
              value={formulario.fecha_hora}
              onChange={manejarCambio}
              min={ahoraLocalISO()}
              aria-invalid={!!erroresFormulario.fecha_hora}
            />
            <span className="texto-ayuda-campo">Debe ser hoy o una fecha futura.</span>
            {erroresFormulario.fecha_hora && (
              <span className="error-campo">
                <IconoError /> {erroresFormulario.fecha_hora}
              </span>
            )}
          </div>

          <div className="campo">
            <label htmlFor="lugar">Lugar</label>
            <input
              id="lugar"
              type="text"
              name="lugar"
              value={formulario.lugar}
              onChange={manejarCambio}
              placeholder="Salón, dirección o ciudad"
              aria-invalid={!!erroresFormulario.lugar}
            />
            <span className="texto-ayuda-campo">
              Mínimo 3 caracteres, con letras (ej. "Salón Los Almendros", no "pan").
            </span>
            {erroresFormulario.lugar && (
              <span className="error-campo">
                <IconoError /> {erroresFormulario.lugar}
              </span>
            )}
          </div>

          <div className="campo">
            <label htmlFor="plazo_limite">Plazo límite</label>
            <input
              id="plazo_limite"
              type="date"
              name="plazo_limite"
              value={formulario.plazo_limite}
              onChange={manejarCambio}
              min={hoyISO()}
              aria-invalid={!!erroresFormulario.plazo_limite}
            />
            <span className="texto-ayuda-campo">
              Fecha máxima para tener todo listo antes del evento. Debe ser hoy o futura.
            </span>
            {erroresFormulario.plazo_limite && (
              <span className="error-campo">
                <IconoError /> {erroresFormulario.plazo_limite}
              </span>
            )}
          </div>
        </div>

        <div className="paso-encabezado">
          <span className="paso-numero">2</span>
          <h2>Plan logístico</h2>
        </div>
        <p className="texto-ayuda">
          Agrega aquí las gestiones logísticas del evento (reservar salón, enviar
          invitaciones, confirmar catering...). Este paso es opcional: puedes
          crear el evento sin gestiones y agregarlas después desde su página.
        </p>

        <div className="tarjeta">
          {subtareas.length === 0 ? (
            <p className="estado-vacio">
              Aún no has agregado ninguna gestión logística. Usa el formulario de
              abajo para sumar la primera.
            </p>
          ) : (
            <ul className="lista-subtareas">
              {subtareas.map((s, index) => (
                <li key={index}>
                  <span>
                    <strong>{s.nombre}</strong> — plazo {s.plazo} — {s.horas_estimadas} h
                  </span>
                  <button type="button" onClick={() => quitarSubtarea(index)}>
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="campo">
            <label htmlFor="subtarea-nombre">Nombre de la gestión</label>
            <input
              id="subtarea-nombre"
              type="text"
              name="nombre"
              value={nuevaSubtarea.nombre}
              onChange={manejarCambioSubtarea}
              placeholder="Ej. Reservar salón"
            />
          </div>

          <div className="campo">
            <label htmlFor="subtarea-plazo">Plazo de la gestión</label>
            <input
              id="subtarea-plazo"
              type="date"
              name="plazo"
              value={nuevaSubtarea.plazo}
              onChange={manejarCambioSubtarea}
              min={hoyISO()}
            />
            <span className="texto-ayuda-campo">Debe ser hoy o una fecha futura.</span>
          </div>

          <div className="campo">
            <label htmlFor="subtarea-horas">Horas estimadas</label>
            <input
              id="subtarea-horas"
              type="number"
              step="0.5"
              min="0.5"
              name="horas_estimadas"
              value={nuevaSubtarea.horas_estimadas}
              onChange={manejarCambioSubtarea}
              placeholder="Ej. 4"
            />
            <span className="texto-ayuda-campo">Debe ser mayor a 0.</span>
          </div>

          <button type="button" className="boton-principal" onClick={agregarSubtarea}>
            Agregar gestión a la lista
          </button>

          {errorSubtarea && (
            <p className="alerta alerta-error">
              <IconoError /> {errorSubtarea}
            </p>
          )}
        </div>

        {/* Estados UX visibles: carga, éxito y error */}
        {estadoEnvio === "guardando-evento" && (
          <p className="alerta alerta-carga">
            <span className="spinner" /> Creando el evento...
          </p>
        )}
        {estadoEnvio === "guardando-subtareas" && (
          <p className="alerta alerta-carga">
            <span className="spinner" /> Evento creado. Guardando {subtareas.length}{" "}
            gestión(es) logística(s)...
          </p>
        )}
        {estadoEnvio === "exito" && (
          <p className="alerta alerta-exito">
            <IconoExito /> Evento creado correctamente. Redirigiendo al detalle...
          </p>
        )}
        {estadoEnvio === "error" && mensajeError && (
          <p className="alerta alerta-error">
            <IconoError /> {mensajeError}
          </p>
        )}

        <button type="submit" className="boton-ancho" disabled={enviando}>
          {enviando ? "Guardando..." : "Crear evento"}
        </button>
      </form>
    </div>
  );
}

export default Crear;
