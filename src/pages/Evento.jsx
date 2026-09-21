import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function Evento() {
  const { id } = useParams();

  const [evento, setEvento] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const obtenerEvento = async () => {
      try {
        const respuesta = await fetch(
          `http://127.0.0.1:8000/api/eventos/${id}/`
        );

        const datos = await respuesta.json();

        console.log("EVENTO RECIBIDO:", datos);

        if (!respuesta.ok) {
          setError("No se pudo obtener el evento.");
          return;
        }

        setEvento(datos);
      } catch (error) {
        console.error(error);
        setError("No se pudo conectar con el backend.");
      }
    };

    obtenerEvento();
  }, [id]);

  if (error) {
    return <p>{error}</p>;
  }

  if (!evento) {
    return <p>Cargando evento...</p>;
  }

  return (
    <div>
      <h1>{evento.nombre}</h1>

      <p>
        <strong>Tipo:</strong> {evento.tipo}
      </p>

      <p>
        <strong>Cliente:</strong> {evento.cliente}
      </p>

      <p>
        <strong>Fecha:</strong> {evento.fecha_hora}
      </p>

      <p>
        <strong>Lugar:</strong> {evento.lugar}
      </p>

      <p>
        <strong>Plazo límite:</strong> {evento.plazo_limite}
      </p>

      <h2>Subtareas logísticas</h2>

      {evento.subtareas.map((subtarea) => (
        <div key={subtarea.id}>
          <h3>{subtarea.nombre}</h3>

          <p>
            Plazo: {subtarea.plazo}
          </p>

          <p>
            Horas estimadas: {subtarea.horas_estimadas}
          </p>

          <p>
            Estado: {subtarea.estado}
          </p>
        </div>
      ))}
    </div>
  );
}

export default Evento;