import { useEffect, useState } from 'react';
import { obtenerUsuario, actualizarSesion, getAuthHeaders } from '../auth';
import AvatarAnimal, { animalDe } from './AvatarAnimal';
import InputPassword from './InputPassword';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export default function ModalPerfil({ abierto, onCerrar, onActualizar }) {
  const [pestana, setPestana] = useState('nombre');
  const [limiteHoras, setLimiteHoras] = useState(6);
  const [cargandoLimite, setCargandoLimite] = useState(false);
  const [guardandoLimite, setGuardandoLimite] = useState(false);
  const [nombre, setNombre] = useState('');
  const [claveActual, setClaveActual] = useState('');
  const [claveNueva, setClaveNueva] = useState('');
  const [claveConfirmar, setClaveConfirmar] = useState('');
  const [errores, setErrores] = useState({});
  const [exito, setExito] = useState('');
  const [cargando, setCargando] = useState(false);

  const usuario = obtenerUsuario();
  const semilla = usuario?.email || usuario?.user?.email || '';

  useEffect(() => {
    if (abierto) {
      setPestana('nombre');
      setNombre(usuario?.nombre || usuario?.user?.nombre || '');
      setClaveActual('');
      setClaveNueva('');
      setClaveConfirmar('');
      setErrores({});
      setExito('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    const tecla = (e) => {
      if (e.key === 'Escape') onCerrar();
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [abierto, onCerrar]);


  useEffect(() => {
    if (!abierto || pestana !== 'limite') return;

    cargarLimiteHoras();
  }, [abierto, pestana]);

  if (!abierto) return null;

  const limpiarError = (campo) => {
    if (errores[campo]) setErrores({ ...errores, [campo]: undefined });
    setExito('');
  };

  

  const cargarLimiteHoras = async () => {
  setCargandoLimite(true);
  setErrores({});
  setExito('');

  try {
    const respuesta = await fetch(`${API_URL}/configuracion/limite-horas/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      setErrores({
        general: 'No pudimos cargar tu límite diario. Intenta de nuevo.',
      });
      setCargandoLimite(false);
      return;
    }

    setLimiteHoras(datos.limite_horas_diarias);
  } catch {
    setErrores({
      general: 'No pudimos conectar con el servidor. Intenta de nuevo en unos segundos.',
    });
  }

  setCargandoLimite(false);
};

  const guardarNombre = async (e) => {
    e.preventDefault();
    setExito('');
    const limpio = nombre.trim();

    if (limpio.length < 3) {
      setErrores({ nombre: 'Tu nombre debe tener al menos 3 caracteres.' });
      return;
    }

    setCargando(true);
    try {
      const respuesta = await fetch(`${API_URL}/perfil/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ nombre: limpio }),
      });
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setErrores(datos || {});
        setCargando(false);
        return;
      }

      const nuevaSesion = actualizarSesion({ nombre: datos.nombre });
      onActualizar?.(nuevaSesion);
      setExito('¡Listo! Tu nombre se actualizó correctamente.');
    } catch {
      setErrores({ general: 'No pudimos conectar con el servidor. Intenta de nuevo en unos segundos.' });
    }
    setCargando(false);
  };

