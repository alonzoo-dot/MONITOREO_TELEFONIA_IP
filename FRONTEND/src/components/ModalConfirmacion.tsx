import estilos from './ModalConfirmacion.module.css';

interface Props {
  abierto: boolean;
  titulo: string;
  cuerpo: string;
  textoConfirmar: string;
  cargando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

/** Modal simple de confirmación: overlay + título + cuerpo + dos botones. */
function ModalConfirmacion({
  abierto,
  titulo,
  cuerpo,
  textoConfirmar,
  cargando = false,
  onConfirmar,
  onCancelar,
}: Props) {
  if (!abierto) return null;

  return (
    <div className={estilos.scrim} onClick={onCancelar}>
      <div className={estilos.modal} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h2>{titulo}</h2>
        <p>{cuerpo}</p>
        <div className={estilos.acciones}>
          <button className={estilos.btnSec} onClick={onCancelar} disabled={cargando}>
            Cancelar
          </button>
          <button className={estilos.btnPri} onClick={onConfirmar} disabled={cargando}>
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalConfirmacion;
