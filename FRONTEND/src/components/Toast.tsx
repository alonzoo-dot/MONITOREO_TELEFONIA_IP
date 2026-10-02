import { useEffect } from 'react';
import type { ToastItem } from '../types/toast';
import { cerrarToast } from '../store/toasts';
import estilos from './Toast.module.css';

const CLASE_TIPO: Record<ToastItem['tipo'], string> = {
  exito: 'exito',
  error: 'error',
  info: 'info',
};

interface Props {
  toast: ToastItem;
}

function Toast({ toast }: Props) {
  useEffect(() => {
    if (toast.autoCloseMs <= 0) return;
    const temporizador = setTimeout(() => cerrarToast(toast.id), toast.autoCloseMs);
    return () => clearTimeout(temporizador);
  }, [toast.id, toast.autoCloseMs]);

  return (
    <div
      className={`${estilos.toast} ${estilos[CLASE_TIPO[toast.tipo]]}`}
      role="alert"
      style={toast.onClick ? { cursor: 'pointer' } : undefined}
      onClick={toast.onClick}
    >
      <div className={estilos.cuerpo}>
        <b>{toast.titulo}</b>
        <span>{toast.mensaje}</span>
      </div>
      <button
        className={estilos.cerrar}
        onClick={(e) => {
          e.stopPropagation();
          cerrarToast(toast.id);
        }}
        aria-label="Cerrar"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default Toast;
