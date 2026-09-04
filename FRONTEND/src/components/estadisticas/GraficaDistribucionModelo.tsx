import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import type { ConteoModelo } from '../../types/estadistica';

interface Props {
  datos: ConteoModelo[];
}

const PALETA = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2', '#db2777'];

function GraficaDistribucionModelo({ datos }: Props) {
  if (datos.length === 0) {
    return <p>Sin datos en el periodo</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={datos} dataKey="caidas" nameKey="modelo" innerRadius={60} outerRadius={100}>
          {datos.map((entrada, indice) => (
            <Cell key={entrada.modelo} fill={PALETA[indice % PALETA.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default GraficaDistribucionModelo;
