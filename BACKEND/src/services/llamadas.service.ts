import * as llamadasRepo from '../repositories/llamadas.repository';
import type { DispositivoMarcable } from '../repositories/llamadas.repository';
import { SnomGateway } from '../gateways/snom.gateway';
import { SoftphoneGateway } from '../gateways/softphone.gateway';
import { ErrorLlamadas } from '../gateways/errores';
import type { ResultadoLlamada } from '../gateways/llamada.gateway';

/** Dispositivo tal como lo necesita el panel de llamadas del frontend. */
export interface DispositivoParaPanel {
  id_telefono: number;
  extension: string;
  tipo: string;
  accion: 'MARCAR' | 'HACER_TIMBRAR' | 'NO_DISPONIBLE';
  motivo?: string;
}

// Lista los dispositivos activos y calcula que accion de llamada admite cada uno.
export async function listarDispositivos(): Promise<DispositivoParaPanel[]> {
  const dispositivos = await llamadasRepo.listarDispositivosMarcables();
  return dispositivos.map(calcularAccion);
}

function calcularAccion(dispositivo: DispositivoMarcable): DispositivoParaPanel {
  const base = {
    id_telefono: dispositivo.id_telefono,
    extension: dispositivo.extension,
    tipo: dispositivo.tipo,
  };

  if (dispositivo.tipo === 'IP_NATIVO') {
    if (dispositivo.ip_efectiva) {
      return { ...base, accion: 'MARCAR' };
    }
    return { ...base, accion: 'NO_DISPONIBLE', motivo: 'Sin conexión' };
  }

  if (dispositivo.tipo === 'IP_ATA') {
    return { ...base, accion: 'HACER_TIMBRAR' };
  }

  // ANALOGICO y cualquier otro tipo sin telefonia IP: no hay forma de operarlo.
  return { ...base, accion: 'NO_DISPONIBLE', motivo: 'Sin IP' };
}

// Marca desde un telefono IP nativo hacia una extension destino, via SnomGateway.
// Si el resultado del gateway es exito:false, se devuelve tal cual (no es un error).
export async function marcar(
  idOrigen: number,
  extensionDestino: string,
): Promise<ResultadoLlamada> {
  const origen = await llamadasRepo.buscarDispositivoParaLlamada(idOrigen);
  if (origen === null) {
    throw new ErrorLlamadas('ORIGEN_NO_ENCONTRADO', 'El telefono de origen no existe o esta inactivo.');
  }
  if (origen.tipo !== 'IP_NATIVO') {
    throw new ErrorLlamadas('TIPO_NO_COMPATIBLE', 'Solo los telefonos IP nativos pueden marcar');
  }
  if (!origen.ip_efectiva) {
    throw new ErrorLlamadas('SIN_IP', 'El telefono no tiene conexión, no se puede marcar');
  }
  if (extensionDestino.trim() === '') {
    throw new ErrorLlamadas('EXTENSION_DESTINO_REQUERIDA', 'Debe indicar una extension de destino.');
  }

  const gateway = new SnomGateway();
  return gateway.ejecutar({ ip: origen.ip_efectiva, extensionDestino: extensionDestino.trim() });
}

// Hace timbrar un telefono (el destino) usando un softphone SIP que se registra
// con una extension e credenciales propias, via SoftphoneGateway.
export async function hacerTimbrar(
  idTelefono: number,
  extensionOrigen: string,
  usuarioSip: string,
  passwordSip: string,
): Promise<ResultadoLlamada> {
  const destino = await llamadasRepo.buscarDispositivoParaLlamada(idTelefono);
  if (destino === null) {
    throw new ErrorLlamadas('DESTINO_NO_ENCONTRADO', 'El telefono a timbrar no existe o esta inactivo.');
  }
  if (extensionOrigen.trim() === '') {
    throw new ErrorLlamadas(
      'EXTENSION_ORIGEN_REQUERIDA',
      'Debe indicar la extension de origen del softphone.',
    );
  }
  if (usuarioSip.trim() === '') {
    throw new ErrorLlamadas('USUARIO_SIP_REQUERIDO', 'Debe indicar el usuario SIP.');
  }
  if (passwordSip.trim() === '') {
    throw new ErrorLlamadas('PASSWORD_SIP_REQUERIDO', 'Debe indicar la contrasena SIP.');
  }

  const gateway = new SoftphoneGateway();
  return gateway.ejecutar({
    extensionOrigen: extensionOrigen.trim(),
    usuarioSip: usuarioSip.trim(),
    passwordSip,
    extensionDestino: destino.extension,
  });
}
