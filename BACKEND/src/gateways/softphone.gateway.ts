import * as dgram from 'dgram';
import * as crypto from 'crypto';
import * as os from 'os';
import { configuracion } from '../config/env';
import type { LlamadaGateway, ParametrosLlamada, ResultadoLlamada } from './llamada.gateway';

// Softphone SIP/UDP minimo: se registra en el Mitel, invita a una extension
// destino para hacerla timbrar, y cancela/cierra. No mantiene sesion viva.

const TIMEOUT_REGISTER_MS = 6000;
const TIMEOUT_INVITE_MS = 6000;
const USER_AGENT = 'HotelWatch';

interface ContextoSip {
  socket: dgram.Socket;
  mitelIp: string;
  mitelPuerto: number;
  localIp: string;
  localPuerto: number;
  callId: string;
  fromTag: string;
  extensionOrigen: string;
  usuarioSip: string;
  passwordSip: string;
  extensionDestino: string;
}

interface DesafioAuth {
  realm: string;
  nonce: string;
  qop?: string;
  opaque?: string;
  algorithm?: string;
}

interface RespuestaSip {
  status: number;
  reason: string;
  headers: Record<string, string>;
  cseqMethod: string;
}

interface TransaccionInvite {
  mensaje: string;
  branch: string;
  cseq: number;
}

interface DatosAutenticacion {
  desafio: DesafioAuth;
  esProxy: boolean;
}

// Marca por SIP/UDP: registra la extension origen en el Mitel y luego invita
// a la extension destino para hacerla timbrar (sin negociar audio real).
export class SoftphoneGateway implements LlamadaGateway {
  async ejecutar(parametros: ParametrosLlamada): Promise<ResultadoLlamada> {
    const { extensionOrigen, usuarioSip, passwordSip, extensionDestino } = parametros;
    if (!extensionOrigen || !usuarioSip || !passwordSip || !extensionDestino) {
      return {
        exito: false,
        detalle: 'Se requiere extensionOrigen, usuarioSip, passwordSip y extensionDestino.',
      };
    }

    const mitelIp = configuracion.mitelIp;
    const mitelPuerto = configuracion.mitelPuertoSip;
    if (!mitelIp) {
      return { exito: false, detalle: 'No hay IP del Mitel configurada.' };
    }

    let socket: dgram.Socket | null = null;
    try {
      const localIp = await determinarIpLocal(mitelIp, mitelPuerto);
      socket = dgram.createSocket('udp4');
      const localPuerto = await enlazarSocket(socket);

      const contexto: ContextoSip = {
        socket,
        mitelIp,
        mitelPuerto,
        localIp,
        localPuerto,
        callId: `${generarCadenaAleatoria(8)}@${localIp}`,
        fromTag: generarCadenaAleatoria(4),
        extensionOrigen,
        usuarioSip,
        passwordSip,
        extensionDestino,
      };

      const resultadoRegistro = await registrar(contexto);
      if (!resultadoRegistro.exito) {
        return resultadoRegistro;
      }

      return await invitar(contexto);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido.';
      return { exito: false, detalle: `Fallo el softphone SIP: ${mensaje}` };
    } finally {
      socket?.close();
    }
  }
}

// --- Registro (REGISTER) ---

async function registrar(contexto: ContextoSip): Promise<ResultadoLlamada> {
  const primeraRespuesta = await enviarRegister(contexto, 1, null);
  if (primeraRespuesta === null) {
    return { exito: false, detalle: 'Sin respuesta del Mitel al registrar (timeout).' };
  }

  if (primeraRespuesta.status === 200) {
    return { exito: true, detalle: 'Registro SIP exitoso.' };
  }

  if (primeraRespuesta.status === 401 || primeraRespuesta.status === 407) {
    const autenticacion = extraerAutenticacion(primeraRespuesta);
    if (!autenticacion) {
      return { exito: false, detalle: 'El Mitel exigio autenticacion pero no envio un desafio valido.' };
    }

    const segundaRespuesta = await enviarRegister(contexto, 2, autenticacion);
    if (segundaRespuesta === null) {
      return { exito: false, detalle: 'Sin respuesta del Mitel al registrar con autenticacion (timeout).' };
    }
    if (segundaRespuesta.status === 200) {
      return { exito: true, detalle: 'Registro SIP exitoso.' };
    }
    if (segundaRespuesta.status === 401 || segundaRespuesta.status === 403) {
      return { exito: false, detalle: 'Credenciales SIP invalidas.' };
    }
    return { exito: false, detalle: `El Mitel rechazo el registro (estado ${segundaRespuesta.status}).` };
  }

  if (primeraRespuesta.status === 403) {
    return { exito: false, detalle: 'Credenciales SIP invalidas.' };
  }

  return { exito: false, detalle: `El Mitel rechazo el registro (estado ${primeraRespuesta.status}).` };
}

