import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import type { ConteoModelo } from '../../types/estadistica';
import { PALETA_DONA } from './coloresGraficas';

interface Props {
  datos: ConteoModelo[];
}

function GraficaDistribucionModelo({ datos }: Props) {
  if (datos.length === 0) {
    return <p>Sin datos en el periodo</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={datos} dataKey="caidas" nameKey="modelo" innerRadius={60} outerRadius={100}>
          {datos.map((entrada, indice) => (
            <Cell key={entrada.modelo} fill={PALETA_DONA[indice % PALETA_DONA.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default GraficaDistribucionModelo;
