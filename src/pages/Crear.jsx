import { useState } from "react";
import { useNavigate } from "react-router-dom";

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

  const [mensaje, setMensaje] = useState("");

  const manejarCambio = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value,
    });
  };

  const crearEvento = async (e) => {
    e.preventDefault();

    setMensaje("Creando evento...");

    try {
      const respuesta = await fetch(
        "http://127.0.0.1:8000/api/eventos/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formulario),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        console.log(datos);
        setMensaje("Error al crear el evento.");
        return;
      }

      console.log("Evento creado:", datos);
      setMensaje(`Evento creado correctamente. ID: ${datos.id}`);

      // Redirección automática al detalle del evento
      navigate(`/evento/${datos.id}`);

    } catch (error) {
      console.error(error);
      setMensaje("No se pudo conectar con el backend.");
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

        <button type="submit">Crear evento</button>
      </form>

      <p>{mensaje}</p>
    </div>
  );
}

export default Crear;