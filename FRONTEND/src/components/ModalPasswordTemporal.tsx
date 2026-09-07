import { useState } from 'react';
import estilos from './ModalPasswordTemporal.module.css';

interface Props {
  abierto: boolean;
  usuario: string;
  passwordTemporal: string;
  titulo: string;
  onCerrar: () => void;
}

// Muestra una sola vez la contrasena temporal generada por el sistema.
function ModalPasswordTemporal({ abierto, usuario, passwordTemporal, titulo, onCerrar }: Props) {
  const [copiado, setCopiado] = useState(false);

  if (!abierto) {
    return null;
  }

  // Copia la contrasena al portapapeles y muestra confirmacion temporal.
  async function copiar() {
    try {
      await navigator.clipboard.writeText(passwordTemporal);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Si el portapapeles no esta disponible no hacemos nada mas.
    }
  }

  return (
    <div className={`${estilos.scrim} ${estilos.scrimVisible}`}>
      <div className={estilos.modal} role="dialog" aria-modal="true">
        <h2 className={estilos.titulo}>{titulo}</h2>

        <div className={estilos.okmsg}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="M22 4 12 14.01l-3-3" />
          </svg>
          Usuario <strong>{usuario}</strong> guardado correctamente
        </div>

        <p className={estilos.texto}>
          Comparte esta contraseña temporal con la persona. Deberá cambiarla al iniciar sesión.
        </p>

        <div className={estilos.tempbox}>
          <span className={estilos.tempval}>{passwordTemporal}</span>
          <button className={estilos.copiar} onClick={copiar}>
            {copiado ? 'Copiado' : 'Copiar'}
          </button>
        </div>

        <div className={estilos.warnbox}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <path d="M12 9v4M12 17h.01" />
          </svg>
          Por seguridad esta contraseña no se volverá a mostrar. Si se pierde, tendrás que
          restablecerla de nuevo desde la lista de usuarios.
        </div>

        <div className={estilos.foot}>
          <button className={estilos.btnPri} onClick={onCerrar}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalPasswordTemporal;
