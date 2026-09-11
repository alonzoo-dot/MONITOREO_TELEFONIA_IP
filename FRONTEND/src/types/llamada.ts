// Accion de llamada que admite un dispositivo, calculada por el backend segun su tipo/conexion.
export type AccionLlamada = 'MARCAR' | 'HACER_TIMBRAR' | 'NO_DISPONIBLE';

// Dispositivo tal como lo devuelve GET /api/llamadas/dispositivos
// (ver DispositivoParaPanel en BACKEND/src/services/llamadas.service.ts).
export interface DispositivoLlamable {
  id_telefono: number;
  extension: string;
  tipo: string;
  accion: AccionLlamada;
  motivo?: string;
}

// Resultado de un intento de marcado/timbrado. exito:false no es un error HTTP.
export interface ResultadoLlamada {
  exito: boolean;
  detalle: string;
}
