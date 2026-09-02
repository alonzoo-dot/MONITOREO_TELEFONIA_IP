import { useState } from 'react';
import { atenderIncidencia } from '../services/incidencias.service';
import { ErrorApi } from '../services/api';
import type { Incidencia } from '../types/incidencia';
import estilos from './ModalAtender.module.css';

interface Props {
  incidencia: Incidencia;
  alCerrar: () => void;
  alAtender: (actualizada: Incidencia) => void;
}

// Formatea una fecha ISO a algo legible.
function formatearFecha(iso: string): string {
  const d = new Date(iso);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dia}/${mes}/${d.getFullYear()} ${hora}:${min}`;
}

function ModalAtender({ incidencia, alCerrar, alAtender }: Props) {
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  async function guardar() {
    setGuardando(true);
    setAviso(null);
    try {
      const actualizada = await atenderIncidencia(
        incidencia.id_incidencia,
        observaciones.trim() || undefined,
      );
      alAtender(actualizada);
    } catch (error: unknown) {
      if (error instanceof ErrorApi && error.codigo === 'INCIDENCIA_YA_ATENDIDA') {
        setAviso('Esta incidencia ya fue atendida por otra persona.');
      } else {
        setAviso('No se pudo atender la incidencia. Intenta de nuevo.');
      }
      setGuardando(false);
    }
  }

  return (
    <div className={estilos.scrim} onClick={alCerrar}>
      <div className={estilos.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={estilos.cabecera}>
          <h2>Atender incidencia</h2>
          <span className={estilos.sub}>
            Extension {incidencia.extension} · {incidencia.ubicacion_nombre}
          </span>
          <button className={estilos.cerrar} onClick={alCerrar} aria-label="Cerrar">&times;</button>
        </div>

        <dl className={estilos.datos}>
          <dt>Fecha de la caida</dt>
          <dd>{formatearFecha(incidencia.fecha_ocurrido)}</dd>
          <dt>MAC</dt>
          <dd className={estilos.mono}>{incidencia.mac ?? '-'}</dd>
          <dt>IP registrada</dt>
          <dd className={estilos.mono}>{incidencia.ip_registrada ?? '-'}</dd>
        </dl>

        <label className={estilos.etiqueta} htmlFor="obs">Observaciones</label>
        <textarea
          id="obs"
          className={estilos.textarea}
          placeholder="Que se hizo o a quien se escalo..."
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          maxLength={1000}
          disabled={guardando}
        />

        {aviso && <div className={estilos.aviso}>{aviso}</div>}

        <div className={estilos.acciones}>
          <button className={estilos.btnCancelar} onClick={alCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button className={estilos.btnGuardar} onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar y atender'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalAtender;
