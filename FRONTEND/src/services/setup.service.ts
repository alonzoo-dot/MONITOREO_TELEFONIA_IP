import { peticionApi } from './api';

/** Respuesta del backend al consultar si el sistema necesita configuracion inicial. */
export interface EstadoSetup {
  requiere_configuracion: boolean;
}

/** Datos para crear el primer administrador del sistema. */
export interface DatosPrimerAdministrador {
  usuario: string;
  nombre_completo: string;
  password: string;
}

/** Respuesta del backend al crear el primer administrador. */
export interface ResultadoSetup {
  id_usuario: number;
  usuario: string;
  mensaje: string;
}

/** Consulta si el sistema todavia no tiene usuarios y requiere configuracion inicial. */
export function consultarEstadoSetup(): Promise<EstadoSetup> {
  return peticionApi<EstadoSetup>('/setup/estado');
}

/** Crea el primer administrador del sistema. Solo funciona si no existe ningun usuario. */
export function crearPrimerAdministrador(
  datos: DatosPrimerAdministrador,
): Promise<ResultadoSetup> {
  return peticionApi<ResultadoSetup>('/setup', {
    metodo: 'POST',
    cuerpo: datos,
  });
}
