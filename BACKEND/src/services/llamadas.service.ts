import * as llamadasRepo from '../repositories/llamadas.repository';
import type { DispositivoMarcable } from '../repositories/llamadas.repository';
import { SnomGateway } from '../gateways/snom.gateway';
import { YealinkGateway } from '../gateways/yealink.gateway';
import * as softphoneGateway from '../gateways/softphone.gateway';
import type { ResultadoTimbrado } from '../gateways/softphone.gateway';
import { ErrorLlamadas } from '../gateways/errores';
import type { LlamadaGateway, ResultadoLlamada } from '../gateways/llamada.gateway';

// Marcas que admiten marcado remoto por HTTP, con el gateway que lo ejecuta.
// Claves en forma normalizada (ver normalizarMarca). Cualquier marca que no
// este aqui (grandstream, mitel, cetis, desconocidas) se trata como "solo timbra".
const GATEWAYS_MARCADO: Record<string, () => LlamadaGateway> = {
  snom: () => new SnomGateway(),
  yealink: () => new YealinkGateway(),
};

// Normaliza la marca del catalogo (texto libre) para compararla: minusculas y sin espacios.
function normalizarMarca(marca: string): string {
  return marca.toLowerCase().replace(/\s+/g, '');
}

function puedeMarcar(marcaNormalizada: string): boolean {
  return Object.prototype.hasOwnProperty.call(GATEWAYS_MARCADO, marcaNormalizada);
}

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

  // Marcas con marcado remoto (snom/yealink): el boton principal es MARCAR.
  if (puedeMarcar(normalizarMarca(dispositivo.marca))) {
    if (dispositivo.ip_efectiva) {
      return { ...base, accion: 'MARCAR' };
    }
    return { ...base, accion: 'NO_DISPONIBLE', motivo: 'Sin conexión' };
  }

  // Resto de marcas: solo timbran. El timbrado va por el Mitel a la extension,
  // asi que basta con que el dispositivo tenga extension.
  if (dispositivo.extension.trim() !== '') {
    return { ...base, accion: 'HACER_TIMBRAR' };
  }

  // Sin extension no hay forma de operarlo.
  return { ...base, accion: 'NO_DISPONIBLE', motivo: 'Sin IP' };
}

// Marca desde un telefono hacia una extension destino, eligiendo el gateway
// segun la marca del telefono (snom -> SnomGateway, yealink -> YealinkGateway).
// Si el resultado del gateway es exito:false, se devuelve tal cual (no es un error).
export async function marcar(
  idOrigen: number,
  extensionDestino: string,
): Promise<ResultadoLlamada> {
  const origen = await llamadasRepo.buscarDispositivoParaLlamada(idOrigen);
  if (origen === null) {
    throw new ErrorLlamadas('ORIGEN_NO_ENCONTRADO', 'El telefono de origen no existe o esta inactivo.');
  }
  const marca = normalizarMarca(origen.marca);
  if (!puedeMarcar(marca)) {
    throw new ErrorLlamadas('MARCA_NO_MARCABLE', 'Este telefono no admite marcado remoto');
  }
  if (!origen.ip_efectiva) {
    throw new ErrorLlamadas('SIN_IP', 'El telefono no tiene conexión, no se puede marcar');
  }
  if (extensionDestino.trim() === '') {
    throw new ErrorLlamadas('EXTENSION_DESTINO_REQUERIDA', 'Debe indicar una extension de destino.');
  }

  const gateway = GATEWAYS_MARCADO[marca]();
  return gateway.ejecutar({ ip: origen.ip_efectiva, extensionDestino: extensionDestino.trim() });
}

// Cuelga el telefono que marco, identificado por el mismo idTelefono que se
// uso como idOrigen al marcar. El colgado tambien se elige por marca.
export async function colgarMarcado(idTelefono: number): Promise<ResultadoLlamada> {
  const origen = await llamadasRepo.buscarDispositivoParaLlamada(idTelefono);
  if (origen === null) {
    throw new ErrorLlamadas('ORIGEN_NO_ENCONTRADO', 'El telefono de origen no existe o esta inactivo.');
  }
  const marca = normalizarMarca(origen.marca);
  if (!puedeMarcar(marca)) {
    throw new ErrorLlamadas('MARCA_NO_MARCABLE', 'Este telefono no admite marcado remoto');
  }
  if (!origen.ip_efectiva) {
    throw new ErrorLlamadas('SIN_IP', 'El telefono no tiene conexión, no se puede colgar');
  }

  if (marca === 'yealink') {
    // TODO: implementar el colgado remoto Yealink por HTTP en YealinkGateway
    // una vez probado contra el firmware del hotel. Hasta entonces no se envia
    // ningun comando al telefono.
    return { exito: false, detalle: 'El colgado remoto no esta disponible para este telefono' };
  }

  // snom: RELEASE_ALL_CALLS via command.htm.
  const gateway = new SnomGateway();
  return gateway.colgar({ ip: origen.ip_efectiva });
}

// Hace timbrar una extension destino (no necesariamente un dispositivo del
// inventario) usando un softphone SIP que se registra con una extension e
// credenciales propias, via SoftphoneGateway.
export async function hacerTimbrar(
  extensionOrigen: string,
  usuarioSip: string,
  passwordSip: string,
  extensionDestino: string,
): Promise<ResultadoTimbrado> {
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
  if (extensionDestino.trim() === '') {
    throw new ErrorLlamadas('EXTENSION_DESTINO_REQUERIDA', 'Debe indicar una extension de destino.');
  }

  return softphoneGateway.iniciarTimbrado({
    extensionOrigen: extensionOrigen.trim(),
    usuarioSip: usuarioSip.trim(),
    passwordSip,
    extensionDestino: extensionDestino.trim(),
  });
}

// Cuelga (o cancela el timbrado de) una llamada iniciada con hacerTimbrar,
// identificada por el idSesion que devolvio esa llamada.
export async function colgarTimbrado(idSesion: string): Promise<ResultadoLlamada> {
  if (idSesion.trim() === '') {
    throw new ErrorLlamadas('ID_SESION_REQUERIDO', 'Debe indicar el id de sesion de la llamada.');
  }

  return softphoneGateway.colgar(idSesion.trim());
}
