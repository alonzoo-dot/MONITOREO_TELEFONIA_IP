import { useEffect, useRef } from 'react';
import type { ConfirmacionPendiente } from '../types/confirmacion';
import { aceptarConfirmacion, cancelarConfirmacion } from '../store/confirmaciones';
import estilos from './ModalConfirmacionGlobal.module.css';

interface Props {
  confirmacion: ConfirmacionPendiente;
}

/** Modal de confirmacion generico montado por ContenedorConfirmacion */
function ModalConfirmacionGlobal({ confirmacion }: Props) {
  const botonAceptarRef = useRef<HTMLButtonElement>(null);
  const variante = confirmacion.variante ?? 'neutra';

  useEffect(() => {
    botonAceptarRef.current?.focus();
  }, [confirmacion.id]);

  useEffect(() => {
    function alTeclear(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelarConfirmacion();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        aceptarConfirmacion();
      }
    }
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, []);

  return (
    <div className={estilos.scrim} onClick={cancelarConfirmacion}>
      <div
        className={estilos.modal}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmacion-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirmacion-titulo">{confirmacion.titulo}</h2>
        <p>{confirmacion.mensaje}</p>
        <div className={estilos.acciones}>
          <button className={estilos.btnSec} onClick={cancelarConfirmacion}>
            {confirmacion.textoCancelar ?? 'Cancelar'}
          </button>
          <button
            ref={botonAceptarRef}
            className={variante === 'peligro' ? estilos.btnPeligro : estilos.btnPri}
            onClick={aceptarConfirmacion}
          >
            {confirmacion.textoAceptar ?? 'Aceptar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalConfirmacionGlobal;
