import { useState } from 'react';
import { marcar } from '../services/llamadas.service';
import { ErrorApi } from '../services/api';
import { mostrarToast } from '../store/toasts';
import estilos from './ModalAtender.module.css';

interface Props {
  extensionOrigen: string;
  idOrigen: number;
  alCerrar: () => void;
}

function ModalMarcar({ extensionOrigen, idOrigen, alCerrar }: Props) {
  const [extensionDestino, setExtensionDestino] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  async function confirmar() {
    if (extensionDestino.trim() === '') {
      setAviso('Debes indicar una extension de destino.');
      return;
    }

    setProcesando(true);
    setAviso(null);
    try {
      const resultado = await marcar(idOrigen, extensionDestino.trim());
      if (resultado.exito) {
        mostrarToast({ tipo: 'exito', titulo: 'Llamada iniciada', mensaje: resultado.detalle });
        alCerrar();
      } else {
        setAviso(resultado.detalle);
      }
    } catch (error: unknown) {
      setAviso(error instanceof ErrorApi ? error.message : 'No se pudo marcar. Intenta de nuevo.');
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className={estilos.scrim} onClick={alCerrar}>
      <div className={estilos.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={estilos.cabecera}>
          <h2>Marcar</h2>
          <span className={estilos.sub}>Desde extension {extensionOrigen}</span>
          <button className={estilos.cerrar} onClick={alCerrar} aria-label="Cerrar">&times;</button>
        </div>

        <label className={estilos.etiqueta} htmlFor="extensionDestino">Extension a marcar</label>
        <input
          id="extensionDestino"
          className={estilos.textarea}
          value={extensionDestino}
          onChange={(e) => setExtensionDestino(e.target.value)}
          maxLength={10}
          disabled={procesando}
        />

        {aviso && <div className={estilos.aviso}>{aviso}</div>}

        <div className={estilos.acciones}>
          <button className={estilos.btnCancelar} onClick={alCerrar} disabled={procesando}>
            Cancelar
          </button>
          <button className={estilos.btnGuardar} onClick={confirmar} disabled={procesando}>
            {procesando ? 'Marcando...' : 'Marcar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalMarcar;
