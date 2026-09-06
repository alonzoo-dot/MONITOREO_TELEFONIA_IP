import type { TiempoAtencion } from '../../types/estadistica';
import estilos from './TarjetaTiempoAtencion.module.css';

interface Props {
  tiempo: TiempoAtencion;
}

function TarjetaTiempoAtencion({ tiempo }: Props) {
  const datos = [
    { etiqueta: 'Atendidas', valor: String(tiempo.atendidas) },
    { etiqueta: 'Promedio (min)', valor: tiempo.promedioMinutos != null ? String(tiempo.promedioMinutos) : '-' },
    { etiqueta: 'Mediana (min)', valor: tiempo.medianaMinutos != null ? String(tiempo.medianaMinutos) : '-' },
  ];

  return (
    <div className={estilos.contenedor}>
      {datos.map((dato) => (
        <div key={dato.etiqueta} className={estilos.dato}>
          <div className={estilos.numero}>{dato.valor}</div>
          <div className={estilos.etiqueta}>{dato.etiqueta}</div>
        </div>
      ))}
    </div>
  );
}

export default TarjetaTiempoAtencion;
