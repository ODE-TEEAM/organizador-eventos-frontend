
import { useEffect, useState } from "react";
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
  LIMITE_DIARIO_MAX,
  EVENTO_DATOS_CAMBIARON,
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
  const [solicitudAbrirLimite, setSolicitudAbrirLimite] = useState(0);
  // Mensaje para lectores de pantalla al agregar/quitar gestiones.
  const [avisoLista, setAvisoLista] = useState("");

  // Carga del día (mejora de usabilidad Sprint 5): horas ya ocupadas por
  // fecha en OTROS eventos + límite diario. Permite avisar del conflicto
  // ANTES de guardar, en vez de descubrirlo después en la página del evento.
  const [horasOcupadasPorFecha, setHorasOcupadasPorFecha] = useState({});
  const [limiteDiario, setLimiteDiario] = useState(null);

  useEffect(() => {
    let cancelado = false;
    const cargarCargaDelDia = () =>
      fetch(`${API_URL}/hoy/`, { headers: getAuthHeaders() })
        .then((r) => (r.ok ? r.json() : null))
        .then((datos) => {
          if (cancelado || !datos) return;
          const mapa = {};
          for (const g of datos.gestiones || []) {
            if (!g.fecha) continue;
            mapa[g.fecha] = (mapa[g.fecha] || 0) + Number(g.horas_estimadas || 0);
          }
          setHorasOcupadasPorFecha(mapa);
          if (datos.limite_horas_diarias != null) {
            setLimiteDiario(Number(datos.limite_horas_diarias));
          }
        })
        .catch(() => {
          // Sin datos de carga: el backend sigue validando el límite al guardar.
        });

    cargarCargaDelDia();
    // Si el organizador cambia su límite desde "Cambiar límite", se recalcula.
    window.addEventListener(EVENTO_DATOS_CAMBIARON, cargarCargaDelDia);
    return () => {
      cancelado = true;
      window.removeEventListener(EVENTO_DATOS_CAMBIARON, cargarCargaDelDia);
    };
  }, []);

  // Tope de horas de UNA gestión: nunca más que el límite diario.
  const horasMaximas = Math.min(HORAS_MAX, limiteDiario ?? HORAS_MAX);
  // Plazo de gestión que quedó después del día del evento (acción rápida).
  const [plazoFueraDelEvento, setPlazoFueraDelEvento] = useState("");

  // Horas de una fecha: otros eventos + gestiones ya agregadas en esta lista.
  const horasDelDia = (fechaISO, excluirIndice = -1) =>
    (horasOcupadasPorFecha[fechaISO] || 0) +
    subtareas
      .filter((s, i) => s.plazo === fechaISO && i !== excluirIndice)
      .reduce((total, s) => total + Number(s.horas_estimadas || 0), 0);

  const plazoNuevaISO = nuevaSubtarea.plazo.includes("-")
    ? nuevaSubtarea.plazo
    : "";
  const horasYaEnFecha = plazoNuevaISO ? horasDelDia(plazoNuevaISO) : 0;

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

  const agregarSubtarea = (fechaHoraEvento = formulario.fecha_hora) => {
    setErrorNombreSubtarea("");
    setErrorPlazoSubtarea("");
    setErrorHorasSubtarea("");
    setPlazoFueraDelEvento("");

    let hayError = false;

    if (!esTextoValido(nuevaSubtarea.nombre)) {
      setErrorNombreSubtarea("Escribe un nombre de al menos 3 letras.");
      hayError = true;
    }

    // Normalizar plazo a ISO si viene en dd/mm/aaaa
    let plazoISO = nuevaSubtarea.plazo;
    if (plazoISO && !plazoISO.includes("-")) {
      plazoISO = convertirFechaAISO(plazoISO);
    }

    if (!nuevaSubtarea.plazo) {
      setErrorPlazoSubtarea("Escribe el plazo.");
      hayError = true;
    } else if (!plazoISO || !esFechaFutura(plazoISO)) {
      setErrorPlazoSubtarea("Usa una fecha de hoy en adelante (dd/mm/aaaa).");
      hayError = true;
    } else if (
      fechaHoraEvento &&
      plazoISO > fechaHoraEvento.slice(0, 10)
    ) {
      setErrorPlazoSubtarea(
        `Queda después del evento (${formatearFechaVisual(fechaHoraEvento.slice(0, 10))}).`
      );
      // Acción rápida: ofrecer mover el evento a esa fecha sin perder la gestión.
      setPlazoFueraDelEvento(plazoISO);
      hayError = true;
    }

    const horasStr = String(nuevaSubtarea.horas_estimadas || "").trim();
    const horas = Number(horasStr);

    if (
      !horasStr ||
      !Number.isInteger(horas) ||
      horas < HORAS_MIN ||
      horas > horasMaximas
    ) {
      setErrorHorasSubtarea(
        `Usa un número entero entre ${HORAS_MIN} y ${horasMaximas}.`
      );
      hayError = true;
    }

    // Conflicto con el límite diario detectado en el navegador: se avisa aquí
    // con el detalle de horas, en lugar de crear el evento y perder la gestión.
    if (!hayError && limiteDiario !== null) {
      const ocupadas = horasDelDia(plazoISO);
      const total = ocupadas + horas;
      if (total > limiteDiario) {
        const disponibles = Math.max(0, limiteDiario - ocupadas);
        setErrorHorasSubtarea(
          `El ${formatearFechaVisual(plazoISO)} ya tienes ${ocupadas} h; con esta serían ` +
            `${total} h y tu límite es ${limiteDiario} h. ` +
            (disponibles > 0
              ? `Usa máximo ${disponibles} h, elige otra fecha o cambia tu límite.`
              : "Ese día está lleno: elige otra fecha o cambia tu límite.")
        );
        hayError = true;
      }
    }

    if (hayError) {
      // Lleva el foco al primer campo con error de la gestión.
      setTimeout(() => {
        document
          .querySelector('.bloque-nueva-gestion [aria-invalid="true"]')
          ?.focus();
      }, 0);
      return;
    }

    setSubtareas([
      ...subtareas,
      {
        nombre: nuevaSubtarea.nombre.trim(),
        plazo: plazoISO,
        horas_estimadas: horas,
      },
    ]);
    setNuevaSubtarea({ nombre: "", plazo: "", horas_estimadas: "" });
    setAvisoLista(`Gestión "${nuevaSubtarea.nombre.trim()}" agregada a la lista.`);
    // Deja el foco listo para escribir la siguiente gestión.
    document.getElementById("subtarea-nombre")?.focus();
  };

  const moverEventoAlPlazo = () => {
    if (!plazoFueraDelEvento) return;
    const hora = formulario.fecha_hora ? formulario.fecha_hora.slice(11, 16) : "";
    const nuevaFechaHora = `${plazoFueraDelEvento}T${hora || "12:00"}`;
    setFormulario({ ...formulario, fecha_hora: nuevaFechaHora });
    setErroresFormulario({ ...erroresFormulario, fecha_hora: undefined });
    agregarSubtarea(nuevaFechaHora);
  };

  const quitarSubtarea = (index) => {
    const quitada = subtareas[index];
    setSubtareas(subtareas.filter((_, i) => i !== index));
    setAvisoLista(quitada ? `Gestión "${quitada.nombre}" quitada de la lista.` : "");
    document.getElementById("subtarea-nombre")?.focus();
  };

  // Enter dentro de los campos de la gestión agrega la gestión a la lista
  // (antes enviaba el formulario completo y creaba el evento sin querer).
  const enterAgregaGestion = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      agregarSubtarea();
    }
  };

    // Crea la gestión logística en el backend.
