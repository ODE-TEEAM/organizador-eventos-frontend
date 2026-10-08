import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { getAuthHeaders } from "../auth";
import {
  ANIO_MAXIMO,
  HORAS_MIN,
  HORAS_MAX,
  ahoraLocalInput,
  dentroDeAniosInput,
  esAnioRazonable,
  mensajeDeError,
  enfocarPrimerError,
  normalizarErroresBackend,
} from "../utils/validacion";
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

function formatearFechaVisual(fechaISO) {
  if (!fechaISO) return "";

  const [yyyy, mm, dd] = fechaISO.split("-");
  if (!yyyy || !mm || !dd) return fechaISO;
  return `${dd}/${mm}/${yyyy}`;
}

function convertirFechaAISO(valor) {
  const partes = valor.split("/");

  if (partes.length !== 3) return "";

  const [dd, mm, yyyy] = partes;

  if (
    dd.length !== 2 ||
    mm.length !== 2 ||
    yyyy.length !== 4
  ) {
    return "";
  }

  const fecha = new Date(
    Number(yyyy),
    Number(mm) - 1,
    Number(dd)
  );

  if (
    fecha.getFullYear() !== Number(yyyy) ||
    fecha.getMonth() !== Number(mm) - 1 ||
    fecha.getDate() !== Number(dd)
  ) {
    return "";
  }

  return `${yyyy}-${mm}-${dd}`;
}

