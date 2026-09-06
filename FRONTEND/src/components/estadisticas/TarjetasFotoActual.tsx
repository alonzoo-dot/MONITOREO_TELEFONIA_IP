import type { CSSProperties } from 'react';
import type { RespuestaFotoActual } from '../../types/estadistica';

interface Props {
  foto: RespuestaFotoActual;
}

const ESTILO_TARJETA: CSSProperties = {
  flex: '1 1 140px',
  padding: '14px 16px',
  borderRadius: 'var(--radius)',
  textAlign: 'center',
  border: '1px solid var(--line)',
};

const ESTILO_NUMERO: CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  lineHeight: 1,
};

const ESTILO_ETIQUETA: CSSProperties = {
  marginTop: 6,
  fontSize: 12.5,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
};

function TarjetasFotoActual({ foto }: Props) {
  const tarjetas = [
    { etiqueta: 'Total', valor: foto.total, color: 'var(--ink)', fondo: 'var(--card-2)' },
    { etiqueta: 'Online', valor: foto.online, color: 'var(--online)', fondo: 'var(--online-bg)' },
    { etiqueta: 'Offline', valor: foto.offline, color: 'var(--offline)', fondo: 'var(--offline-bg)' },
    { etiqueta: 'Mantenimiento', valor: foto.mantenimiento, color: 'var(--attn)', fondo: 'var(--attn-bg)' },
    { etiqueta: 'Desconocido', valor: foto.desconocido, color: 'var(--desc)', fondo: 'var(--desc-bg)' },
  ];

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {tarjetas.map((tarjeta) => (
        <div
          key={tarjeta.etiqueta}
          style={{ ...ESTILO_TARJETA, backgroundColor: tarjeta.fondo }}
        >
          <div style={{ ...ESTILO_NUMERO, color: tarjeta.color }}>{tarjeta.valor}</div>
          <div style={{ ...ESTILO_ETIQUETA, color: tarjeta.color }}>{tarjeta.etiqueta}</div>
        </div>
      ))}
    </div>
  );
}

export default TarjetasFotoActual;
