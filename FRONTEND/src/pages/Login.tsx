import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { iniciarSesion } from '../services/auth.service';
import { consultarEstadoSetup } from '../services/setup.service';
import { guardarSesion } from '../services/sesion';
import Marca from '../components/Marca';
import estilos from './Login.module.css';

function Login() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  // Mientras se verifica si el sistema requiere configuracion inicial no se pinta el formulario
  const [verificando, setVerificando] = useState(true);

  const navegar = useNavigate();

  // Si el sistema no tiene ningun usuario todavia se envia al flujo de configuracion inicial
  useEffect(() => {
    let cancelado = false;
    consultarEstadoSetup()
      .then((estado) => {
        if (cancelado) return;
        if (estado.requiere_configuracion) {
          navegar('/setup', { replace: true });
          return;
        }
        setVerificando(false);
      })
      .catch(() => {
        // Si la verificacion falla se muestra el login igual para no bloquear el acceso
        if (!cancelado) setVerificando(false);
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function manejarLogin() {
    setError('');

    if (!usuario || !password) {
      setError('Escribe tu usuario y contraseña.');
      return;
    }

    setCargando(true);
    try {
      const respuesta = await iniciarSesion(usuario, password);
      guardarSesion(respuesta.token, respuesta.usuario);

      if (respuesta.debe_cambiar_password) {
        navegar('/cambiar-password');
      } else {
        navegar('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setCargando(false);
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

        <h1 className={estilos.titulo}>Iniciar sesión</h1>
        <p className={estilos.lead}>Acceso para el personal de Sistemas y Telefonía.</p>

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
              autoComplete="current-password"
            />
            <button
              type="button"
              className={estilos.ojo}
              onClick={() => setVerPassword(!verPassword)}
              aria-label="Mostrar u ocultar contraseña"
            >
              {verPassword ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <path d="M1 1l22 22" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button className={estilos.boton} onClick={manejarLogin} disabled={cargando}>
          {cargando ? 'Entrando...' : 'Entrar'}
        </button>
      </div>
    </div>
  );
}

export default Login;