import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface Props {
  datos: { etiqueta: string; caidas: number }[];
  nombreEje: string;
}

function GraficaDistribucionBarras({ datos, nombreEje }: Props) {
  if (datos.length === 0) {
    return <p>Sin datos en el periodo</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={datos}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="etiqueta" name={nombreEje} />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="caidas" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default GraficaDistribucionBarras;