const guardarLimiteHoras = async (e) => {
  e.preventDefault();
  setExito('');

  const valor = Number(limiteHoras);

  if (!Number.isInteger(valor) || valor < 1 || valor > 16) {
    setErrores({
      limite: 'El límite diario debe estar entre 1 y 16 horas.',
    });
    return;
  }

  setGuardandoLimite(true);

  try {
    const respuesta = await fetch(
      `${API_URL}/configuracion/limite-horas/`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          limite_horas_diarias: valor,
        }),
      }
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      const mensaje = Array.isArray(datos?.limite_horas_diarias)
        ? datos.limite_horas_diarias[0]
        : 'No pudimos guardar tu límite diario.';

      setErrores({ limite: mensaje });
      setGuardandoLimite(false);
      return;
    }

    setLimiteHoras(datos.limite_horas_diarias);
    setExito(
      `¡Listo! Tu límite diario quedó en ${datos.limite_horas_diarias} horas.`
    );
  } catch {
    setErrores({
      limite:
        'No pudimos conectar con el servidor. Intenta de nuevo en unos segundos.',
    });
  }

  setGuardandoLimite(false);
};

  const guardarClave = async (e) => {
    e.preventDefault();
    setExito('');
    const nuevos = {};

    if (!claveActual) nuevos.password_actual = 'Escribe tu contraseña actual para confirmar que eres tú.';
    if (claveNueva.length < 6) {
      nuevos.password_nueva = 'Tu nueva contraseña debe tener al menos 6 caracteres.';
    } else if (claveNueva !== claveConfirmar) {
      nuevos.password_nueva = 'Las contraseñas nuevas no coinciden. Escríbelas igual en ambos campos.';
    }

    if (Object.keys(nuevos).length > 0) {
      setErrores(nuevos);
      return;
    }

    setCargando(true);
    try {
      const respuesta = await fetch(`${API_URL}/perfil/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          password_actual: claveActual,
          password_nueva: claveNueva,
        }),
      });
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setErrores(datos || {});
        setCargando(false);
        return;
      }

      setClaveActual('');
      setClaveNueva('');
      setClaveConfirmar('');
      setExito('¡Listo! Tu contraseña se actualizó. Úsala la próxima vez que entres.');
    } catch {
      setErrores({ general: 'No pudimos conectar con el servidor. Intenta de nuevo en unos segundos.' });
    }
    setCargando(false);
  };

  return (
    <div className="modal-fondo" onMouseDown={onCerrar}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-cabecera">
          <div>
            <h2 className="modal-titulo">Mi perfil</h2>
            <p className="modal-subtitulo">
              Personaliza tu cuenta sin salir de la aplicación.
            </p>
          </div>
          <button className="modal-cerrar" onClick={onCerrar} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="modal-perfil-cabecera">
          <AvatarAnimal semilla={semilla} size={56} />
          <div>
            <div className="usuario-menu-nombre">
              {usuario?.nombre || usuario?.user?.nombre || 'Organizador'}
            </div>
            <div className="usuario-menu-correo">{usuario?.email || ''}</div>
            <span className="usuario-menu-animal">✦ {animalDe(semilla).nombre}</span>
          </div>
        </div>

        <div className="pestanas" role="tablist">
          <button
            className={`pestana ${pestana === 'nombre' ? 'pestana-activa' : ''}`}
            onClick={() => {
              setPestana('nombre');
              setErrores({});
              setExito('');
            }}
          >
            Cambiar nombre
          </button>
          <button
            className={`pestana ${pestana === 'clave' ? 'pestana-activa' : ''}`}
            onClick={() => {
              setPestana('clave');
              setErrores({});
              setExito('');
            }}
          >
            Cambiar contraseña
          </button>
          <button
          className={`pestana ${pestana === 'limite' ? 'pestana-activa' : ''}`}
          onClick={() => {
            setPestana('limite');
            setErrores({});
            setExito('');
          }}
        >
          Límite diario
        </button>
        </div>

        {pestana === 'nombre' ? (
          <form onSubmit={guardarNombre} noValidate>
            <div className="campo">
              <label htmlFor="perfil-nombre">Nombre visible</label>
              <input
                id="perfil-nombre"
                type="text"
                value={nombre}
                placeholder="Ej. Ana Pérez"
                onChange={(e) => {
                  setNombre(e.target.value);
                  limpiarError('nombre');
                }}
                aria-invalid={!!errores.nombre}
                disabled={cargando}
              />
              {errores.nombre && <span className="error-campo">{errores.nombre}</span>}
            </div>

            {errores.general && <p className="alerta alerta-error">{errores.general}</p>}
            {exito && pestana === 'nombre' && (
              <p className="alerta alerta-exito">{exito}</p>
            )}

            <button type="submit" className="btn btn-primario btn-ancho" disabled={cargando}>
              {cargando ? 'Guardando...' : 'Guardar nombre'}
            </button>
          </form>
            ) : pestana === 'clave' ? (
          <form onSubmit={guardarClave} noValidate>
            <div className="campo">
              <label htmlFor="perfil-clave-actual">Contraseña actual</label>
              <InputPassword
                id="perfil-clave-actual"
                name="password_actual"
                value={claveActual}
                placeholder="Tu contraseña de siempre"
                onChange={(e) => {
                  setClaveActual(e.target.value);
                  limpiarError('password_actual');
                }}
                ariaInvalid={!!errores.password_actual}
                disabled={cargando}
                autoComplete="current-password"
              />
              {errores.password_actual && (
                <span className="error-campo">{errores.password_actual}</span>
              )}
            </div>

            <div className="campo">
              <label htmlFor="perfil-clave-nueva">Nueva contraseña</label>
              <InputPassword
                id="perfil-clave-nueva"
                name="password_nueva"
                value={claveNueva}
                placeholder="Mínimo 6 caracteres"
                onChange={(e) => {
                  setClaveNueva(e.target.value);
                  limpiarError('password_nueva');
                }}
                ariaInvalid={!!errores.password_nueva}
                disabled={cargando}
                autoComplete="new-password"
              />
              {errores.password_nueva && (
                <span className="error-campo">{errores.password_nueva}</span>
              )}
            </div>

            <div className="campo">
              <label htmlFor="perfil-clave-confirmar">Confirmar nueva contraseña</label>
              <InputPassword
                id="perfil-clave-confirmar"
                name="password_confirmar"
                value={claveConfirmar}
                placeholder="Repite la nueva contraseña"
                onChange={(e) => {
                  setClaveConfirmar(e.target.value);
                  limpiarError('password_nueva');
                }}
                disabled={cargando}
                autoComplete="new-password"
              />
            </div>

            {errores.general && <p className="alerta alerta-error">{errores.general}</p>}
            {exito && pestana === 'clave' && (
              <p className="alerta alerta-exito">{exito}</p>
            )}

            <button type="submit" className="btn btn-primario btn-ancho" disabled={cargando}>
              {cargando ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
                    </form>
        ) : (
    <form className="formulario-limite" onSubmit={guardarLimiteHoras} noValidate>
    

    <div className="campo">
      <label htmlFor="perfil-limite-horas">
        Límite diario de horas
      </label>

      <p className="texto-descripcion-campo">
        Define tu límite diario de horas
      </p>

      <input
        id="perfil-limite-horas"
        type="number"
        min="1"
        max="16"
        step="1"
        placeholder="Ingresa un valor de 1 a 16 horas"
        value={limiteHoras}
        onChange={(e) => {
          setLimiteHoras(e.target.value);
          setErrores((prev) => ({ ...prev, limite: undefined }));
          setExito('');
        }}
        disabled={cargandoLimite || guardandoLimite}
      />

      <span className="texto-ayuda-campo">
        Puedes elegir entre 1 y 16 horas.
      </span>

      {errores.limite && (
        <span className="error-campo">{errores.limite}</span>
      )}
    </div>

    {cargandoLimite && (
      <p className="texto-ayuda-campo">Cargando configuración...</p>
    )}

    {errores.general && (
      <p className="alerta alerta-error">{errores.general}</p>
    )}

    {exito && pestana === 'limite' && (
      <p className="alerta alerta-exito">{exito}</p>
    )}

    <button
      type="submit"
      className="btn btn-primario btn-ancho"
      disabled={cargandoLimite || guardandoLimite}
    >
      {guardandoLimite ? 'Guardando...' : 'Guardar límite'}
    </button>
  </form>
)}
      </div>
    </div>
  );
}