const crearSubtareaEnBackend = async (eventoId, subtarea) => {
  const respuesta = await fetch(`${API_URL}/eventos/${eventoId}/subtareas/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(subtarea),
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    // Mensaje amigable para conflictos con el límite diario.
    if (datos.conflicto && datos.mensaje) {
      const fecha = datos.fecha
        ? formatearFechaVisual(datos.fecha)
        : "";

      const detalles = [
        `No se pudo guardar la gestión "${subtarea.nombre}".`,
        datos.mensaje,
        fecha ? `Fecha: ${fecha}.` : "",
        datos.horas_existentes !== undefined
          ? `Horas que ya tenías asignadas: ${datos.horas_existentes} h.`
          : "",
        datos.horas_nuevas !== undefined
          ? `Horas de esta gestión: ${datos.horas_nuevas} h.`
          : "",
        datos.horas_totales !== undefined
          ? `Total resultante: ${datos.horas_totales} h.`
          : "",
        datos.limite_horas !== undefined
          ? `Tu límite diario es de ${datos.limite_horas} h.`
          : "",
      ].filter(Boolean);

      const error = new Error(datos.mensaje);
      error.detalleGestion = {
        nombre: subtarea.nombre,
        fecha: datos.fecha,
        horasExistentes: datos.horas_existentes,
        horasNuevas: datos.horas_nuevas,
        horasTotales: datos.horas_totales,
        limiteHoras: datos.limite_horas,
      };
      throw error;
      
    }

    throw new Error(
      mensajeDeError(
        datos,
        `No se pudo guardar la gestión "${subtarea.nombre}":`
      )
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
        // Si el backend rechaza el evento por superar el límite de horas.
        if (datos.conflicto && datos.mensaje) {
          setErroresFormulario({});
          setEstadoEnvio("error");
          setMensajeError(datos.mensaje);
          return;
        }

        // Manejar otros errores de validación.
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
            erroresSubtareas.push({
              mensaje: err.message,
              detalle: err.detalleGestion || null,
            });
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
      <Header solicitudAbrirLimite={solicitudAbrirLimite} />

      <main id="contenido" tabIndex={-1} className="contenedor contenedor-estrecho pagina-formulario">
        <h1>Crear evento</h1>
        <p className="subtitulo">
          Dos pasos: los datos del evento y, si quieres, sus gestiones.
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
                aria-describedby={erroresFormulario.nombre ? "nombre-error" : undefined}
                aria-required="true"
              />
              {erroresFormulario.nombre && (
                <span className="error-campo" id="nombre-error">
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
                aria-describedby={erroresFormulario.tipo ? "tipo-error" : undefined}
                aria-required="true"
              />
              {erroresFormulario.tipo && (
                <span className="error-campo" id="tipo-error">
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
                placeholder="Ej. Camila Ríos o Café Aroma SAS"
                aria-invalid={!!erroresFormulario.cliente}
                aria-describedby={erroresFormulario.cliente ? "cliente-error" : "cliente-ayuda"}
                aria-required="true"
              />
              {erroresFormulario.cliente ? (
                <span className="error-campo" id="cliente-error">
                  <IconoError /> {erroresFormulario.cliente}
                </span>
              ) : (
                <span className="texto-ayuda-campo" id="cliente-ayuda">
                  La persona o empresa que te contrata el evento, no tu nombre como
                  organizador.
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
                aria-describedby={erroresFormulario.fecha_hora ? "fecha_hora-error" : "fecha_hora-ayuda"}
                aria-required="true"
              />
              {erroresFormulario.fecha_hora ? (
                <span className="error-campo" id="fecha_hora-error">
                  <IconoError /> {erroresFormulario.fecha_hora}
                </span>
              ) : (
                <span className="texto-ayuda-campo" id="fecha_hora-ayuda">
                  Debe ser una fecha y hora futuras.
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
                aria-describedby={erroresFormulario.lugar ? "lugar-error" : "lugar-ayuda"}
                aria-required="true"
              />
              {erroresFormulario.lugar ? (
                <span className="error-campo" id="lugar-error">
                  <IconoError /> {erroresFormulario.lugar}
                </span>
              ) : (
                <span className="texto-ayuda-campo" id="lugar-ayuda">
                  Ej. Salón Los Almendros, Cali.
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
                aria-describedby={erroresFormulario.plazo_limite ? "plazo_limite-error" : "plazo_limite-ayuda"}
                aria-required="true"
              />
              {erroresFormulario.plazo_limite ? (
                <span className="error-campo" id="plazo_limite-error">
                  <IconoError /> {erroresFormulario.plazo_limite}
                </span>
              ) : (
              <span className="texto-ayuda-campo" id="plazo_limite-ayuda">
                Hasta cuándo debe estar todo listo (no después del evento).
              </span>
              )}
            </div>
          </div>

          <div className="paso-encabezado">
            <span className="paso-numero">2</span>
            <h2>Plan logístico</h2>
          </div>
          <p className="texto-ayuda">
            Opcional. Ej.: reservar salón, enviar invitaciones, confirmar catering.
          </p>

          <div className="tarjeta bloque-nueva-gestion">
            {/* Límite diario siempre visible y editable desde aquí (usuario 1) */}
            {limiteDiario !== null && (
              <div className="aviso-limite-diario">
                <p>
                  Tu límite es de <strong>{limiteDiario} h por día</strong>. Puedes
                  subirlo hasta {LIMITE_DIARIO_MAX} h.
                </p>
                <button
                  type="button"
                  className="boton-secundario"
                  onClick={() => setSolicitudAbrirLimite((n) => n + 1)}
                >
                  Cambiar límite
                </button>
              </div>
            )}
            <p className="solo-lector" role="status" aria-live="polite">
              {avisoLista}
            </p>
            {subtareas.length === 0 ? (
              <p className="estado-vacio">
                Aún no has agregado ninguna gestión logística. Usa el formulario de
                abajo para sumar la primera.
              </p>
            ) : (
              <>
                <ul className="lista-subtareas" aria-label="Gestiones agregadas">
                  {subtareas.map((s, index) => (
                    <li key={index}>
                      <span>
                        <strong>{s.nombre}</strong> — plazo{" "}
                        {formatearFechaVisual(s.plazo)} — {s.horas_estimadas} h
                      </span>
                      <button
                        type="button"
                        onClick={() => quitarSubtarea(index)}
                        aria-label={`Quitar la gestión ${s.nombre}`}
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="resumen-plan">
                  Total del plan: <strong>{subtareas.reduce((t, s) => t + Number(s.horas_estimadas || 0), 0)} h</strong>{" "}
                  en {subtareas.length} {subtareas.length === 1 ? "gestión" : "gestiones"}.
                </p>
              </>
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
                aria-describedby={errorNombreSubtarea ? "subtarea-nombre-error" : undefined}
                onKeyDown={enterAgregaGestion}
              />
              {errorNombreSubtarea && (
                <span className="error-campo" id="subtarea-nombre-error">
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
                aria-describedby={errorPlazoSubtarea ? "subtarea-plazo-error" : "subtarea-plazo-ayuda"}
                onKeyDown={enterAgregaGestion}
              />
              {errorPlazoSubtarea ? (
                <>
                  <span className="error-campo" id="subtarea-plazo-error">
                    <IconoError /> {errorPlazoSubtarea}
                  </span>
                  {plazoFueraDelEvento && (
                    <button
                      type="button"
                      className="boton-secundario boton-accion-rapida"
                      onClick={moverEventoAlPlazo}
                    >
                      Mover el evento al {formatearFechaVisual(plazoFueraDelEvento)} y
                      agregar
                    </button>
                  )}
                </>
              ) : (
                <span className="texto-ayuda-campo" id="subtarea-plazo-ayuda">
                  Hoy o una fecha futura.
                  {plazoNuevaISO && limiteDiario !== null && (
                    <span
                      className={
                        horasYaEnFecha >= limiteDiario
                          ? "carga-dia carga-dia-llena"
                          : "carga-dia"
                      }
                    >
                      {" "}Ese día ya tienes {horasYaEnFecha} h de {limiteDiario} h
                      {horasYaEnFecha >= limiteDiario
                        ? ": está lleno, elige otra fecha."
                        : ` (quedan ${limiteDiario - horasYaEnFecha} h libres).`}
                    </span>
                  )}
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
                aria-describedby={errorHorasSubtarea ? "subtarea-horas-error" : "subtarea-horas-ayuda"}
                onKeyDown={enterAgregaGestion}
              />
              {errorHorasSubtarea ? (
                <span className="error-campo" id="subtarea-horas-error">
                  <IconoError /> {errorHorasSubtarea}
                </span>
              ) : (
                <span className="texto-ayuda-campo" id="subtarea-horas-ayuda">
                  De 1 a {horasMaximas} h (sin decimales).
              </span>
              )}
            </div>

            <button type="button" className="boton-principal" onClick={() => agregarSubtarea()}>
              Agregar gestión a la lista
            </button>
          </div>

          {/* Estados UX visibles: carga, éxito y error (anunciados por lector de pantalla) */}
          <div role="status" aria-live="polite">
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
          </div>

          <button type="submit" className="boton-ancho" disabled={enviando}>
            {enviando ? "Guardando..." : "Crear evento"}
          </button>

          
          {estadoEnvio === "error" && mensajeError && (
            <div className="alerta alerta-error" role="alert">
              <p>
                <IconoError /> {mensajeError}
              </p>

              {mensajeError.includes("límite diario") && (
                <button
                  type="button"
                  className="boton-principal"
                  onClick={() => setSolicitudAbrirLimite((n) => n + 1)}
                >
                  Cambiar límite
                </button>
              )}
            </div>
          )}

        </form>
      </main>
    </div>
  );
}

export default Crear;