function enviarRegister(
  contexto: ContextoSip,
  cseq: number,
  autenticacion: DatosAutenticacion | null,
): Promise<RespuestaSip | null> {
  const uri = `sip:${contexto.mitelIp}`;
  const branch = generarBranch();
  const headers: Record<string, string> = {
    Via: `SIP/2.0/UDP ${contexto.localIp}:${contexto.localPuerto};branch=${branch};rport`,
    'Max-Forwards': '70',
    From: `<sip:${contexto.extensionOrigen}@${contexto.mitelIp}>;tag=${contexto.fromTag}`,
    To: `<sip:${contexto.extensionOrigen}@${contexto.mitelIp}>`,
    'Call-ID': contexto.callId,
    CSeq: `${cseq} REGISTER`,
    Contact: `<sip:${contexto.extensionOrigen}@${contexto.localIp}:${contexto.localPuerto}>`,
    Expires: '300',
    'User-Agent': USER_AGENT,
  };
  if (autenticacion) {
    agregarAuthorization(headers, autenticacion, 'REGISTER', uri, contexto);
  }

  const mensaje = construirMensaje('REGISTER', uri, headers, '');
  return enviarYEsperar(contexto.socket, mensaje, contexto.mitelIp, contexto.mitelPuerto, TIMEOUT_REGISTER_MS);
}

// --- Invitacion (INVITE) ---

async function invitar(contexto: ContextoSip): Promise<ResultadoLlamada> {
  const uri = `sip:${contexto.extensionDestino}@${contexto.mitelIp}`;

  let transaccion = construirInvite(contexto, 1, null);
  let respuesta = await enviarYEsperar(
    contexto.socket,
    transaccion.mensaje,
    contexto.mitelIp,
    contexto.mitelPuerto,
    TIMEOUT_INVITE_MS,
  );

  if (respuesta === null) {
    return { exito: false, detalle: 'Sin respuesta del Mitel al intentar llamar (timeout).' };
  }

  if (respuesta.status === 401 || respuesta.status === 407) {
    const autenticacion = extraerAutenticacion(respuesta);
    await enviarAck(contexto, transaccion, respuesta, uri);

    if (!autenticacion) {
      return { exito: false, detalle: 'El Mitel exigio autenticacion pero no envio un desafio valido.' };
    }

    transaccion = construirInvite(contexto, 2, autenticacion);
    respuesta = await enviarYEsperar(
      contexto.socket,
      transaccion.mensaje,
      contexto.mitelIp,
      contexto.mitelPuerto,
      TIMEOUT_INVITE_MS,
    );

    if (respuesta === null) {
      return { exito: false, detalle: 'Sin respuesta del Mitel al intentar llamar con autenticacion (timeout).' };
    }
  }

  if (respuesta.status === 180 || respuesta.status === 183) {
    await enviarCancel(contexto, transaccion, respuesta, uri);
    return { exito: true, detalle: 'El telefono esta timbrando.' };
  }

  if (respuesta.status === 200) {
    await enviarAck(contexto, transaccion, respuesta, uri);
    return { exito: true, detalle: 'Llamada contestada.' };
  }

  // Cualquier otra respuesta final no exitosa: reconocerla con ACK y no dejarla en el aire.
  await enviarAck(contexto, transaccion, respuesta, uri);

  if (respuesta.status === 486) {
    return { exito: false, detalle: 'El destino esta ocupado.' };
  }
  if (respuesta.status === 404) {
    return { exito: false, detalle: 'Destino no encontrado.' };
  }
  if (respuesta.status === 403) {
    return { exito: false, detalle: 'Sin permiso para llamar a ese destino.' };
  }
  if (respuesta.status === 401 || respuesta.status === 407) {
    return { exito: false, detalle: 'Credenciales SIP invalidas.' };
  }
  return { exito: false, detalle: `El Mitel rechazo la llamada (estado ${respuesta.status}).` };
}

