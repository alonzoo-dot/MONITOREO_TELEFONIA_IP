import { useState } from 'react';
import { eliminarPermanentemente } from '../services/inventario.service';
import { mostrarToast } from '../store/toasts';
import estilos from './ModalEliminacionPermanente.module.css';

interface Props {
  abierto: boolean;
  idTelefono: number;
  extension: string;
  ubicacionLabel: string;
  totalIncidencias: number;
  totalMantenimiento: number;
  onCancelar: () => void;
  onEliminado: () => void;
}

/** Modal de doble confirmación para la eliminación permanente de un dispositivo. */
function ModalEliminacionPermanente({
  abierto,
  idTelefono,
  extension,
  ubicacionLabel,
  totalIncidencias,
  totalMantenimiento,
  onCancelar,
  onEliminado,
}: Props) {
  const [confirmacion, setConfirmacion] = useState('');
  const [eliminando, setEliminando] = useState(false);

  if (!abierto) return null;

  const habilitado = confirmacion.trim() === extension && !eliminando;

  async function confirmar() {
    if (!habilitado) return;
    setEliminando(true);
    try {
      await eliminarPermanentemente(idTelefono);
      mostrarToast({
        tipo: 'exito',
        titulo: 'Dispositivo eliminado',
        mensaje: `Dispositivo ${extension} eliminado permanentemente`,
      });
      setConfirmacion('');
      onEliminado();
    } catch (err) {
      mostrarToast({
        tipo: 'error',
        titulo: 'No se pudo eliminar',
        mensaje: err instanceof Error ? err.message : 'Error al eliminar el dispositivo',
      });
    } finally {
      setEliminando(false);
    }
  }

  function cancelar() {
    if (eliminando) return;
    setConfirmacion('');
    onCancelar();
  }

  return (
    <div className={estilos.scrim} onClick={cancelar}>
      <div
        className={estilos.modal}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Eliminar permanentemente</h2>

        <p>
          Esta acción borrará el dispositivo <b>{extension}</b> ({ubicacionLabel}) y todo su
          historial:
        </p>
        <ul className={estilos.lista}>
          <li>
            <b>{totalIncidencias}</b> incidencias registradas.
          </li>
          <li>
            <b>{totalMantenimiento}</b> registros de mantenimiento.
          </li>
        </ul>
        <p className={estilos.aviso}>Esta acción no se puede deshacer.</p>

        <div className={estilos.field}>
          <label>Para confirmar, escribe la extensión del dispositivo:</label>
          <input
            className="mono"
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
            disabled={eliminando}
            autoFocus
          />
        </div>

        <div className={estilos.acciones}>
          <button className={estilos.btnSec} onClick={cancelar} disabled={eliminando}>
            Cancelar
          </button>
          <button
            className={estilos.btnPeligro}
            onClick={confirmar}
            disabled={!habilitado}
          >
            {eliminando ? 'Eliminando…' : 'Eliminar permanentemente'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalEliminacionPermanente;
