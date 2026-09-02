import { useConfirmacion } from '../hooks/useConfirmacion';
import ModalConfirmacionGlobal from './ModalConfirmacionGlobal';

/** Renderiza el modal de confirmacion global solo cuando hay una pendiente */
function ContenedorConfirmacion() {
  const confirmacion = useConfirmacion();
  if (!confirmacion) return null;

  return <ModalConfirmacionGlobal confirmacion={confirmacion} />;
}

export default ContenedorConfirmacion;