function construirInvite(
  contexto: ContextoSip,
  cseq: number,
  autenticacion: DatosAutenticacion | null,
): TransaccionInvite {
  const uri = `sip:${contexto.extensionDestino}@${contexto.mitelIp}`;
  const branch = generarBranch();
  const cuerpo = construirSdp(contexto.localIp);
  const headers: Record<string, string> = {
    Via: `SIP/2.0/UDP ${contexto.localIp}:${contexto.localPuerto};branch=${branch};rport`,
    'Max-Forwards': '70',
    From: `<sip:${contexto.extensionOrigen}@${contexto.mitelIp}>;tag=${contexto.fromTag}`,
    To: `<sip:${contexto.extensionDestino}@${contexto.mitelIp}>`,
    'Call-ID': contexto.callId,
    CSeq: `${cseq} INVITE`,
    Contact: `<sip:${contexto.extensionOrigen}@${contexto.localIp}:${contexto.localPuerto}>`,
    'Content-Type': 'application/sdp',
    'User-Agent': USER_AGENT,
  };
  if (autenticacion) {
    agregarAuthorization(headers, autenticacion, 'INVITE', uri, contexto);
  }

  const mensaje = construirMensaje('INVITE', uri, headers, cuerpo);
  return { mensaje, branch, cseq };
}

function construirSdp(localIp: string): string {
  const idSesion = Date.now();
  const lineas = [
    'v=0',
    `o=- ${idSesion} ${idSesion} IN IP4 ${localIp}`,
    's=-',
    `c=IN IP4 ${localIp}`,
    't=0 0',
    'm=audio 40000 RTP/AVP 0 8',
    'a=rtpmap:0 PCMU/8000',
    'a=rtpmap:8 PCMA/8000',
  ];
  return lineas.join('\r\n') + '\r\n';
}

// ACK y CANCEL reutilizan el branch y el CSeq de la transaccion INVITE que respondieron,
// y toman el To de la respuesta (que puede traer el tag agregado por el Mitel).

async function enviarAck(
  contexto: ContextoSip,
  transaccion: TransaccionInvite,
  respuesta: RespuestaSip,
  uri: string,
): Promise<void> {
  const headers: Record<string, string> = {
    Via: `SIP/2.0/UDP ${contexto.localIp}:${contexto.localPuerto};branch=${transaccion.branch};rport`,
    'Max-Forwards': '70',
    From: `<sip:${contexto.extensionOrigen}@${contexto.mitelIp}>;tag=${contexto.fromTag}`,
    To: obtenerToHeader(respuesta, contexto),
    'Call-ID': contexto.callId,
    CSeq: `${transaccion.cseq} ACK`,
    'User-Agent': USER_AGENT,
  };
  const mensaje = construirMensaje('ACK', uri, headers, '');
  await enviarSinEsperar(contexto.socket, mensaje, contexto.mitelIp, contexto.mitelPuerto);
}

async function enviarCancel(
  contexto: ContextoSip,
  transaccion: TransaccionInvite,
  respuesta: RespuestaSip,
  uri: string,
): Promise<void> {
  const headers: Record<string, string> = {
    Via: `SIP/2.0/UDP ${contexto.localIp}:${contexto.localPuerto};branch=${transaccion.branch};rport`,
    'Max-Forwards': '70',
    From: `<sip:${contexto.extensionOrigen}@${contexto.mitelIp}>;tag=${contexto.fromTag}`,
    To: obtenerToHeader(respuesta, contexto),
    'Call-ID': contexto.callId,
    CSeq: `${transaccion.cseq} CANCEL`,
    'User-Agent': USER_AGENT,
  };
  const mensaje = construirMensaje('CANCEL', uri, headers, '');
  await enviarSinEsperar(contexto.socket, mensaje, contexto.mitelIp, contexto.mitelPuerto);
}

