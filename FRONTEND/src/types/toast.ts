export type TipoToast = 'exito' | 'error' | 'info';

export interface ToastItem {
  id: string;
  tipo: TipoToast;
  titulo: string;
  mensaje: string;
  autoCloseMs: number;
}

/** Datos que el llamador provee al pedir un nuevo toast; id se genera y autoCloseMs tiene valor por defecto. */
export interface DatosToast {
  tipo: TipoToast;
  titulo: string;
  mensaje: string;
  autoCloseMs?: number;
}
