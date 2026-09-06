import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { PuntoTendencia } from '../../types/estadistica';
import { COLOR_TENDENCIA } from './coloresGraficas';

interface Props {
  puntos: PuntoTendencia[];
}

function GraficaTendencia({ puntos }: Props) {
  if (puntos.length === 0) {
    return <p>Sin datos en el periodo</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={puntos} margin={{ top: 5, right: 10, bottom: 20, left: 10 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="periodo"
          tick={{ fontSize: 11 }}
          label={{ value: 'Fecha', position: 'insideBottom', offset: -5 }}
        />
        <YAxis
          allowDecimals={false}
          label={{ value: 'Caidas', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip />
        <Bar dataKey="caidas" fill={COLOR_TENDENCIA} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default GraficaTendencia;
