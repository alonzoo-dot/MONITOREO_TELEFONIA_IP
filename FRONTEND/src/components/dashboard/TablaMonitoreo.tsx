import { useEffect, useState } from 'react';
import type { DispositivoConEstado, EstadoDispositivoMonitoreo } from '../../types/monitoreo';
import { formatoRelativo, formatoAbsoluto } from '../../utils/fechas';
import { activarMantenimiento, desactivarMantenimiento } from '../../services/monitoreo.service';
import { ErrorApi } from '../../services/api';
import { mostrarToast } from '../../store/toasts';
import ModalConfirmacion from '../ModalConfirmacion';
import ModalMarcar from '../ModalMarcar';
import ModalTimbrar from '../ModalTimbrar';
import estilos from './TablaMonitoreo.module.css';

const INTERVALO_REFRESCO_MS = 30 * 1000;

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

  // Dispositivo sobre el que se pidió poner/quitar mantenimiento; null = modal cerrado.
  const [objetivo, setObjetivo] = useState<DispositivoConEstado | null>(null);
  const [procesando, setProcesando] = useState(false);

  // Dispositivo sobre el que se pidio marcar/timbrar; null = modal de llamada cerrado.
  const [llamadaObjetivo, setLlamadaObjetivo] = useState<DispositivoConEstado | null>(null);

  async function confirmarMantenimiento() {
    if (!objetivo) return;
    setProcesando(true);
    try {
      if (objetivo.estado === 'EN_MANTENIMIENTO') {
        await desactivarMantenimiento(objetivo.id_telefono);
      } else {
        await activarMantenimiento(objetivo.id_telefono);
      }
      setObjetivo(null);
    } catch (err) {
      const mensaje =
        err instanceof ErrorApi ? err.message : 'No se pudo cambiar el estado de mantenimiento';
      mostrarToast({ tipo: 'error', titulo: 'No se pudo completar la acción', mensaje });
    } finally {
      setProcesando(false);
    }
  }

  const ordenados = [...dispositivos].sort((a, b) => {
    const diff = PRIORIDAD_ESTADO[a.estado] - PRIORIDAD_ESTADO[b.estado];
    if (diff !== 0) return diff;
    return a.extension.localeCompare(b.extension, undefined, { numeric: true });
  });

  return (
    <div className={estilos.tcard}>
      <div className={estilos.scrollTabla}>
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
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {cargando ? (
            <tr>
              <td colSpan={8}>
                <div className={estilos.empty}>Cargando…</div>
              </td>
            </tr>
          ) : ordenados.length === 0 ? (
            <tr>
              <td colSpan={8}>
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
                <td>
                  <span className={estilos.cardLabel}>Acciones</span>
                  <div className={estilos.acciones}>
                    <button
                      className={estilos.actionBtn}
                      onClick={() => setLlamadaObjetivo(d)}
                      disabled={d.accion !== 'MARCAR' && d.accion !== 'HACER_TIMBRAR'}
                      title={
                        d.accion === 'MARCAR' || d.accion === 'HACER_TIMBRAR'
                          ? 'Marcar'
                          : d.motivo ?? 'No disponible'
                      }
                      aria-label="Marcar"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </button>
                    {d.estado === 'EN_MANTENIMIENTO' ? (
                      <button
                        className={`${estilos.actionBtn} ${estilos.actionBtnAttn}`}
                        onClick={() => setObjetivo(d)}
                        title="Reactivar"
                        aria-label="Reactivar"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        className={`${estilos.actionBtn} ${estilos.actionBtnAttn}`}
                        onClick={() => setObjetivo(d)}
                        title="Mantenimiento"
                        aria-label="Mantenimiento"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>

      <ModalConfirmacion
        abierto={objetivo !== null}
        titulo={
          objetivo?.estado === 'EN_MANTENIMIENTO' ? '¿Reactivar dispositivo?' : '¿Poner en mantenimiento?'
        }
        cuerpo={
          objetivo?.estado === 'EN_MANTENIMIENTO'
            ? 'El dispositivo volverá a monitorearse en la siguiente ronda.'
            : 'El dispositivo dejará de monitorearse hasta que lo reactives. Podrás revertirlo desde el mismo lugar cuando quieras.'
        }
        textoConfirmar={objetivo?.estado === 'EN_MANTENIMIENTO' ? 'Reactivar' : 'Poner en mantenimiento'}
        cargando={procesando}
        onConfirmar={confirmarMantenimiento}
        onCancelar={() => setObjetivo(null)}
      />

      {llamadaObjetivo && llamadaObjetivo.accion === 'MARCAR' && (
        <ModalMarcar
          idOrigen={llamadaObjetivo.id_telefono}
          extensionOrigen={llamadaObjetivo.extension}
          alCerrar={() => setLlamadaObjetivo(null)}
        />
      )}
      {llamadaObjetivo && llamadaObjetivo.accion === 'HACER_TIMBRAR' && (
        <ModalTimbrar
          extensionOrigen={llamadaObjetivo.extension}
          alCerrar={() => setLlamadaObjetivo(null)}
        />
      )}
    </div>
  );
}

export default TablaMonitoreo;
