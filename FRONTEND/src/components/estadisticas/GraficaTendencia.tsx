import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { PuntoTendencia } from '../../types/estadistica';

interface Props {
  puntos: PuntoTendencia[];
}

function GraficaTendencia({ puntos }: Props) {
  if (puntos.length === 0) {
    return <p>Sin datos en el periodo</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={puntos}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="periodo" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Line type="monotone" dataKey="caidas" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default GraficaTendencia;
