import estilos from './FiltrosMonitoreo.module.css';

export type FiltroEstado = 'TODOS' | 'ONLINE' | 'OFFLINE' | 'DESCONOCIDO';

interface Props {
  busqueda: string;
  onBusquedaChange: (valor: string) => void;
  filtroEstado: FiltroEstado;
  onFiltroEstadoChange: (valor: FiltroEstado) => void;
}

function FiltrosMonitoreo({ busqueda, onBusquedaChange, filtroEstado, onFiltroEstadoChange }: Props) {
  return (
    <div className={estilos.controls}>
      <div className={estilos.search}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          placeholder="Buscar por extensión o ubicación…"
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
        />
      </div>
      <select
        value={filtroEstado}
        onChange={(e) => onFiltroEstadoChange(e.target.value as FiltroEstado)}
        aria-label="Estado"
      >
        <option value="TODOS">Todos</option>
        <option value="ONLINE">Online</option>
        <option value="OFFLINE">Offline</option>
        <option value="DESCONOCIDO">Desconocido</option>
      </select>
    </div>
  );
}

export default FiltrosMonitoreo;
