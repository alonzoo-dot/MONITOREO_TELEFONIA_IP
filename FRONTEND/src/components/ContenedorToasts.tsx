import { useToasts } from '../hooks/useToasts';
import Toast from './Toast';
import estilos from './ContenedorToasts.module.css';

/** Apila y muestra los toasts activos en la esquina superior derecha. */
function ContenedorToasts() {
  const toasts = useToasts();
  if (toasts.length === 0) return null;

  return (
    <div className={estilos.contenedor}>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

export default ContenedorToasts;
