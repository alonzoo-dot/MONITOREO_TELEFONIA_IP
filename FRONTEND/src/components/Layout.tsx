import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { obtenerUsuario, cerrarSesion } from '../services/sesion';
import { usePendientes } from '../hooks/usePendientes';
import { cargarPendientesInicial } from '../store/pendientes';
import estilos from './Layout.module.css';

/** Iniciales para el avatar a partir del nombre completo. */
function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  const primera = partes[0]?.[0] ?? '';
  const segunda = partes[1]?.[0] ?? '';
  return (primera + segunda).toUpperCase() || 'U';
}

/** Secciones del rail. 'activa' indica si ya tiene destino o es un marcador. */
const SECCIONES = [
  {
    texto: 'Dashboard',
    ruta: '/dashboard',
    activa: true,
    icono: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="5" rx="1.5" />
        <rect x="13" y="10" width="8" height="11" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
      </svg>
    ),
  },
  {
    texto: 'Inventario',
    ruta: '/inventario',
    activa: true,
    icono: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6h16M4 12h16M4 18h10" />
      </svg>
    ),
  },
  {
    texto: 'Catálogos',
    ruta: '/catalogos',
    activa: true,
    icono: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7V5a1 1 0 0 1 1-1h4l2 2h8a1 1 0 0 1 1 1v3" />
        <path d="M2 10h20l-1.5 9a1 1 0 0 1-1 .84H4.5a1 1 0 0 1-1-.84z" />
      </svg>
    ),
  },
  {
    texto: 'Incidencias',
    ruta: '/incidencias',
    activa: true,
    icono: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8v4l3 2" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
  {
    texto: 'Estadísticas',
    ruta: '/estadisticas',
    activa: true,
    icono: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M7 14l3-4 4 3 5-6" />
      </svg>
    ),
  },
  {
    texto: 'Usuarios',
    ruta: '/usuarios',
    activa: true,
    icono: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

interface Props {
  children: ReactNode;
}

/** Chasis de la aplicación: rail de navegación expandible + área de contenido. */
function Layout({ children }: Props) {
  const navegar = useNavigate();
  const usuario = obtenerUsuario();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const pendientes = usePendientes();

  useEffect(() => {
    cargarPendientesInicial();
  }, []);

  function manejarCerrarSesion() {
    cerrarSesion();
    navegar('/login', { replace: true });
  }

  return (
    <div className={estilos.contenedor}>
      <button
        className={estilos.menuBtn}
        onClick={() => setMenuAbierto((abierto) => !abierto)}
        aria-label="Abrir menú"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <nav
        className={`${estilos.rail} ${menuAbierto ? estilos.railAbierto : ''}`}
        aria-label="Navegación"
      >
        <div className={estilos.grupo}>
          {SECCIONES.map((seccion) =>
            seccion.activa ? (
              <NavLink
                key={seccion.ruta}
                to={seccion.ruta === '/incidencias' && pendientes > 0 ? '/incidencias?pendientes=1' : seccion.ruta}
                className={({ isActive }) =>
                  isActive ? `${estilos.item} ${estilos.itemActivo}` : estilos.item
                }
                onClick={() => setMenuAbierto(false)}
              >
                <span className={estilos.icWrap}>
                  <span className={estilos.ic}>{seccion.icono}</span>
                  {seccion.ruta === '/incidencias' && pendientes > 0 && (
                    <span className={estilos.badgeNum}>{pendientes > 9 ? '9+' : pendientes}</span>
                  )}
                </span>
                <span className={estilos.lbl}>{seccion.texto}</span>
              </NavLink>
            ) : (
              <span key={seccion.ruta} className={`${estilos.item} ${estilos.itemInactivo}`}>
                <span className={estilos.ic}>{seccion.icono}</span>
                <span className={estilos.lbl}>{seccion.texto}</span>
                <span className={estilos.badge}>Pronto</span>
              </span>
            ),
          )}
        </div>

        <div className={estilos.spacer} />

        <div className={estilos.grupo}>
          <div className={estilos.sep} />
          <div className={estilos.usuario}>
            <span className={estilos.avatar}>{iniciales(usuario?.nombre_completo ?? 'Usuario')}</span>
            <span className={estilos.meta}>
              <b>{usuario?.nombre_completo ?? 'Usuario'}</b>
              <span>{usuario?.tipo_rol ?? ''}</span>
            </span>
          </div>
          <button className={estilos.cerrar} onClick={manejarCerrarSesion} title="Cerrar sesión">
            <span className={estilos.ic}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </span>
            <span className={estilos.lbl}>Cerrar sesión</span>
          </button>
        </div>
      </nav>

      {menuAbierto && <div className={estilos.scrim} onClick={() => setMenuAbierto(false)} />}

      <main className={estilos.main}>{children}</main>
    </div>
  );
}

export default Layout;
