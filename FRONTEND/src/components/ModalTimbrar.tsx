import { useState } from 'react';
import { hacerTimbrar, colgarTimbrado } from '../services/llamadas.service';
import { ErrorApi } from '../services/api';
import { mostrarToast } from '../store/toasts';
import estilos from './ModalLlamada.module.css';

interface Props {
  extensionOrigen: string;
  alCerrar: () => void;
}

function ModalTimbrar({ extensionOrigen: extensionOrigenInicial, alCerrar }: Props) {
  const [extensionOrigen, setExtensionOrigen] = useState(extensionOrigenInicial);
  const [usuarioSip, setUsuarioSip] = useState('');
  const [passwordSip, setPasswordSip] = useState('');
  const [extensionDestino, setExtensionDestino] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [idSesion, setIdSesion] = useState<string | null>(null);

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
      if (resultado.exito && resultado.idSesion) {
        setIdSesion(resultado.idSesion);
      } else if (resultado.exito) {
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

  async function colgar() {
    if (!idSesion) {
      return;
    }
    setProcesando(true);
    try {
      const resultado = await colgarTimbrado(idSesion);
      mostrarToast({
        tipo: resultado.exito ? 'exito' : 'error',
        titulo: resultado.exito ? 'Llamada colgada' : 'No se pudo colgar',
        mensaje: resultado.detalle,
      });
    } catch (error: unknown) {
      mostrarToast({
        tipo: 'error',
        titulo: 'No se pudo colgar',
        mensaje: error instanceof ErrorApi ? error.message : 'Ocurrio un error al colgar la llamada.',
      });
    } finally {
      setProcesando(false);
      alCerrar();
    }
  }

  // Si el telefono quedo sonando (hay idSesion), colgar antes de cerrar para
  // no dejar la sesion SIP viva. Se usa tanto en "Cancelar" como al hacer
  // click afuera del modal o en el boton de cerrar.
  async function cerrarModal() {
    if (procesando) {
      return;
    }
    if (idSesion) {
      setProcesando(true);
      try {
        await colgarTimbrado(idSesion);
      } catch {
        // Aunque falle el colgado, no bloqueamos el cierre del modal.
      } finally {
        setProcesando(false);
      }
    }
    alCerrar();
  }

  return (
    <div className={estilos.scrim} onClick={cerrarModal}>
      <div className={estilos.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={estilos.cabecera}>
          <div className={estilos.tituloFila}>
            <span className={estilos.iconoWrap}>
              <svg className={estilos.icono} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9z" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </span>
            <h2>{idSesion ? 'Llamada en curso' : 'Hacer timbrar'}</h2>
          </div>
          <button className={estilos.cerrar} onClick={cerrarModal} aria-label="Cerrar" disabled={procesando}>&times;</button>
        </div>

        {idSesion ? (
          <div className={estilos.timbrando}>
            <span className={estilos.timbrandoIcono}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9z" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </span>
            <p className={estilos.timbrandoTexto}>Timbrando a la extension {extensionDestino}...</p>
          </div>
        ) : (
          <>
            <label className={estilos.etiqueta} htmlFor="extensionOrigen">Extension de origen</label>
            <input
              id="extensionOrigen"
              className={estilos.textarea}
              value={extensionOrigen}
              onChange={(e) => setExtensionOrigen(e.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              maxLength={10}
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
              type="text"
              className={estilos.textarea}
              value={passwordSip}
              onChange={(e) => setPasswordSip(e.target.value)}
              disabled={procesando}
            />

            <label className={estilos.etiqueta} htmlFor="extensionDestino">Extension a timbrar</label>
            <input
              id="extensionDestino"
              className={estilos.textarea}
              value={extensionDestino}
              onChange={(e) => setExtensionDestino(e.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              maxLength={10}
              disabled={procesando}
            />
          </>
        )}

        {aviso && <div className={estilos.aviso}>{aviso}</div>}

        <div className={estilos.acciones}>
          <button className={estilos.btnCancelar} onClick={cerrarModal} disabled={procesando}>
            Cancelar
          </button>
          {idSesion ? (
            <button className={estilos.btnColgar} onClick={colgar} disabled={procesando}>
              {procesando ? 'Colgando...' : 'Colgar'}
            </button>
          ) : (
            <button className={estilos.btnGuardar} onClick={confirmar} disabled={procesando}>
              {procesando ? 'Timbrando...' : 'Hacer timbrar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModalTimbrar;
