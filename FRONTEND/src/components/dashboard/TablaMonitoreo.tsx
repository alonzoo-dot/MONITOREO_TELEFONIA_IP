import { useEffect, useState } from 'react';
import type { DispositivoConEstado, EstadoDispositivoMonitoreo } from '../../types/monitoreo';
import { formatoRelativo, formatoAbsoluto } from '../../utils/fechas';
import estilos from './TablaMonitoreo.module.css';

const INTERVALO_REFRESCO_MS = 60 * 1000;

const ETIQUETA_TIPO: Record<string, string> = {
  IP_ATA: 'Ata',
  IP_NATIVO: 'Ip',
};

const ETIQUETA_ESTADO: Record<EstadoDispositivoMonitoreo, string> = {
  ONLINE: 'Online',
  OFFLINE: 'Offline',
  DESCONOCIDO: 'Desconocido',
  EN_MANTENIMIENTO: 'Mantenimiento',
};

const CLASE_ESTADO: Record<EstadoDispositivoMonitoreo, string> = {
  ONLINE: 'stOnline',
  OFFLINE: 'stOffline',
  DESCONOCIDO: 'stDesc',
  EN_MANTENIMIENTO: 'stAttn',
};

const PRIORIDAD_ESTADO: Record<EstadoDispositivoMonitoreo, number> = {
  OFFLINE: 0,
  DESCONOCIDO: 1,
  EN_MANTENIMIENTO: 2,
  ONLINE: 3,
};

interface Props {
  dispositivos: DispositivoConEstado[];
  cargando: boolean;
}

function TablaMonitoreo({ dispositivos, cargando }: Props) {
  // Fuerza un re-render cada minuto para que las duraciones de "Última conexión" sigan avanzando.
  const [, refrescar] = useState(0);
  useEffect(() => {
    const intervalo = setInterval(() => refrescar((n) => n + 1), INTERVALO_REFRESCO_MS);
    return () => clearInterval(intervalo);
  }, []);

  const ordenados = [...dispositivos].sort((a, b) => {
    const diff = PRIORIDAD_ESTADO[a.estado] - PRIORIDAD_ESTADO[b.estado];
    if (diff !== 0) return diff;
    return a.extension.localeCompare(b.extension, undefined, { numeric: true });
  });

  return (
    <div className={estilos.tcard}>
      <table>
        <thead>
          <tr>
            <th>Extensión</th>
            <th>Ubicación</th>
            <th className={estilos.colSec}>Tipo</th>
            <th className={estilos.colSec}>MAC</th>
            <th className={estilos.colSec}>IP</th>
            <th>Estado</th>
            <th>Última conexión</th>
          </tr>
        </thead>
        <tbody>
          {cargando ? (
            <tr>
              <td colSpan={7}>
                <div className={estilos.empty}>Cargando…</div>
              </td>
            </tr>
          ) : ordenados.length === 0 ? (
            <tr>
              <td colSpan={7}>
                <div className={estilos.empty}>
                  <b>Sin dispositivos</b>
                  Ajusta la búsqueda o los filtros.
                </div>
              </td>
            </tr>
          ) : (
            ordenados.map((d) => (
              <tr key={d.id_telefono}>
                <td>
                  <span className={estilos.cardLabel}>Extensión</span>
                  <span className="mono">{d.extension}</span>
                </td>
                <td>
                  <span className={estilos.cardLabel}>Ubicación</span>
                  {d.ubicacion_nombre}
                </td>
                <td className={estilos.colSec}>
                  <span className={estilos.cardLabel}>Tipo</span>
                  {ETIQUETA_TIPO[d.tipo] ?? d.tipo}
                </td>
                <td className={estilos.colSec}>
                  <span className={estilos.cardLabel}>MAC</span>
                  {d.mac ? <span className="mono">{d.mac}</span> : <span className={estilos.muted}>—</span>}
                </td>
                <td className={estilos.colSec}>
                  <span className={estilos.cardLabel}>IP</span>
                  <span className="mono">{d.ip}</span>
                </td>
                <td>
                  <span className={estilos.cardLabel}>Estado</span>
                  <span className={`${estilos.stpill} ${estilos[CLASE_ESTADO[d.estado]]}`}>
                    <span className={estilos.dot} />
                    {ETIQUETA_ESTADO[d.estado]}
                  </span>
                </td>
                <td title={formatoAbsoluto(d.fecha_ultima_conexion)}>
                  <span className={estilos.cardLabel}>Última conexión</span>
                  {formatoRelativo(d.fecha_ultima_conexion)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default TablaMonitoreo;