function obtenerToHeader(respuesta: RespuestaSip, contexto: ContextoSip): string {
  return respuesta.headers['to'] ?? `<sip:${contexto.extensionDestino}@${contexto.mitelIp}>`;
}

// --- Autenticacion digest (RFC 2617) ---

function extraerAutenticacion(respuesta: RespuestaSip): DatosAutenticacion | null {
  const esProxy = respuesta.status === 407;
  const encabezado = esProxy ? respuesta.headers['proxy-authenticate'] : respuesta.headers['www-authenticate'];
  if (!encabezado) {
    return null;
  }
  const desafio = parsearAuth(encabezado);
  if (!desafio) {
    return null;
  }
  return { desafio, esProxy };
}

function agregarAuthorization(
  headers: Record<string, string>,
  autenticacion: DatosAutenticacion,
  metodo: string,
  uri: string,
  contexto: ContextoSip,
): void {
  const nombreHeader = autenticacion.esProxy ? 'Proxy-Authorization' : 'Authorization';
  headers[nombreHeader] = construirAuthorization(
    autenticacion.desafio,
    metodo,
    uri,
    contexto.usuarioSip,
    contexto.passwordSip,
  );
}

function parsearAuth(header: string): DesafioAuth | null {
  const sinEsquema = header.replace(/^Digest\s+/i, '');
  const partes: Record<string, string> = {};
  const patron = /(\w+)=(?:"([^"]*)"|([^,\s]+))/g;
  let coincidencia: RegExpExecArray | null;
  while ((coincidencia = patron.exec(sinEsquema)) !== null) {
    const clave = coincidencia[1].toLowerCase();
    const valor = coincidencia[2] ?? coincidencia[3] ?? '';
    partes[clave] = valor;
  }
  if (!partes.realm || !partes.nonce) {
    return null;
  }
  return {
    realm: partes.realm,
    nonce: partes.nonce,
    qop: partes.qop,
    opaque: partes.opaque,
    algorithm: partes.algorithm,
  };
}

function construirAuthorization(
  desafio: DesafioAuth,
  metodo: string,
  uri: string,
  usuario: string,
  password: string,
): string {
  const { respuesta, cnonce, nc } = calcularDigest(desafio, metodo, uri, usuario, password);
  const partes = [
    `Digest username="${usuario}"`,
    `realm="${desafio.realm}"`,
    `nonce="${desafio.nonce}"`,
    `uri="${uri}"`,
    `response="${respuesta}"`,
  ];
  if (desafio.algorithm) {
    partes.push(`algorithm=${desafio.algorithm}`);
  }
  if (desafio.qop) {
    partes.push(`qop=${desafio.qop}`, `nc=${nc}`, `cnonce="${cnonce}"`);
  }
  if (desafio.opaque) {
    partes.push(`opaque="${desafio.opaque}"`);
  }
  return partes.join(', ');
}

function calcularDigest(
  desafio: DesafioAuth,
  metodo: string,
  uri: string,
  usuario: string,
  password: string,
): { respuesta: string; cnonce?: string; nc?: string } {
  const ha1 = md5(`${usuario}:${desafio.realm}:${password}`);
  const ha2 = md5(`${metodo}:${uri}`);

  if (desafio.qop) {
    const nc = '00000001';
    const cnonce = generarCadenaAleatoria(8);
    const respuesta = md5(`${ha1}:${desafio.nonce}:${nc}:${cnonce}:${desafio.qop}:${ha2}`);
    return { respuesta, cnonce, nc };
  }

  const respuesta = md5(`${ha1}:${desafio.nonce}:${ha2}`);
  return { respuesta };
}

function md5(texto: string): string {
  return crypto.createHash('md5').update(texto).digest('hex');
}

// --- Construccion y parseo de mensajes SIP ---

function construirMensaje(metodo: string, ruri: string, headers: Record<string, string>, body: string): string {
  const lineaPeticion = `${metodo} ${ruri} SIP/2.0`;
  const lineasHeaders = Object.entries(headers).map(([nombre, valor]) => `${nombre}: ${valor}`);
  const lineaContentLength = `Content-Length: ${Buffer.byteLength(body, 'utf8')}`;
  return [lineaPeticion, ...lineasHeaders, lineaContentLength, '', body].join('\r\n');
}

