import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { URL_BASE } from '../services/api';
import { obtenerToken, cerrarSesion } from '../services/sesion';
import type { EventoMonitoreo, EstadoConexionSSE } from '../types/monitoreo';

const VENTANA_ERRORES_MS = 30000;
const MAX_ERRORES = 3;

/** Abre y mantiene la conexión SSE a /monitoreo/eventos, notificando cada evento vía `onEvento`.
 *  Si detecta 3 errores en menos de 30s (indicio de sesión expirada), cierra sesión y redirige al login. */
export function useMonitoreoSSE(onEvento: (evento: EventoMonitoreo) => void): {
  estadoConexion: EstadoConexionSSE;
} {
  const [estadoConexion, setEstadoConexion] = useState<EstadoConexionSSE>('conectando');
  const onEventoRef = useRef(onEvento);
  onEventoRef.current = onEvento;
  const navegar = useNavigate();

  useEffect(() => {
    const token = obtenerToken();
    if (!token) return;

    const fuente = new EventSource(`${URL_BASE}/monitoreo/eventos?token=${encodeURIComponent(token)}`);
    const erroresRecientes: number[] = [];

    fuente.addEventListener('conectado', () => {
      setEstadoConexion('conectado');
    });

    fuente.addEventListener('cambio-estado', (evento) => {
      const payload = JSON.parse((evento as MessageEvent).data);
      onEventoRef.current({ tipo: 'cambio-estado', payload });
    });

    fuente.addEventListener('drift-corregido', (evento) => {
      const payload = JSON.parse((evento as MessageEvent).data);
      onEventoRef.current({ tipo: 'drift-corregido', payload });
    });

    fuente.onerror = () => {
      const ahora = Date.now();
      erroresRecientes.push(ahora);
      while (erroresRecientes.length > 0 && ahora - erroresRecientes[0] > VENTANA_ERRORES_MS) {
        erroresRecientes.shift();
      }

      if (erroresRecientes.length >= MAX_ERRORES) {
        setEstadoConexion('expirado');
        fuente.close();
        cerrarSesion();
        navegar('/login', { replace: true });
        return;
      }

      setEstadoConexion('reconectando');
    };

    return () => {
      fuente.close();
    };
  }, [navegar]);

  return { estadoConexion };
}
