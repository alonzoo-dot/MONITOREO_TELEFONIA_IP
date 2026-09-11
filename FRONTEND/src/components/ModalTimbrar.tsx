import { useState } from 'react';
import { hacerTimbrar } from '../services/llamadas.service';
import { ErrorApi } from '../services/api';
import { mostrarToast } from '../store/toasts';
import estilos from './ModalAtender.module.css';

interface Props {
  extensionOrigen: string;
  alCerrar: () => void;
}

function ModalTimbrar({ extensionOrigen: extensionOrigenInicial, alCerrar }: Props) {
  const [extensionOrigen, setExtensionOrigen] = useState(extensionOrigenInicial);
  const [usuarioSip, setUsuarioSip] = useState('admin');
  const [passwordSip, setPasswordSip] = useState(extensionOrigenInicial);
  const [passwordEditadaManual, setPasswordEditadaManual] = useState(false);
  const [extensionDestino, setExtensionDestino] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  function cambiarExtensionOrigen(valor: string) {
    setExtensionOrigen(valor);
    if (!passwordEditadaManual) {
      setPasswordSip(valor);
    }
  }

  function cambiarPasswordSip(valor: string) {
    setPasswordSip(valor);
    setPasswordEditadaManual(true);
  }

  async function confirmar() {
    if (
      extensionOrigen.trim() === '' ||
      usuarioSip.trim() === '' ||
      passwordSip.trim() === '' ||
      extensionDestino.trim() === ''
    ) {
      setAviso('Debes completar todos los campos.');
      return;
    }

    setProcesando(true);
    setAviso(null);
    try {
      const resultado = await hacerTimbrar(
        extensionOrigen.trim(),
        usuarioSip.trim(),
        passwordSip,
        extensionDestino.trim(),
      );
      if (resultado.exito) {
        mostrarToast({ tipo: 'exito', titulo: 'Llamada iniciada', mensaje: resultado.detalle });
        alCerrar();
      } else {
        setAviso(resultado.detalle);
      }
    } catch (error: unknown) {
      setAviso(error instanceof ErrorApi ? error.message : 'No se pudo hacer timbrar. Intenta de nuevo.');
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className={estilos.scrim} onClick={alCerrar}>
      <div className={estilos.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={estilos.cabecera}>
          <h2>Hacer timbrar</h2>
          <button className={estilos.cerrar} onClick={alCerrar} aria-label="Cerrar">&times;</button>
        </div>

        <label className={estilos.etiqueta} htmlFor="extensionOrigen">Extension de origen</label>
        <input
          id="extensionOrigen"
          className={estilos.textarea}
          value={extensionOrigen}
          onChange={(e) => cambiarExtensionOrigen(e.target.value)}
          disabled={procesando}
        />

        <label className={estilos.etiqueta} htmlFor="usuarioSip">Usuario SIP</label>
        <input
          id="usuarioSip"
          className={estilos.textarea}
          value={usuarioSip}
          onChange={(e) => setUsuarioSip(e.target.value)}
          disabled={procesando}
        />

        <label className={estilos.etiqueta} htmlFor="passwordSip">Contrasena SIP</label>
        <input
          id="passwordSip"
          type="password"
          className={estilos.textarea}
          value={passwordSip}
          onChange={(e) => cambiarPasswordSip(e.target.value)}
          disabled={procesando}
        />

        <label className={estilos.etiqueta} htmlFor="extensionDestino">Extension a timbrar</label>
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
            {procesando ? 'Timbrando...' : 'Hacer timbrar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalTimbrar;
