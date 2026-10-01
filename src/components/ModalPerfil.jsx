import { useEffect, useState } from 'react';
import { obtenerUsuario, actualizarSesion, getAuthHeaders } from '../auth';
import AvatarAnimal, { animalDe } from './AvatarAnimal';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export default function ModalPerfil({ abierto, onCerrar, onActualizar }) {
  const [pestana, setPestana] = useState('nombre');
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

  if (!abierto) return null;

  const limpiarError = (campo) => {
    if (errores[campo]) setErrores({ ...errores, [campo]: undefined });
    setExito('');
  };

  const guardarNombre = async (e) => {
    e.preventDefault();
    setExito('');
    const limpio = nombre.trim();

    if (limpio.length < 3) {
      setErrores({ nombre: 'Escribe un nombre de al menos 3 caracteres.' });
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
      setExito('Nombre actualizado correctamente.');
    } catch {
      setErrores({ general: 'No se pudo conectar con el servidor.' });
    }
    setCargando(false);
  };

  const guardarClave = async (e) => {
    e.preventDefault();
    setExito('');
    const nuevos = {};

    if (!claveActual) nuevos.password_actual = 'Escribe tu contraseña actual.';
    if (claveNueva.length < 6) {
      nuevos.password_nueva = 'La nueva contraseña debe tener al menos 6 caracteres.';
    } else if (claveNueva !== claveConfirmar) {
      nuevos.password_nueva = 'Las contraseñas nuevas no coinciden.';
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
      setExito('Contraseña actualizada. Úsala la próxima vez que entres.');
    } catch {
      setErrores({ general: 'No se pudo conectar con el servidor.' });
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
        ) : (
          <form onSubmit={guardarClave} noValidate>
            <div className="campo">
              <label htmlFor="perfil-clave-actual">Contraseña actual</label>
              <input
                id="perfil-clave-actual"
                type="password"
                value={claveActual}
                placeholder="Tu contraseña de siempre"
                onChange={(e) => {
                  setClaveActual(e.target.value);
                  limpiarError('password_actual');
                }}
                aria-invalid={!!errores.password_actual}
                disabled={cargando}
              />
              {errores.password_actual && (
                <span className="error-campo">{errores.password_actual}</span>
              )}
            </div>

            <div className="campo">
              <label htmlFor="perfil-clave-nueva">Nueva contraseña</label>
              <input
                id="perfil-clave-nueva"
                type="password"
                value={claveNueva}
                placeholder="Mínimo 6 caracteres"
                onChange={(e) => {
                  setClaveNueva(e.target.value);
                  limpiarError('password_nueva');
                }}
                aria-invalid={!!errores.password_nueva}
                disabled={cargando}
              />
              {errores.password_nueva && (
                <span className="error-campo">{errores.password_nueva}</span>
              )}
            </div>

            <div className="campo">
              <label htmlFor="perfil-clave-confirmar">Confirmar nueva contraseña</label>
              <input
                id="perfil-clave-confirmar"
                type="password"
                value={claveConfirmar}
                placeholder="Repite la nueva contraseña"
                onChange={(e) => {
                  setClaveConfirmar(e.target.value);
                  limpiarError('password_nueva');
                }}
                disabled={cargando}
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
        )}
      </div>
    </div>
  );
}