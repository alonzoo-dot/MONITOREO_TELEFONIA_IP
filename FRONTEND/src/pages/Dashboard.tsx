import Layout from '../components/Layout';
import { obtenerUsuario } from '../services/sesion';
import estilos from './Dashboard.module.css';

/** Pantalla de inicio (placeholder). Su contenido real llegará con el módulo de monitoreo. */
function Dashboard() {
  const usuario = obtenerUsuario();

  return (
    <Layout>
      <h1 className={estilos.titulo}>Hola, {usuario?.nombre_completo ?? 'bienvenido'}</h1>
      <p className={estilos.lead}>
        Panel del sistema de monitoreo de telefonía IP. Selecciona una sección en el menú.
      </p>

      <div className={estilos.tarjetas}>
        <div className={estilos.tarjeta}>
          <div className={estilos.tarjetaTitulo}>Inventario</div>
          <div className={estilos.tarjetaTexto}>Gestión de dispositivos, ubicaciones y catálogos.</div>
        </div>
        <div className={`${estilos.tarjeta} ${estilos.tarjetaInactiva}`}>
          <div className={estilos.tarjetaTitulo}>Monitoreo</div>
          <div className={estilos.tarjetaTexto}>Próximamente.</div>
        </div>
        <div className={`${estilos.tarjeta} ${estilos.tarjetaInactiva}`}>
          <div className={estilos.tarjetaTitulo}>Incidencias</div>
          <div className={estilos.tarjetaTexto}>Próximamente.</div>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;