// ¿La fecha/hora es futura? Acepta "YYYY-MM-DD" (todo el día de hoy cuenta
// como válido) o "YYYY-MM-DDTHH:mm" (comparación exacta contra este instante).
function esFechaFutura(valor) {
  if (!valor) return false;
  const texto = String(valor);
  const fecha =
    texto.length > 10 ? new Date(texto) : new Date(`${texto}T23:59:59`);
  return !isNaN(fecha.getTime()) && fecha.getTime() > Date.now();
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
  const [errorNombreSubtarea, setErrorNombreSubtarea] = useState("");
  const [errorPlazoSubtarea, setErrorPlazoSubtarea] = useState("");
  const [errorHorasSubtarea, setErrorHorasSubtarea] = useState("");

  // Estado UX explícito del envío del formulario completo:
  // idle | guardando-evento | guardando-subtareas | exito | error
  const [estadoEnvio, setEstadoEnvio] = useState("idle");
  const [mensajeError, setMensajeError] = useState("");

  const enviando =
    estadoEnvio === "guardando-evento" || estadoEnvio === "guardando-subtareas";

  const manejarCambio = (e) => {
    const { name, value } = e.target;

    if (name === "plazo_limite") {
      // Solo permite números y máximo 8 dígitos: ddmmaaaa.
      const digitos = value.replace(/\D/g, "").slice(0, 8);

      let fechaVisual = digitos;

      if (digitos.length > 2) {
        fechaVisual = `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
      }

      if (digitos.length > 4) {
        fechaVisual = `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
      }

      const fechaISO = convertirFechaAISO(fechaVisual);

      setFormulario({
        ...formulario,
        plazo_limite: fechaISO || fechaVisual,
      });
    } else {
      setFormulario({
        ...formulario,
        [name]: value,
      });
    }

    // Si el usuario ya corrigió el campo, le quitamos el error apenas escribe.
    if (erroresFormulario[name]) {
      setErroresFormulario({
        ...erroresFormulario,
        [name]: undefined,
      });
    }
  };

  const manejarCambioSubtarea = (e) => {
    const { name, value } = e.target;

    if (name === "plazo") {
      const digitos = value.replace(/\D/g, "").slice(0, 8);

      let fechaVisual = digitos;

      if (digitos.length > 2) {
        fechaVisual = `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
      }

      if (digitos.length > 4) {
        fechaVisual = `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
      }

      const fechaISO = convertirFechaAISO(fechaVisual);

      setNuevaSubtarea({
        ...nuevaSubtarea,
        plazo: fechaISO || fechaVisual,
      });
      setErrorPlazoSubtarea("");
    } else if (name === "horas_estimadas") {
      // Solo dígitos enteros, máximo 2 caracteres (1–12)
      const soloDigitos = value.replace(/\D/g, "").slice(0, 2);
      setNuevaSubtarea({
        ...nuevaSubtarea,
        horas_estimadas: soloDigitos,
      });
      setErrorHorasSubtarea("");
    } else {
      setNuevaSubtarea({
        ...nuevaSubtarea,
        [name]: value,
      });
      if (name === "nombre") setErrorNombreSubtarea("");
    }
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
    } else if (!esAnioRazonable(formulario.fecha_hora)) {
      errores.fecha_hora = `El año del evento no puede ser mayor a ${ANIO_MAXIMO}.`;
    } else if (!esFechaFutura(formulario.fecha_hora)) {
      errores.fecha_hora = "La fecha y hora del evento deben ser futuras (no puedes agendar en el pasado).";
    }
    if (!esTextoValido(formulario.lugar)) {
      errores.lugar = "Escribe un lugar válido (ej. nombre del salón, dirección o ciudad), mínimo 3 caracteres.";
    }
    if (!formulario.plazo_limite) {
      errores.plazo_limite = "El plazo límite es obligatorio.";
    } else {
      const plazoISO = convertirFechaAISO(
        formulario.plazo_limite.includes("-")
          ? formatearFechaVisual(formulario.plazo_limite)
          : formulario.plazo_limite
      );

      if (!plazoISO) {
        errores.plazo_limite =
          "Escribe una fecha válida en formato dd/mm/aaaa.";
      } else if (!esAnioRazonable(plazoISO)) {
        errores.plazo_limite =
          `El año del plazo límite no puede ser mayor a ${ANIO_MAXIMO}.`;
      } else if (!esFechaFutura(plazoISO)) {
        errores.plazo_limite =
          "El plazo límite debe ser hoy o una fecha futura.";
      } else if (
        formulario.fecha_hora &&
        plazoISO > formulario.fecha_hora.slice(0, 10)
      ) {
        errores.plazo_limite =
          "El plazo límite no puede ser después de la fecha del evento.";
      }
    }

    return errores;
  };

  const agregarSubtarea = () => {
    setErrorNombreSubtarea("");
    setErrorPlazoSubtarea("");
    setErrorHorasSubtarea("");

    let hayError = false;

    if (!esTextoValido(nuevaSubtarea.nombre)) {
      setErrorNombreSubtarea(
        "Escribe un nombre real para la gestión (mínimo 3 caracteres, con letras)."
      );
      hayError = true;
    }

    // Normalizar plazo a ISO si viene en dd/mm/aaaa
    let plazoISO = nuevaSubtarea.plazo;
    if (plazoISO && !plazoISO.includes("-")) {
      plazoISO = convertirFechaAISO(plazoISO);
    }

    if (!nuevaSubtarea.plazo) {
      setErrorPlazoSubtarea("El plazo de la gestión es obligatorio.");
      hayError = true;
    } else if (!plazoISO || !esFechaFutura(plazoISO)) {
      setErrorPlazoSubtarea(
        "Escribe una fecha válida (dd/mm/aaaa), hoy o futura."
      );
      hayError = true;
    } else if (
      formulario.fecha_hora &&
      plazoISO > formulario.fecha_hora.slice(0, 10)
    ) {
      setErrorPlazoSubtarea(
        "El plazo de la gestión no puede ser después de la fecha del evento."
      );
      hayError = true;
    }

    const horasStr = String(nuevaSubtarea.horas_estimadas || "").trim();
    const horas = Number(horasStr);

    if (
      !horasStr ||
      !Number.isInteger(horas) ||
      horas < HORAS_MIN ||
      horas > HORAS_MAX
    ) {
      setErrorHorasSubtarea(
        `Las horas estimadas deben ser un número entero entre ${HORAS_MIN} y ${HORAS_MAX}.`
      );
      hayError = true;
    }

    if (hayError) return;

    setSubtareas([
      ...subtareas,
      {
        nombre: nuevaSubtarea.nombre.trim(),
        plazo: plazoISO,
        horas_estimadas: horas,
      },
    ]);
    setNuevaSubtarea({ nombre: "", plazo: "", horas_estimadas: "" });
  };

  const quitarSubtarea = (index) => {
    setSubtareas(subtareas.filter((_, i) => i !== index));
  };

  // Crea la subtarea en el backend: POST /api/eventos/:id/subtareas/
  const crearSubtareaEnBackend = async (eventoId, subtarea) => {
    const respuesta = await fetch(`${API_URL}/eventos/${eventoId}/subtareas/`, {
      method: "POST",
      headers: getAuthHeaders(), // ← envía el token
      body: JSON.stringify(subtarea),
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        mensajeDeError(datos, `No se pudo guardar la gestión "${subtarea.nombre}":`)
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
      enfocarPrimerError(".pagina-formulario");
      return;
    }

    setEstadoEnvio("guardando-evento");

    try {
      // 1) Crear el evento
      const respuesta = await fetch(`${API_URL}/eventos/`, {
        method: "POST",
        headers: getAuthHeaders(), // ← envía el token
        // La fecha se envía en UTC (ISO con Z) para que el backend guarde el
        // mismo instante que el organizador eligió en su hora local.
        body: JSON.stringify({
          ...formulario,
          fecha_hora: new Date(formulario.fecha_hora).toISOString(),
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        // El backend devuelve errores por campo (ej. {"nombre": ["..."]});
        // los traducimos a mensajes legibles y los mostramos junto a cada input.
        const normalizados = normalizarErroresBackend(datos);
        setErroresFormulario(normalizados.campos);
        setEstadoEnvio("error");
        setMensajeError(
          normalizados.general ||
            mensajeDeError(datos) ||
            "No se pudo crear el evento. Revisa los campos señalados."
        );
        enfocarPrimerError(".pagina-formulario");
        return;
      }

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
    <div className="pagina pagina-oscura">
      {/* Header con logo + menú de usuario */}
      <Header />

      <main className="contenedor contenedor-estrecho pagina-formulario">
        <h1>Crear evento</h1>
        <p className="subtitulo">
          Completa estos dos pasos y te llevaremos directo a la página del evento,
          donde verás todo lo que acabas de registrar.
        </p>

        {/* El resumen de errores va arriba del todo: cerca del título y de los
            campos, no abajo junto al botón. Cada error también se repite junto
            a su campo en rojo. */}
        {estadoEnvio === "error" && mensajeError && (
          <p className="alerta alerta-error" role="alert">
            <IconoError /> {mensajeError}
          </p>
        )}

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
                min={ahoraLocalInput()}
                max={dentroDeAniosInput(10)}
                aria-invalid={!!erroresFormulario.fecha_hora}
              />
              {erroresFormulario.fecha_hora ? (
                <span className="error-campo">
                  <IconoError /> {erroresFormulario.fecha_hora}
                </span>
              ) : (
                <span className="texto-ayuda-campo">
                  Elige la fecha y la hora reales del evento. Deben ser futuras: no puedes
                  agendar un evento en una hora que ya pasó.
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
              {erroresFormulario.lugar ? (
                <span className="error-campo">
                  <IconoError /> {erroresFormulario.lugar}
                </span>
              ) : (
                <span className="texto-ayuda-campo">
                  Mínimo 3 caracteres, con letras (ej. "Salón Los Almendros", no "pan").
                </span>
              )}
            </div>

            <div className="campo">
              <label htmlFor="plazo_limite">Plazo límite</label>
              <input
                id="plazo_limite"
                type="text"
                name="plazo_limite"
                value={
                  formulario.plazo_limite.includes("-")
                    ? formatearFechaVisual(formulario.plazo_limite)
                    : formulario.plazo_limite
                }
                onChange={manejarCambio}
                placeholder="dd/mm/aaaa"
                maxLength={10}
                inputMode="numeric"
                aria-invalid={!!erroresFormulario.plazo_limite}
              />
              {erroresFormulario.plazo_limite ? (
                <span className="error-campo">
                  <IconoError /> {erroresFormulario.plazo_limite}
                </span>
              ) : (
              <span className="texto-ayuda-campo">
                Fecha máxima para tener todo listo antes del evento. Debe ser hoy o futura.
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
                      <strong>{s.nombre}</strong> — plazo{" "}
                      {formatearFechaVisual(s.plazo)} — {s.horas_estimadas} h
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
                aria-invalid={!!errorNombreSubtarea}
              />
              {errorNombreSubtarea && (
                <span className="error-campo">
                  <IconoError /> {errorNombreSubtarea}
                </span>
              )}
            </div>

            <div className="campo">
              <label htmlFor="subtarea-plazo">Plazo de la gestión</label>
              <input
                id="subtarea-plazo"
                type="text"
                name="plazo"
                value={
                  nuevaSubtarea.plazo.includes("-")
                    ? formatearFechaVisual(nuevaSubtarea.plazo)
                    : nuevaSubtarea.plazo
                }
                onChange={manejarCambioSubtarea}
                placeholder="dd/mm/aaaa"
                maxLength={10}
                inputMode="numeric"
                aria-invalid={!!errorPlazoSubtarea}
              />
              {errorPlazoSubtarea ?(
                <span className="error-campo">
                  <IconoError /> {errorPlazoSubtarea}
                </span>
              ) : (
                <span className="texto-ayuda-campo">
                  Debe ser hoy o una fecha futura (dd/mm/aaaa).
                </span>
              )}
            </div>

            <div className="campo">
              <label htmlFor="subtarea-horas">Horas estimadas</label>
              <input
                id="subtarea-horas"
                type="text"
                inputMode="numeric"
                name="horas_estimadas"
                value={nuevaSubtarea.horas_estimadas}
                onChange={manejarCambioSubtarea}
                placeholder="Ej. 4"
                maxLength={2}
                aria-invalid={!!errorHorasSubtarea}
              />
              {errorHorasSubtarea ? (
                <span className="error-campo">
                  <IconoError /> {errorHorasSubtarea}
                </span>
              ) : (
                <span className="texto-ayuda-campo">
                  Número entero entre 1 y 12 (sin decimales).
              </span>
              )}
            </div>

            <button type="button" className="boton-principal" onClick={agregarSubtarea}>
              Agregar gestión a la lista
            </button>
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

          <button type="submit" className="boton-ancho" disabled={enviando}>
            {enviando ? "Guardando..." : "Crear evento"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default Crear;