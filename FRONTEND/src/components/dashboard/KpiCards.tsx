import type { DispositivoConEstado } from '../../types/monitoreo';
import estilos from './KpiCards.module.css';

interface Props {
  dispositivos: DispositivoConEstado[];
}

function KpiCards({ dispositivos }: Props) {
  const total = dispositivos.length;
  const online = dispositivos.filter((d) => d.estado === 'ONLINE').length;
  const mantenimiento = dispositivos.filter((d) => d.estado === 'EN_MANTENIMIENTO').length;
  const offline = dispositivos.filter((d) => d.estado === 'OFFLINE').length;

  return (
    <div className={estilos.grid}>
      <div className={estilos.tarjeta}>
        <div className={estilos.num}>{total}</div>
        <div className={estilos.lbl}>Total</div>
      </div>
      <div className={`${estilos.tarjeta} ${estilos.online}`}>
        <div className={estilos.num}>{online}</div>
        <div className={estilos.lbl}>Online</div>
      </div>
      <div className={`${estilos.tarjeta} ${estilos.mantenimiento}`}>
        <div className={estilos.num}>{mantenimiento}</div>
        <div className={estilos.lbl}>Mantenimiento</div>
      </div>
      <div className={`${estilos.tarjeta} ${estilos.offline}`}>
        <div className={estilos.num}>{offline}</div>
        <div className={estilos.lbl}>Offline</div>
      </div>
    </div>
  );
}

export default KpiCards;
