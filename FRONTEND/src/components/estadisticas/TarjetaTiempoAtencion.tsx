import type { TiempoAtencion } from '../../types/estadistica';

interface Props {
  tiempo: TiempoAtencion;
}

function TarjetaTiempoAtencion({ tiempo }: Props) {
  return (
    <div style={{ display: 'flex', gap: 24 }}>
      <div>
        <div>Atendidas</div>
        <div>{tiempo.atendidas}</div>
      </div>
      <div>
        <div>Promedio (min)</div>
        <div>{tiempo.promedioMinutos ?? '-'}</div>
      </div>
      <div>
        <div>Mediana (min)</div>
        <div>{tiempo.medianaMinutos ?? '-'}</div>
      </div>
    </div>
  );
}

export default TarjetaTiempoAtencion;
