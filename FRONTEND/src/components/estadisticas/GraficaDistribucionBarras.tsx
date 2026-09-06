import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const COLOR_POR_DEFECTO = '#94A3B8';

interface Props {
  datos: { etiqueta: string; caidas: number }[];
  nombreEje: string;
  color?: string;
}

function GraficaDistribucionBarras({ datos, nombreEje, color }: Props) {
  if (datos.length === 0) {
    return <p>Sin datos en el periodo</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={datos} margin={{ top: 5, right: 10, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="etiqueta"
          name={nombreEje}
          label={{ value: nombreEje, position: 'insideBottom', offset: -5 }}
        />
        <YAxis
          allowDecimals={false}
          label={{ value: 'Caidas', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip />
        <Bar dataKey="caidas" fill={color ?? COLOR_POR_DEFECTO} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default GraficaDistribucionBarras;
