import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import type { TopDispositivo } from '../../types/estadistica';
import { COLOR_TOP } from './coloresGraficas';

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
      <BarChart layout="vertical" data={datos} margin={{ top: 5, right: 10, bottom: 20, left: 10 }}>
        <XAxis
          type="number"
          allowDecimals={false}
          label={{ value: 'Caidas', position: 'insideBottom', offset: -5 }}
        />
        <YAxis
          type="category"
          dataKey="extension"
          width={100}
          label={{ value: 'Extension', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip content={<TooltipPersonalizado />} />
        <Bar dataKey="caidas" fill={COLOR_TOP} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default GraficaTopDispositivos;
