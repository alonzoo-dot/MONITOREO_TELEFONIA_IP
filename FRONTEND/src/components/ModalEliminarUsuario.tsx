import { useState } from 'react';
import { eliminarUsuarioPermanentemente } from '../services/usuarios.service';
import { ErrorApi } from '../services/api';
import { mostrarToast } from '../store/toasts';
import estilos from './ModalEliminarUsuario.module.css';

interface Props {
  abierto: boolean;
  idUsuario: number;
  nombreUsuario: string;
  onCancelar: () => void;
  onEliminado: () => void;
}

/** Modal de confirmación por texto para la eliminación permanente de un usuario. */
function ModalEliminarUsuario({
  abierto,
  idUsuario,
  nombreUsuario,
  onCancelar,
  onEliminado,
}: Props) {
  const [confirmacion, setConfirmacion] = useState('');
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState('');

  if (!abierto) return null;

  const habilitado = confirmacion === nombreUsuario && !eliminando;

  async function confirmar() {
    if (!habilitado) return;
    setEliminando(true);
    setError('');
    try {
      await eliminarUsuarioPermanentemente(idUsuario);
      mostrarToast({
        tipo: 'exito',
        titulo: 'Usuario eliminado',
        mensaje: `Usuario ${nombreUsuario} eliminado permanentemente`,
      });
      setConfirmacion('');
      onEliminado();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : 'No se pudo eliminar el usuario');
    } finally {
      setEliminando(false);
    }
  }

  function cancelar() {
    if (eliminando) return;
    setConfirmacion('');
    setError('');
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
        <h2>Eliminar usuario permanentemente</h2>

        <p>
          Esta acción es permanente y no se puede revertir. Se eliminará el usuario{' '}
          <b>{nombreUsuario}</b> del sistema. Las incidencias y mantenimientos que haya atendido
          conservarán su registro con el nombre del usuario marcado como "(eliminado)" para
          preservar la auditoría.
        </p>

        {error && <div className={estilos.error}>{error}</div>}

        <div className={estilos.field}>
          <label>Para confirmar, escribe el nombre de usuario:</label>
          <div className={estilos.valorEsperado}>{nombreUsuario}</div>
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
          <button className={estilos.btnPeligro} onClick={confirmar} disabled={!habilitado}>
            {eliminando ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalEliminarUsuario;
