import { useState } from 'react';
import { marcar } from '../services/llamadas.service';
import { ErrorApi } from '../services/api';
import { mostrarToast } from '../store/toasts';
import estilos from './ModalLlamada.module.css';

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
          <div className={estilos.tituloFila}>
            <span className={estilos.iconoWrap}>
              <svg className={estilos.icono} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </span>
            <h2>Marcar</h2>
          </div>
          <span className={estilos.sub}>Desde extension {extensionOrigen}</span>
          <button className={estilos.cerrar} onClick={alCerrar} aria-label="Cerrar">&times;</button>
        </div>

        <label className={estilos.etiqueta} htmlFor="extensionDestino">Extension a marcar</label>
        <input
          id="extensionDestino"
          className={estilos.textarea}
          value={extensionDestino}
          onChange={(e) => setExtensionDestino(e.target.value.replace(/\D/g, ''))}
          inputMode="numeric"
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
