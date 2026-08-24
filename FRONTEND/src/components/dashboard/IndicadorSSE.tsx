import type { EstadoConexionSSE } from '../../types/monitoreo';
import estilos from './IndicadorSSE.module.css';

const TEXTO: Record<EstadoConexionSSE, string> = {
  conectando: 'Conectando…',
  conectado: 'En vivo',
  reconectando: 'Reconectando…',
  expirado: 'Sesión expirada',
};

const CLASE: Record<EstadoConexionSSE, string> = {
  conectando: 'gris',
  conectado: 'verde',
  reconectando: 'ambar',
  expirado: 'rojo',
};

// Un período (0-40) del trazo tipo electrocardiograma, duplicado (40-80) para que el
// desplazamiento de una animación de -40 unidades luzca continuo (loop sin salto visible).
const TRAZO_ECG =
  'M 0 10 L 20 10 L 25 3 L 30 17 L 35 5 L 40 10 L 60 10 L 65 3 L 70 17 L 75 5 L 80 10';

interface Props {
  estado: EstadoConexionSSE;
}

function IndicadorSSE({ estado }: Props) {
  return (
    <span className={`${estilos.pill} ${estilos[CLASE[estado]]}`}>
      {estado === 'conectado' ? (
        <svg
          viewBox="0 0 80 20"
          width="52"
          height="16"
          preserveAspectRatio="none"
          className={estilos.ondaEcg}
          aria-hidden="true"
        >
          <path
            className={estilos.ondaEcgTrazo}
            d={TRAZO_ECG}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <span className={estilos.dot} />
      )}
      {TEXTO[estado]}
    </span>
  );
}

export default IndicadorSSE;
