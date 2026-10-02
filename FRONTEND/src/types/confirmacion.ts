export type VarianteConfirmacion = 'neutra' | 'peligro';

/** Opciones que el llamador provee al pedir una confirmacion */
export interface OpcionesConfirmacion {
  titulo: string;
  mensaje: string;
  textoAceptar?: string;
  textoCancelar?: string;
  variante?: VarianteConfirmacion;
}

/** Confirmacion pendiente que mantiene el store mientras espera la decision del usuario */
export interface ConfirmacionPendiente extends OpcionesConfirmacion {
  id: string;
}
