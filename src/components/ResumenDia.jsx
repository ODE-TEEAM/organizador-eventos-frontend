import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAuthHeaders } from "../auth";
import { EVENTO_DATOS_CAMBIARON } from "../utils/validacion";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

// Resumen siempre visible en el encabezado (pruebas de usuario, Sprint 5):
// - Horas libres de HOY frente al límite diario (pidió un recordatorio continuo).
// - Avance general de todas las gestiones, sin tener que ir a /progreso.
// Se refresca al volver a la pestaña y cuando otra pantalla avisa que
// cambiaron gestiones o el límite (avisarCambioDatos).
export default function ResumenDia() {
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    let vigente = true;

    const cargar = async () => {
      try {
        const respuesta = await fetch(`${API_URL}/hoy/`, { headers: getAuthHeaders() });
        if (!respuesta.ok) return;
        const json = await respuesta.json();
        if (!vigente) return;

        const limite = Number(json.limite_horas_diarias ?? json.resumen?.limite_horas_diarias ?? 6);
        const ocupadas = Number(json.resumen?.horas_pendientes_hoy ?? 0);
        const pendientes = Number(json.resumen?.total ?? 0);
        const hechas = Number(json.resumen?.completadas ?? 0);
        const total = pendientes + hechas;

        setDatos({
          limite,
          ocupadas,
          libres: limite - ocupadas,
          porcentaje: total === 0 ? 0 : Math.round((hechas / total) * 100),
          hechas,
          total,
        });
      } catch {
        // Sin conexión: el resumen simplemente no se muestra.
      }
    };

    const alVolver = () => {
      if (document.visibilityState === "visible") cargar();
    };

    cargar();
    window.addEventListener(EVENTO_DATOS_CAMBIARON, cargar);
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      vigente = false;
      window.removeEventListener(EVENTO_DATOS_CAMBIARON, cargar);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, []);

  if (!datos) return null;

  const { limite, ocupadas, libres, porcentaje, hechas, total } = datos;
  const nivel = libres < 0 ? "excedido" : libres === 0 ? "lleno" : "ok";
  // Parte 1: tiempo de HOY (verde = hay horas libres, amarillo = día lleno,
  // rojo = te pasas del límite). Parte 2: avance de TODAS las gestiones.
  const textoHoras =
    libres < 0
      ? `Hoy: te pasas ${-libres} h`
      : libres === 0
        ? "Hoy: sin horas libres"
        : `Hoy: ${libres} h libres`;

  return (
    <Link
      to="/progreso"
      className="resumen-dia"
      data-nivel={nivel}
      aria-label={`${textoHoras} (${ocupadas} de ${limite} horas ocupadas). Avance total de tus gestiones: ${porcentaje}%, ${hechas} de ${total} hechas. Ver progreso.`}
      title={`Hoy tienes ${ocupadas} de ${limite} h ocupadas. Avance total: ${hechas} de ${total} gestiones hechas.`}
    >
      <span className="resumen-dia-horas">
        <span className="resumen-dia-punto" aria-hidden="true" />
        {textoHoras}
        <span className="resumen-dia-limite"> de {limite} h</span>
      </span>
      <span className="resumen-dia-avance" aria-hidden="true">
        <span className="resumen-dia-etiqueta">Avance total</span>
        <span className="resumen-dia-barra">
          <span style={{ width: `${porcentaje}%` }} />
        </span>
        {porcentaje}%
      </span>
    </Link>
  );
}
