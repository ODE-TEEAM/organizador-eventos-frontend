import { useState } from "react";
import { useNavigate } from "react-router-dom";

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

  // Lista de gestiones logísticas que el usuario arma ANTES de guardar
  // (aún no se envían al backend, solo viven en el navegador).
  const [subtareas, setSubtareas] = useState([]);
  const [nuevaSubtarea, setNuevaSubtarea] = useState({
    nombre: "",
    plazo: "",
    horas_estimadas: "",
  });
  const [errorSubtarea, setErrorSubtarea] = useState("");

  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  const manejarCambio = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value,
    });
  };

  const manejarCambioSubtarea = (e) => {
    setNuevaSubtarea({
      ...nuevaSubtarea,
      [e.target.name]: e.target.value,
    });
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
    setEnviando(true);
    setMensaje("Creando evento...");

    try {
      // 1) Crear el evento (igual que ya tenías)
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
        setMensaje("Error al crear el evento.");
        setEnviando(false);
        return;
      }

      console.log("Evento creado:", datos);
      const eventoId = datos.id;

      // 2) Crear cada subtarea logística asociada a ese evento
      const erroresSubtareas = [];
      if (subtareas.length > 0) {
        setMensaje(`Evento creado. Guardando ${subtareas.length} gestión(es) logística(s)...`);

        for (const subtarea of subtareas) {
          try {
            await crearSubtareaEnBackend(eventoId, subtarea);
          } catch (err) {
            console.error(err);
            erroresSubtareas.push(err.message);
          }
        }
      }

      // 3) Ir al detalle del evento; si alguna subtarea falló, se avisa allá
      navigate(`/evento/${eventoId}`, {
        state: erroresSubtareas.length > 0 ? { erroresSubtareas } : undefined,
      });
    } catch (error) {
      console.error(error);
      setMensaje("No se pudo conectar con el backend.");
      setEnviando(false);
    }
  };

  return (
    <div>
      <h1>Crear Evento</h1>
      <p>Aquí se creará un nuevo evento y su plan de trabajo.</p>

      <form onSubmit={crearEvento}>
        <div>
          <label>Nombre del evento</label>
          <br />
          <input
            type="text"
            name="nombre"
            value={formulario.nombre}
            onChange={manejarCambio}
            required
          />
        </div>

        <br />

        <div>
          <label>Tipo de evento</label>
          <br />
          <input
            type="text"
            name="tipo"
            value={formulario.tipo}
            onChange={manejarCambio}
            required
          />
        </div>

        <br />

        <div>
          <label>Cliente</label>
          <br />
          <input
            type="text"
            name="cliente"
            value={formulario.cliente}
            onChange={manejarCambio}
            required
          />
        </div>

        <br />

        <div>
          <label>Fecha y hora</label>
          <br />
          <input
            type="datetime-local"
            name="fecha_hora"
            value={formulario.fecha_hora}
            onChange={manejarCambio}
            required
          />
        </div>

        <br />

        <div>
          <label>Lugar</label>
          <br />
          <input
            type="text"
            name="lugar"
            value={formulario.lugar}
            onChange={manejarCambio}
            required
          />
        </div>

        <br />

        <div>
          <label>Plazo límite</label>
          <br />
          <input
            type="date"
            name="plazo_limite"
            value={formulario.plazo_limite}
            onChange={manejarCambio}
            required
          />
        </div>

        <br />
        <hr />

        <h2>Plan logístico (opcional)</h2>
        <p>Agrega aquí las gestiones logísticas del evento (reservar salón, enviar invitaciones, confirmar catering...).</p>

        {subtareas.length > 0 && (
          <ul>
            {subtareas.map((s, index) => (
              <li key={index}>
                {s.nombre} — plazo {s.plazo} — {s.horas_estimadas} h{" "}
                <button type="button" onClick={() => quitarSubtarea(index)}>
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}

        <div>
          <label>Nombre de la gestión</label>
          <br />
          <input
            type="text"
            name="nombre"
            value={nuevaSubtarea.nombre}
            onChange={manejarCambioSubtarea}
            placeholder="Ej. Reservar salón"
          />
        </div>

        <br />

        <div>
          <label>Plazo de la gestión</label>
          <br />
          <input
            type="date"
            name="plazo"
            value={nuevaSubtarea.plazo}
            onChange={manejarCambioSubtarea}
          />
        </div>

        <br />

        <div>
          <label>Horas estimadas</label>
          <br />
          <input
            type="number"
            step="0.5"
            min="0.5"
            name="horas_estimadas"
            value={nuevaSubtarea.horas_estimadas}
            onChange={manejarCambioSubtarea}
            placeholder="Ej. 4"
          />
        </div>

        <br />

        <button type="button" onClick={agregarSubtarea}>
          Agregar gestión a la lista
        </button>

        {errorSubtarea && <p style={{ color: "red" }}>{errorSubtarea}</p>}

        <br />
        <br />
        <hr />

        <button type="submit" disabled={enviando}>
          {enviando ? "Guardando..." : "Crear evento"}
        </button>
      </form>

      <p>{mensaje}</p>
    </div>
  );
}

export default Crear;
