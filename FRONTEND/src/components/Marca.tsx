import estilos from './Marca.module.css';

/** Encabezado de marca: logo, nombre del sistema y subtítulo. Reutilizable. */
function Marca() {
  return (
    <div className={estilos.marca}>
      <div className={estilos.logo}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <path d="M8 6h8M8 10h8M8 14h4" />
        </svg>
      </div>
      <div className={estilos.texto}>
        <div className={estilos.nombre}>Monitoreo Telefonía IP</div>
        <div className={estilos.sub}>Hotel Dreams Aventuras</div>
      </div>
    </div>
  );
}

export default Marca;