import type { CSSProperties } from 'react';
import type { RespuestaFotoActual } from '../../types/estadistica';

interface Props {
  foto: RespuestaFotoActual;
}

const ESTILO_TARJETA: CSSProperties = {
  padding: 16,
  borderRadius: 8,
  textAlign: 'center',
};

const ESTILO_NUMERO: CSSProperties = {
  fontSize: 32,
  fontWeight: 'bold',
};

function TarjetasFotoActual({ foto }: Props) {
  const tarjetas = [
    { etiqueta: 'Total', valor: foto.total, color: '#6b7280' },
    { etiqueta: 'Online', valor: foto.online, color: '#16a34a' },
    { etiqueta: 'Offline', valor: foto.offline, color: '#dc2626' },
    { etiqueta: 'Mantenimiento', valor: foto.mantenimiento, color: '#f59e0b' },
    { etiqueta: 'Desconocido', valor: foto.desconocido, color: '#9ca3af' },
  ];

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {tarjetas.map((tarjeta) => (
        <div
          key={tarjeta.etiqueta}
          style={{ ...ESTILO_TARJETA, backgroundColor: tarjeta.color, color: '#fff' }}
        >
          <div style={ESTILO_NUMERO}>{tarjeta.valor}</div>
          <div>{tarjeta.etiqueta}</div>
        </div>
      ))}
    </div>
  );
}

export default TarjetasFotoActual;
