import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cambiarPassword } from '../services/auth.service';
import { obtenerToken } from '../services/sesion';
import Marca from '../components/Marca';
import estilos from './Login.module.css';

const REQUISITOS = [
  { clave: 'longitud', texto: 'Al menos 8 caracteres', cumple: (v: string) => v.length >= 8 },
  { clave: 'mayuscula', texto: 'Una letra mayúscula', cumple: (v: string) => /[A-Z]/.test(v) },
  { clave: 'numero', texto: 'Un número', cumple: (v: string) => /[0-9]/.test(v) },
];

/** Icono de ojo (mostrar/ocultar). Cambia según si está visible. */
function IconoOjo({ visible }: { visible: boolean }) {
  return visible ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CambiarPassword() {
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const modoForzado = (ubicacion.state as { forzado?: boolean } | null)?.forzado ?? true;

  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNuevo, setPasswordNuevo] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [verActual, setVerActual] = useState(false);
  const [verNuevo, setVerNuevo] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  function requisitosCumplidos(): boolean {
    return REQUISITOS.every((r) => r.cumple(passwordNuevo));
  }

  async function manejarCambio() {
    setError('');

    if (!modoForzado && !passwordActual) {
      setError('Escribe tu contraseña actual.');
      return;
    }
    if (!requisitosCumplidos()) {
      setError('La nueva contraseña no cumple los requisitos.');
      return;
    }
    if (passwordNuevo !== passwordConfirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    const token = obtenerToken();
    if (!token) {
      navegar('/login');
      return;
    }

    setCargando(true);
    try {
      await cambiarPassword(token, passwordNuevo, modoForzado ? undefined : passwordActual);
      alert('Contraseña actualizada correctamente');
      navegar('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar la contraseña');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className={estilos.pantalla}>
      <div className={estilos.tarjeta}>
        <Marca />

        <h1 className={estilos.titulo}>
          {modoForzado ? 'Define tu nueva contraseña' : 'Cambiar contraseña'}
        </h1>
        <p className={estilos.lead}>
          {modoForzado
            ? 'Por seguridad, cambia tu contraseña temporal para continuar.'
            : 'Actualiza tu contraseña de acceso.'}
        </p>

        {error && <div className={estilos.error}>{error}</div>}

        {!modoForzado && (
          <div className={estilos.campo}>
            <label htmlFor="actual">Contraseña actual</label>
            <div className={estilos.inputWrap}>
              <svg className={estilos.iconoCampo} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="actual"
                className={`${estilos.conIcono} ${estilos.conOjo}`}
                type={verActual ? 'text' : 'password'}
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                placeholder="••••••••"
              />
              <button type="button" className={estilos.ojo} onClick={() => setVerActual(!verActual)} aria-label="Mostrar u ocultar">
                <IconoOjo visible={verActual} />
              </button>
            </div>
          </div>
        )}

        <div className={estilos.campo}>
          <label htmlFor="nueva">Nueva contraseña</label>
          <div className={estilos.inputWrap}>
            <svg className={estilos.iconoCampo} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              id="nueva"
              className={`${estilos.conIcono} ${estilos.conOjo}`}
              type={verNuevo ? 'text' : 'password'}
              value={passwordNuevo}
              onChange={(e) => setPasswordNuevo(e.target.value)}
              placeholder="Nueva contraseña"
            />
            <button type="button" className={estilos.ojo} onClick={() => setVerNuevo(!verNuevo)} aria-label="Mostrar u ocultar">
              <IconoOjo visible={verNuevo} />
            </button>
          </div>
        </div>

        <ul className={estilos.requisitos}>
          {REQUISITOS.map((r) => {
            const ok = r.cumple(passwordNuevo);
            return (
              <li key={r.clave} className={ok ? estilos.cumplido : ''}>
                <span className={estilos.marca}>{ok ? '✓' : ''}</span>
                {r.texto}
              </li>
            );
          })}
        </ul>

        <div className={estilos.campo}>
          <label htmlFor="confirmar">Confirmar nueva contraseña</label>
          <div className={estilos.inputWrap}>
            <svg className={estilos.iconoCampo} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              id="confirmar"
              className={estilos.conIcono}
              type="password"
              value={passwordConfirmar}
              onChange={(e) => setPasswordConfirmar(e.target.value)}
              placeholder="Repite la contraseña"
            />
          </div>
        </div>

        <div className={estilos.filaBotones}>
          {!modoForzado && (
            <button className={estilos.botonSecundario} onClick={() => navegar(-1)}>
              Cancelar
            </button>
          )}
          <button className={estilos.boton} onClick={manejarCambio} disabled={cargando}>
            {cargando ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CambiarPassword;