function parsearRespuesta(mensaje: string): RespuestaSip | null {
  const separadorCuerpo = mensaje.indexOf('\r\n\r\n');
  const cabecera = separadorCuerpo === -1 ? mensaje : mensaje.slice(0, separadorCuerpo);
  const lineas = cabecera.split('\r\n');
  const primeraLinea = lineas[0] ?? '';
  const coincidenciaEstado = primeraLinea.match(/^SIP\/2\.0\s+(\d{3})\s*(.*)$/);
  if (!coincidenciaEstado) {
    return null;
  }

  const status = Number(coincidenciaEstado[1]);
  const reason = (coincidenciaEstado[2] ?? '').trim();
  const headers: Record<string, string> = {};
  for (let i = 1; i < lineas.length; i += 1) {
    const linea = lineas[i] ?? '';
    const separador = linea.indexOf(':');
    if (separador === -1) {
      continue;
    }
    const nombre = linea.slice(0, separador).trim().toLowerCase();
    const valor = linea.slice(separador + 1).trim();
    headers[nombre] = valor;
  }

  const cseqHeader = headers['cseq'] ?? '';
  const cseqMethod = cseqHeader.split(' ')[1] ?? '';

  return { status, reason, headers, cseqMethod };
}

function generarBranch(): string {
  return `z9hG4bK${generarCadenaAleatoria(8)}`;
}

function generarCadenaAleatoria(bytes: number): string {
  return crypto.randomBytes(bytes).toString('hex');
}

// --- Transporte UDP ---

function enviarYEsperar(
  socket: dgram.Socket,
  mensaje: string,
  ip: string,
  puerto: number,
  timeoutMs: number,
): Promise<RespuestaSip | null> {
  return new Promise((resolve) => {
    let resuelto = false;

    const finalizar = (resultado: RespuestaSip | null): void => {
      if (resuelto) {
        return;
      }
      resuelto = true;
      clearTimeout(temporizador);
      socket.removeListener('message', onMensaje);
      resolve(resultado);
    };

    const temporizador = setTimeout(() => finalizar(null), timeoutMs);

    function onMensaje(paquete: Buffer): void {
      const respuesta = parsearRespuesta(paquete.toString('utf8'));
      // Ignorar 100 Trying: no es una respuesta final ni util para decidir el resultado.
      if (respuesta === null || respuesta.status === 100) {
        return;
      }
      finalizar(respuesta);
    }

    socket.on('message', onMensaje);
    socket.send(mensaje, puerto, ip, (error) => {
      if (error) {
        finalizar(null);
      }
    });
  });
}

function enviarSinEsperar(socket: dgram.Socket, mensaje: string, ip: string, puerto: number): Promise<void> {
  return new Promise((resolve) => {
    socket.send(mensaje, puerto, ip, () => resolve());
  });
}

function determinarIpLocal(mitelIp: string, mitelPuerto: number): Promise<string> {
  return new Promise((resolve) => {
    const sondeo = dgram.createSocket('udp4');
    sondeo.once('error', () => {
      sondeo.close();
      resolve(obtenerIpLocalPorInterfaces());
    });
    sondeo.connect(mitelPuerto, mitelIp, () => {
      const direccion = sondeo.address().address;
      sondeo.close();
      resolve(direccion);
    });
  });
}

function obtenerIpLocalPorInterfaces(): string {
  const interfaces = os.networkInterfaces();
  for (const nombre of Object.keys(interfaces)) {
    const direcciones = interfaces[nombre] ?? [];
    for (const direccion of direcciones) {
      if (direccion.family === 'IPv4' && !direccion.internal) {
        return direccion.address;
      }
    }
  }
  return '127.0.0.1';
}

function enlazarSocket(socket: dgram.Socket): Promise<number> {
  return new Promise((resolve, reject) => {
    socket.once('error', reject);
    socket.bind(0, () => {
      socket.removeListener('error', reject);
      resolve(socket.address().port);
    });
  });
}
