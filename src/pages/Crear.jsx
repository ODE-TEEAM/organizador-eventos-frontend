import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./formularios.css";

// Usa la variable de entorno que ya está en .env.example; si no existe,
// cae de vuelta a la URL fija que ya tenías.
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

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
    if (!formulario.nombre.trim()) errores.nombre = "El nombre del evento es obligatorio.";
    if (!formulario.tipo.trim()) errores.tipo = "Indica qué tipo de evento es (ej. Boda, Cumpleaños).";
    if (!formulario.cliente.trim()) errores.cliente = "El cliente o contacto es obligatorio.";
    if (!formulario.fecha_hora) errores.fecha_hora = "La fecha y hora del evento son obligatorias.";
    if (!formulario.lugar.trim()) errores.lugar = "El lugar del evento es obligatorio.";
    if (!formulario.plazo_limite) errores.plazo_limite = "El plazo límite es obligatorio.";
    return errores;
  };

  const agregarSubtarea = () => {
    setErrorSubtarea("");

    if (!nuevaSubtarea.nombre.trim()) {
      setErrorSubtarea("El nombre de la gestión es obligatorio.");
      return;
    }
    if (!nuevaSubtarea.plazo) {
      setErrorSubtarea("El plazo de la gestión es obligatorio.");
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
      <p className="texto-ayuda">
        Completa los datos del evento. Podrás agregar las gestiones logísticas
        (salón, catering, invitaciones...) antes de guardar, o hacerlo después
        desde el detalle del evento.
      </p>

      <form onSubmit={crearEvento} noValidate>
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
            <span className="error-campo">{erroresFormulario.nombre}</span>
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
            <span className="error-campo">{erroresFormulario.tipo}</span>
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
            <span className="error-campo">{erroresFormulario.cliente}</span>
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
            aria-invalid={!!erroresFormulario.fecha_hora}
          />
          {erroresFormulario.fecha_hora && (
            <span className="error-campo">{erroresFormulario.fecha_hora}</span>
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
          {erroresFormulario.lugar && (
            <span className="error-campo">{erroresFormulario.lugar}</span>
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
            aria-invalid={!!erroresFormulario.plazo_limite}
          />
          <span className="texto-ayuda-campo">
            Fecha máxima para tener todo listo antes del evento.
          </span>
          {erroresFormulario.plazo_limite && (
            <span className="error-campo">{erroresFormulario.plazo_limite}</span>
          )}
        </div>

        <hr />

        <h2>Plan logístico</h2>
        <p className="texto-ayuda">
          Agrega aquí las gestiones logísticas del evento (reservar salón,
          enviar invitaciones, confirmar catering...). Es opcional: puedes
          crear el evento sin gestiones y agregarlas después.
        </p>

        {subtareas.length === 0 ? (
          <p className="estado-vacio">
            Aún no has agregado ninguna gestión logística.
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
          />
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

        <button type="button" onClick={agregarSubtarea}>
          Agregar gestión a la lista
        </button>

        {errorSubtarea && <p className="alerta alerta-error">{errorSubtarea}</p>}

        <hr />

        {/* Estados UX visibles: carga, éxito y error */}
        {estadoEnvio === "guardando-evento" && (
          <p className="alerta alerta-carga">Creando el evento...</p>
        )}
        {estadoEnvio === "guardando-subtareas" && (
          <p className="alerta alerta-carga">
            Evento creado. Guardando {subtareas.length} gestión(es) logística(s)...
          </p>
        )}
        {estadoEnvio === "exito" && (
          <p className="alerta alerta-exito">
            Evento creado correctamente. Redirigiendo al detalle...
          </p>
        )}
        {estadoEnvio === "error" && mensajeError && (
          <p className="alerta alerta-error">{mensajeError}</p>
        )}

        <button type="submit" disabled={enviando}>
          {enviando ? "Guardando..." : "Crear evento"}
        </button>
      </form>
    </div>
  );
}

export default Crear;
