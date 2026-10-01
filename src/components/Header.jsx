import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cerrarSesion, obtenerUsuario } from '../auth';
import AvatarAnimal, { animalDe } from './AvatarAnimal';
import ModalPerfil from './ModalPerfil';

export default function Header() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(obtenerUsuario());
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const menuRef = useRef(null);

  const email = usuario?.email || usuario?.user?.email || '';
  const nombre = usuario?.nombre || usuario?.user?.nombre || 'Organizador';

  useEffect(() => {
    const clicFuera = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAbierto(false);
      }
    };
    const tecla = (e) => {
      if (e.key === 'Escape') setMenuAbierto(false);
    };
    document.addEventListener('mousedown', clicFuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', clicFuera);
      document.removeEventListener('keydown', tecla);
    };
  }, []);

  const handleLogout = () => {
    cerrarSesion();
    navigate('/login', { replace: true });
  };

  return (
    <header className="header">
      <div className="header-interior">
        <NavLink to="/hoy" className="header-marca">
          <img src="/hestia-logo.png" alt="HEstia" className="header-logo" />
          <span className="header-marca-nombre">HEstia</span>
        </NavLink>

        <nav className="header-nav" aria-label="Navegación principal">
          <NavLink to="/hoy" className={({ isActive }) => (isActive ? 'activo' : '')}>
            Hoy
          </NavLink>
          <NavLink to="/crear" className={({ isActive }) => (isActive ? 'activo' : '')}>
            Crear evento
          </NavLink>
          <NavLink to="/progreso" className={({ isActive }) => (isActive ? 'activo' : '')}>
            Progreso
          </NavLink>
        </nav>

        <div className="header-acciones" ref={menuRef}>
          <button
            className="usuario-boton"
            onClick={() => setMenuAbierto((v) => !v)}
            aria-expanded={menuAbierto}
            aria-haspopup="menu"
          >
            <AvatarAnimal semilla={email} size={30} />
            <span className="usuario-nombre">{nombre}</span>
            <svg
              className="chevron"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {menuAbierto && (
            <div className="usuario-menu" role="menu">
              <div className="usuario-menu-datos">
                <AvatarAnimal semilla={email} size={44} />
                <div style={{ minWidth: 0 }}>
                  <div className="usuario-menu-nombre">{nombre}</div>
                  <div className="usuario-menu-correo">{email}</div>
                  <span className="usuario-menu-animal">✦ {animalDe(email).nombre}</span>
                </div>
              </div>

              <button
                className="usuario-menu-item"
                role="menuitem"
                onClick={() => {
                  setMenuAbierto(false);
                  setPerfilAbierto(true);
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Mi perfil (nombre y contraseña)
              </button>

              <div className="usuario-menu-separador" />

              <button className="usuario-menu-item peligro" role="menuitem" onClick={handleLogout}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>

      <ModalPerfil
        abierto={perfilAbierto}
        onCerrar={() => setPerfilAbierto(false)}
        onActualizar={(nueva) => setUsuario(nueva)}
      />
    </header>
  );
}