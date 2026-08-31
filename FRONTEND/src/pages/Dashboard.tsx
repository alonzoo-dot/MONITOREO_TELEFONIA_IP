import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Layout from '../components/Layout';
import KpiCards from '../components/dashboard/KpiCards';
import FiltrosMonitoreo from '../components/dashboard/FiltrosMonitoreo';
import type { FiltroEstado } from '../components/dashboard/FiltrosMonitoreo';
import IndicadorSSE from '../components/dashboard/IndicadorSSE';
import TablaMonitoreo from '../components/dashboard/TablaMonitoreo';
import { obtenerDashboard } from '../services/monitoreo.service';
import { useMonitoreoSSE } from '../hooks/useMonitoreoSSE';
import { mostrarToast } from '../store/toasts';
import { cargarPendientesInicial, incrementarPendientes } from '../store/pendientes';
import type { DispositivoConEstado, EventoMonitoreo } from '../types/monitoreo';
import estilos from './Dashboard.module.css';

const INTERVALO_REFRESCO_MS = 2 * 60 * 1000;

function Dashboard() {
  const [dispositivos, setDispositivos] = useState<DispositivoConEstado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('TODOS');

  // Espejo del estado actual para consultarlo desde el manejador de eventos SSE sin generar renders extra.
  const dispositivosRef = useRef<DispositivoConEstado[]>([]);
  useEffect(() => {
    dispositivosRef.current = dispositivos;
  }, [dispositivos]);

  const cargar = useCallback(async () => {
    try {
      const datos = await obtenerDashboard();
      setDispositivos(datos);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el dashboard');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    cargarPendientesInicial();

    const intervalo = setInterval(cargar, INTERVALO_REFRESCO_MS);
    return () => clearInterval(intervalo);
  }, [cargar]);

  const manejarEvento = useCallback((evento: EventoMonitoreo) => {
    if (evento.tipo === 'cambio-estado') {
      const { id_telefono, estado_anterior, estado_nuevo, fecha_ultima_conexion } = evento.payload;
      const dispositivo = dispositivosRef.current.find((d) => d.id_telefono === id_telefono);

      if (dispositivo) {
        if (estado_nuevo === 'OFFLINE') {
          mostrarToast({
            tipo: 'error',
            titulo: 'Teléfono fuera de línea',
            mensaje: `Extensión ${dispositivo.extension} — ${dispositivo.ubicacion_nombre}`,
          });
          incrementarPendientes();
        } else if (estado_nuevo === 'ONLINE' && estado_anterior === 'OFFLINE') {
          mostrarToast({
            tipo: 'exito',
            titulo: 'Teléfono recuperado',
            mensaje: `Extensión ${dispositivo.extension} — ${dispositivo.ubicacion_nombre}`,
          });
        } else if (estado_nuevo === 'EN_MANTENIMIENTO') {
          mostrarToast({
            tipo: 'info',
            titulo: 'Dispositivo en mantenimiento',
            mensaje: `Extensión ${dispositivo.extension} — ${dispositivo.ubicacion_nombre}`,
          });
        } else if (estado_anterior === 'EN_MANTENIMIENTO' && estado_nuevo === 'DESCONOCIDO') {
          mostrarToast({
            tipo: 'info',
            titulo: 'Dispositivo reactivado',
            mensaje: `Extensión ${dispositivo.extension} — ${dispositivo.ubicacion_nombre}. En breve volverá a monitorearse.`,
          });
        }
      }

      setDispositivos((actuales) =>
        actuales.map((d) =>
          d.id_telefono === id_telefono ? { ...d, estado: estado_nuevo, fecha_ultima_conexion } : d,
        ),
      );
    } else if (evento.tipo === 'drift-corregido') {
      const drift = evento.payload;
      console.log('[DASHBOARD] drift-corregido recibido:', drift);
      setDispositivos((actuales) => {
        console.log('[DASHBOARD] actuales.length:', actuales.length);
        const nuevos = actuales.map((d) =>
          d.id_telefono === drift.id_telefono ? { ...d, ip: drift.ip_nueva } : d,
        );
        const cambiado = nuevos.find((d) => d.id_telefono === drift.id_telefono);
        console.log('[DASHBOARD] IP actualizada a:', cambiado?.ip, '| encontrado:', !!cambiado);
        return nuevos;
      });
    } else {
      const { id_telefono } = evento.payload;
      setDispositivos((actuales) => actuales.filter((d) => d.id_telefono !== id_telefono));
    }
  }, []);

  const { estadoConexion } = useMonitoreoSSE(manejarEvento);

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return dispositivos.filter((d) => {
      if (filtroEstado !== 'TODOS' && d.estado !== filtroEstado) return false;
      if (!texto) return true;
      return (
        d.extension.toLowerCase().includes(texto) || d.ubicacion_nombre.toLowerCase().includes(texto)
      );
    });
  }, [dispositivos, busqueda, filtroEstado]);

  return (
    <Layout>
      <div className={estilos.head}>
        <h1 className={estilos.titulo}>Dashboard de monitoreo</h1>
        <IndicadorSSE estado={estadoConexion} />
      </div>

      <KpiCards dispositivos={dispositivos} />

      <FiltrosMonitoreo
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        filtroEstado={filtroEstado}
        onFiltroEstadoChange={setFiltroEstado}
      />

      {error && <div className={estilos.error}>{error}</div>}

      <TablaMonitoreo dispositivos={filtrados} cargando={cargando} />
    </Layout>
  );
}

export default Dashboard;
