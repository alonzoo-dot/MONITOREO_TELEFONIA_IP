import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import type { TopDispositivo } from '../../types/estadistica';

interface Props {
  datos: TopDispositivo[];
}

interface PropsTooltip {
  active?: boolean;
  payload?: { payload: TopDispositivo }[];
}

function TooltipPersonalizado({ active, payload }: PropsTooltip) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  const fila = payload[0].payload;
  return (
    <div style={{ background: '#fff', border: '1px solid #ccc', padding: 8 }}>
      <p>Extension: {fila.extension}</p>
      <p>Ubicacion: {fila.ubicacion}</p>
      <p>Tipo de ubicacion: {fila.tipoUbicacion}</p>
      <p>Caidas: {fila.caidas}</p>
    </div>
  );
}

function GraficaTopDispositivos({ datos }: Props) {
  if (datos.length === 0) {
    return <p>Sin datos en el periodo</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart layout="vertical" data={datos}>
        <XAxis type="number" allowDecimals={false} />
        <YAxis type="category" dataKey="extension" width={100} />
        <Tooltip content={<TooltipPersonalizado />} />
        <Bar dataKey="caidas" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default GraficaTopDispositivos;
