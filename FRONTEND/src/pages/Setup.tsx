import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { consultarEstadoSetup, crearPrimerAdministrador } from '../services/setup.service';
import { ErrorApi } from '../services/api';
import { mostrarToast } from '../store/toasts';
import Marca from '../components/Marca';
import estilos from './Login.module.css';

const REQUISITOS = [
  { clave: 'longitud', texto: 'Al menos 8 caracteres', cumple: (v: string) => v.length >= 8 },
  { clave: 'mayuscula', texto: 'Una letra mayúscula', cumple: (v: string) => /[A-Z]/.test(v) },
  { clave: 'numero', texto: 'Un número', cumple: (v: string) => /[0-9]/.test(v) },
];

/** Icono de ojo mostrar u ocultar. Cambia segun si esta visible. */
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

function Setup() {
  const navegar = useNavigate();

  const [verificando, setVerificando] = useState(true);
  const [usuario, setUsuario] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Si el sistema ya tiene un usuario esta pantalla queda cerrada y se envia al login
  useEffect(() => {
    let cancelado = false;
    consultarEstadoSetup()
      .then((estadoActual) => {
        if (cancelado) return;
        if (!estadoActual.requiere_configuracion) {
          navegar('/login', { replace: true });
          return;
        }
        setVerificando(false);
      })
      .catch(() => {
        if (!cancelado) navegar('/login', { replace: true });
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function requisitosCumplidos(): boolean {
    return REQUISITOS.every((r) => r.cumple(password));
  }

  async function manejarEnvio() {
    setError('');

    if (!usuario.trim() || /\s/.test(usuario)) {
      setError('Escribe un nombre de usuario válido.');
      return;
    }
    if (!nombreCompleto.trim()) {
      setError('Escribe el nombre completo.');
      return;
    }
    if (!requisitosCumplidos()) {
      setError('La contraseña no cumple los requisitos.');
      return;
    }
    if (password !== passwordConfirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setEnviando(true);
    try {
      await crearPrimerAdministrador({
        usuario,
        nombre_completo: nombreCompleto,
        password,
      });
      mostrarToast({
        tipo: 'exito',
        titulo: 'Administrador creado',
        mensaje: 'Ya puedes iniciar sesión con tu nueva cuenta.',
      });
      navegar('/login', { replace: true });
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : 'No se pudo crear el administrador');
    } finally {
      setEnviando(false);
    }
  }

  if (verificando) {
    return (
      <div className={estilos.pantalla}>
        <div className={estilos.tarjeta}>
          <p className={estilos.lead}>Verificando…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={estilos.pantalla}>
      <div className={estilos.tarjeta}>
        <Marca />

        <h1 className={estilos.titulo}>Configuración inicial</h1>
        <p className={estilos.lead}>
          Crea la cuenta de administrador para comenzar a usar el sistema.
        </p>

        {error && <div className={estilos.error}>{error}</div>}

        <div className={estilos.campo}>
          <label htmlFor="usuario">Usuario</label>
          <div className={estilos.inputWrap}>
            <svg className={estilos.iconoCampo} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <input
              id="usuario"
              className={estilos.conIcono}
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="usuario"
              autoComplete="username"
            />
          </div>
        </div>

        <div className={estilos.campo}>
          <label htmlFor="nombreCompleto">Nombre completo</label>
          <div className={estilos.inputWrap}>
            <svg className={estilos.iconoCampo} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <input
              id="nombreCompleto"
              className={estilos.conIcono}
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              placeholder="Nombre completo"
              autoComplete="name"
            />
          </div>
        </div>

        <div className={estilos.campo}>
          <label htmlFor="password">Contraseña</label>
          <div className={estilos.inputWrap}>
            <svg className={estilos.iconoCampo} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              id="password"
              className={`${estilos.conIcono} ${estilos.conOjo}`}
              type={verPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <button
              type="button"
              className={estilos.ojo}
              onClick={() => setVerPassword(!verPassword)}
              aria-label="Mostrar u ocultar"
            >
              <IconoOjo visible={verPassword} />
            </button>
          </div>
        </div>

        <ul className={estilos.requisitos}>
          {REQUISITOS.map((r) => {
            const ok = r.cumple(password);
            return (
              <li key={r.clave} className={ok ? estilos.cumplido : ''}>
                <span className={estilos.marca}>{ok ? '✓' : ''}</span>
                {r.texto}
              </li>
            );
          })}
        </ul>

        <div className={estilos.campo}>
          <label htmlFor="confirmar">Confirmar contraseña</label>
          <div className={estilos.inputWrap}>
            <svg className={estilos.iconoCampo} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              id="confirmar"
              className={`${estilos.conIcono} ${estilos.conOjo}`}
              type={verConfirmar ? 'text' : 'password'}
              value={passwordConfirmar}
              onChange={(e) => setPasswordConfirmar(e.target.value)}
              placeholder="Repite la contraseña"
              autoComplete="new-password"
            />
            <button
              type="button"
              className={estilos.ojo}
              onClick={() => setVerConfirmar(!verConfirmar)}
              aria-label="Mostrar u ocultar"
            >
              <IconoOjo visible={verConfirmar} />
            </button>
          </div>
        </div>

        <button type="button" className={estilos.boton} onClick={manejarEnvio} disabled={enviando}>
          {enviando ? 'Creando...' : 'Crear administrador'}
        </button>
      </div>
    </div>
  );
}

export default Setup;
