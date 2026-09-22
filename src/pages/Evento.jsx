import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";

function Evento() {
  const { id } = useParams();
  const location = useLocation();

  const [evento, setEvento] = useState(null);
  const [error, setError] = useState("");

  // Si Crear.jsx redirigió aquí después de que alguna subtarea fallara al
  // guardarse, viene en location.state.erroresSubtareas.
  const erroresSubtareas = location.state?.erroresSubtareas;

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

      {erroresSubtareas && erroresSubtareas.length > 0 && (
        <div style={{ background: "#fee2e2", color: "#991b1b", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem" }}>
          <strong>Atención:</strong> el evento se creó, pero {erroresSubtareas.length}{" "}
          gestión(es) logística(s) no se pudieron guardar. Puedes volver a intentarlo.
          <ul>
            {erroresSubtareas.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

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

      {evento.subtareas.length === 0 && <p>Aún no hay gestiones logísticas para este evento.</p>}

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
