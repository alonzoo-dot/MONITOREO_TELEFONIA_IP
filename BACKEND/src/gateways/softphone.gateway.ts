import * as dgram from 'dgram';
import * as crypto from 'crypto';
import * as os from 'os';
import { configuracion } from '../config/env';
import type { LlamadaGateway, ParametrosLlamada, ResultadoLlamada } from './llamada.gateway';

// Softphone SIP/UDP minimo: se registra en el Mitel y luego invita a una
// extension destino para hacerla timbrar (sin negociar audio real).
// Logica portada 1:1 desde una herramienta de prueba externa que si logra
// hacer timbrar el destino contra el mismo Mitel.

const USER_AGENT = 'HotelWatch';
const TIMEOUT_REGISTER_MS = 6000;
const TIMEOUT_INVITE_MS = 8000;

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
  cseqM: string;
}

interface Esperador {
  predicado: (r: RespuestaSip) => boolean;
  resolver: (r: RespuestaSip | null) => void;
}

interface ContextoSip {
  socket: dgram.Socket;
  mitelIp: string;
  mitelPuerto: number;
  localIp: string;
  localPuerto: number;
  aor: string;
  contact: string;
  extensionOrigen: string;
  usuarioSip: string;
  passwordSip: string;
  extensionDestino: string;
  esperadores: Esperador[];
}

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
      const localIp = await localIpHacia(mitelIp, mitelPuerto);
      socket = dgram.createSocket('udp4');
      const localPuerto = await enlazarSocket(socket);

      // Un unico socket para todo el flujo: REGISTER e INVITE comparten transporte.
      const contexto: ContextoSip = {
        socket,
        mitelIp,
        mitelPuerto,
        localIp,
        localPuerto,
        aor: `sip:${extensionOrigen}@${mitelIp}`,
        contact: `<sip:${extensionOrigen}@${localIp}:${localPuerto}>`,
        extensionOrigen,
        usuarioSip,
        passwordSip,
        extensionDestino,
        esperadores: [],
      };

      socket.on('message', (paquete) => {
        despacharRespuesta(contexto, paquete);
      });

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

// --- Despacho de respuestas entrantes hacia quien las este esperando ---

function despacharRespuesta(contexto: ContextoSip, paquete: Buffer): void {
  const respuesta = parsear(paquete.toString('utf8'));
  if (respuesta === null) {
    return;
  }
  if (respuesta.status === 100) {
    console.log(`[SOFTPHONE] recibido (ignorado): 100 ${respuesta.reason}`);
    return;
  }
  console.log(
    `[SOFTPHONE] recibido: ${respuesta.status} ${respuesta.reason} (CSeq method: ${respuesta.cseqM})`,
  );

  const esperadores = contexto.esperadores;
  for (let i = esperadores.length - 1; i >= 0; i -= 1) {
    const esperador = esperadores[i];
    if (esperador.predicado(respuesta)) {
      esperadores.splice(i, 1);
      esperador.resolver(respuesta);
    }
  }
}

function esperar(
  contexto: ContextoSip,
  predicado: (r: RespuestaSip) => boolean,
  ms: number,
): Promise<RespuestaSip | null> {
  return new Promise((resolve) => {
    const entrada: Esperador = {
      predicado,
      resolver: (r) => {
        clearTimeout(temporizador);
        resolve(r);
      },
    };
    const temporizador = setTimeout(() => {
      const indice = contexto.esperadores.indexOf(entrada);
      if (indice !== -1) {
        contexto.esperadores.splice(indice, 1);
      }
      console.log('[SOFTPHONE] TIMEOUT sin respuesta esperada.');
      resolve(null);
    }, ms);
    contexto.esperadores.push(entrada);
  });
}

function enviar(contexto: ContextoSip, mensaje: string, etiqueta: string): void {
  console.log(`[SOFTPHONE] ENVIA: ${etiqueta}`);
  contexto.socket.send(Buffer.from(mensaje), contexto.mitelPuerto, contexto.mitelIp);
}

function via(contexto: ContextoSip, branch: string): string {
  return `SIP/2.0/UDP ${contexto.localIp}:${contexto.localPuerto};branch=${branch};rport`;
}

// --- Registro (REGISTER) ---

async function registrar(contexto: ContextoSip): Promise<ResultadoLlamada> {
  const callIdR = `${rnd(8)}@${contexto.localIp}`;
  const fromTagR = rnd(4);

  const construirRegister = (
    cseq: number,
    nombreHeaderAuth: 'Authorization' | 'Proxy-Authorization' | null,
    auth: string | null,
  ): string => {
    const branch = `z9hG4bK${rnd(6)}`;
    const headers: Record<string, string> = {
      Via: via(contexto, branch),
      'Max-Forwards': '70',
      From: `<${contexto.aor}>;tag=${fromTagR}`,
      To: `<${contexto.aor}>`,
      'Call-ID': callIdR,
      CSeq: `${cseq} REGISTER`,
      Contact: contexto.contact,
      Expires: '300',
      'User-Agent': USER_AGENT,
    };
    if (nombreHeaderAuth && auth) {
      headers[nombreHeaderAuth] = auth;
    }
    return construir('REGISTER', contexto.aor, headers, '');
  };

  enviar(contexto, construirRegister(1, null, null), 'REGISTER (CSeq: 1)');
  let respuesta = await esperar(
    contexto,
    (r) => r.cseqM === 'REGISTER' && r.status >= 200,
    TIMEOUT_REGISTER_MS,
  );

  if (respuesta === null) {
    return { exito: false, detalle: 'Sin respuesta del Mitel al registrar (timeout).' };
  }

  if (respuesta.status === 401 || respuesta.status === 407) {
    console.log(
      `[SOFTPHONE] REGISTER requirio autenticacion (status ${respuesta.status}), reintentando con auth...`,
    );
    const esProxy = respuesta.status === 407;
    const encabezado = esProxy ? respuesta.headers['proxy-authenticate'] : respuesta.headers['www-authenticate'];
    const desafio = encabezado ? parseAuth(encabezado) : null;
    if (!desafio) {
      console.log('[SOFTPHONE] REGISTER: no se pudo extraer un desafio de autenticacion valido.');
      return { exito: false, detalle: 'El Mitel exigio autenticacion pero no envio un desafio valido.' };
    }

    const auth = digest(desafio, 'REGISTER', `sip:${contexto.mitelIp}`, contexto.usuarioSip, contexto.passwordSip);
    const nombreHeaderAuth = esProxy ? 'Proxy-Authorization' : 'Authorization';

    enviar(contexto, construirRegister(2, nombreHeaderAuth, auth), 'REGISTER (CSeq: 2, con auth)');
    respuesta = await esperar(
      contexto,
      (r) => r.cseqM === 'REGISTER' && r.status >= 200,
      TIMEOUT_REGISTER_MS,
    );

    if (respuesta === null) {
      return { exito: false, detalle: 'Sin respuesta del Mitel al registrar con autenticacion (timeout).' };
    }
  }

  if (respuesta.status !== 200) {
    if (respuesta.status === 401 || respuesta.status === 403) {
      return { exito: false, detalle: 'Credenciales SIP invalidas.' };
    }
    return { exito: false, detalle: `El Mitel rechazo el registro (estado ${respuesta.status}).` };
  }

  console.log('[SOFTPHONE] Registro SIP exitoso.');
  return { exito: true, detalle: 'Registro SIP exitoso.' };
}

// --- Invitacion (INVITE) ---

async function invitar(contexto: ContextoSip): Promise<ResultadoLlamada> {
  const callIdI = `${rnd(8)}@${contexto.localIp}`;
  const fromTagI = rnd(4);
  const targetUri = `sip:${contexto.extensionDestino}@${contexto.mitelIp}`;

  const construirSdp = (): string => {
    const ts = Date.now();
    const lineas = [
      'v=0',
      `o=- ${ts} ${ts} IN IP4 ${contexto.localIp}`,
      's=HotelWatch',
      `c=IN IP4 ${contexto.localIp}`,
      't=0 0',
      'm=audio 40000 RTP/AVP 0 8',
      'a=rtpmap:0 PCMU/8000',
      'a=rtpmap:8 PCMA/8000',
      'a=sendrecv',
    ];
    return lineas.join('\r\n') + '\r\n';
  };

  const construirInvite = (
    cseq: number,
    branch: string,
    nombreHeaderAuth: 'Authorization' | 'Proxy-Authorization' | null,
    auth: string | null,
  ): string => {
    const headers: Record<string, string> = {
      Via: via(contexto, branch),
      'Max-Forwards': '70',
      From: `<${contexto.aor}>;tag=${fromTagI}`,
      To: `<${targetUri}>`,
      'Call-ID': callIdI,
      CSeq: `${cseq} INVITE`,
      Contact: contexto.contact,
      'Content-Type': 'application/sdp',
      'User-Agent': USER_AGENT,
    };
    if (nombreHeaderAuth && auth) {
      headers[nombreHeaderAuth] = auth;
    }
    return construir('INVITE', targetUri, headers, construirSdp());
  };

  const construirAckOCancel = (metodo: 'ACK' | 'CANCEL', cseq: number, branch: string, toFinal: string): string => {
    const headers: Record<string, string> = {
      Via: via(contexto, branch),
      'Max-Forwards': '70',
      From: `<${contexto.aor}>;tag=${fromTagI}`,
      To: toFinal,
      'Call-ID': callIdI,
      CSeq: `${cseq} ${metodo}`,
      'User-Agent': USER_AGENT,
    };
    return construir(metodo, targetUri, headers, '');
  };

  console.log(`[SOFTPHONE] === INICIO INVITE hacia ${targetUri} ===`);

  let branchInvite = `z9hG4bK${rnd(6)}`;
  let cseqInvite = 1;
  enviar(contexto, construirInvite(cseqInvite, branchInvite, null, null), 'INVITE (CSeq: 1)');

  let respuesta = await esperar(
    contexto,
    (r) => r.cseqM === 'INVITE' && (r.status >= 180 || r.status === 401 || r.status === 407),
    TIMEOUT_INVITE_MS,
  );

  if (respuesta === null) {
    console.log('[SOFTPHONE] INVITE (CSeq 1): sin respuesta (timeout).');
    return { exito: false, detalle: 'Sin respuesta del Mitel al intentar llamar (timeout).' };
  }

  if (respuesta.status === 401 || respuesta.status === 407) {
    console.log(
      `[SOFTPHONE] INVITE (CSeq 1) requirio autenticacion (status ${respuesta.status} ${respuesta.reason}). ACK + reintento con auth...`,
    );

    const toDeError = respuesta.headers['to'] ?? `<${targetUri}>`;
    enviar(
      contexto,
      construirAckOCancel('ACK', cseqInvite, branchInvite, toDeError),
      'ACK (a respuesta de error del INVITE CSeq 1)',
    );

    const esProxy = respuesta.status === 407;
    const encabezado = esProxy ? respuesta.headers['proxy-authenticate'] : respuesta.headers['www-authenticate'];
    const desafio = encabezado ? parseAuth(encabezado) : null;
    if (!desafio) {
      console.log('[SOFTPHONE] INVITE: no se pudo extraer un desafio de autenticacion valido.');
      return { exito: false, detalle: 'El Mitel exigio autenticacion pero no envio un desafio valido.' };
    }

    const auth = digest(desafio, 'INVITE', targetUri, contexto.usuarioSip, contexto.passwordSip);
    const nombreHeaderAuth = esProxy ? 'Proxy-Authorization' : 'Authorization';

    branchInvite = `z9hG4bK${rnd(6)}`;
    cseqInvite = 2;
    enviar(
      contexto,
      construirInvite(cseqInvite, branchInvite, nombreHeaderAuth, auth),
      'INVITE (CSeq: 2, con auth)',
    );

    respuesta = await esperar(contexto, (r) => r.cseqM === 'INVITE' && r.status >= 180, TIMEOUT_INVITE_MS);

    if (respuesta === null) {
      console.log('[SOFTPHONE] INVITE (CSeq 2, con auth): sin respuesta (timeout).');
      return { exito: false, detalle: 'Sin respuesta del Mitel al intentar llamar con autenticacion (timeout).' };
    }
    console.log(`[SOFTPHONE] INVITE (CSeq 2, con auth) respondio: ${respuesta.status} ${respuesta.reason}`);
  }

  const toFinal = respuesta.headers['to'] ?? `<${targetUri}>`;

  if (respuesta.status === 180 || respuesta.status === 183) {
    console.log('[SOFTPHONE] INVITE resultado: timbrando. Enviando CANCEL.');
    enviar(contexto, construirAckOCancel('CANCEL', cseqInvite, branchInvite, toFinal), 'CANCEL');
    return { exito: true, detalle: 'El telefono esta timbrando.' };
  }

  if (respuesta.status === 200) {
    console.log('[SOFTPHONE] INVITE resultado: contestada. Enviando ACK.');
    enviar(contexto, construirAckOCancel('ACK', cseqInvite, branchInvite, toFinal), 'ACK');
    return { exito: true, detalle: 'Llamada contestada.' };
  }

  // Cualquier otra respuesta final no exitosa: reconocerla con ACK y no dejarla en el aire.
  console.log(
    `[SOFTPHONE] INVITE resultado final NO exitoso: ${respuesta.status} ${respuesta.reason}. Enviando ACK.`,
  );
  enviar(contexto, construirAckOCancel('ACK', cseqInvite, branchInvite, toFinal), 'ACK');

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

// --- Autenticacion digest (RFC 2617) ---

function parseAuth(header: string): DesafioAuth | null {
  const sinEsquema = header.replace(/^Digest\s+/i, '');
  const partes: Record<string, string> = {};
  const patron = /(\w+)=(?:"([^"]*)"|([^,\s]*))/g;
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

function digest(ch: DesafioAuth, metodo: string, uri: string, usuario: string, password: string): string {
  const ha1 = md5(`${usuario}:${ch.realm}:${password}`);
  const ha2 = md5(`${metodo}:${uri}`);

  const partes = [
    `Digest username="${usuario}"`,
    `realm="${ch.realm}"`,
    `nonce="${ch.nonce}"`,
    `uri="${uri}"`,
  ];

  if (ch.qop) {
    const qop = ch.qop.split(',')[0];
    const nc = '00000001';
    const cnonce = rnd(4);
    const respuesta = md5(`${ha1}:${ch.nonce}:${nc}:${cnonce}:${qop}:${ha2}`);
    partes.push(`response="${respuesta}"`, 'algorithm=MD5', `qop=${qop}`, `nc=${nc}`, `cnonce="${cnonce}"`);
  } else {
    const respuesta = md5(`${ha1}:${ch.nonce}:${ha2}`);
    partes.push(`response="${respuesta}"`, 'algorithm=MD5');
  }

  if (ch.opaque) {
    partes.push(`opaque="${ch.opaque}"`);
  }

  return partes.join(', ');
}

function md5(texto: string): string {
  return crypto.createHash('md5').update(texto).digest('hex');
}

// --- Construccion y parseo de mensajes SIP ---

function construir(metodo: string, ruri: string, headers: Record<string, string>, body: string): string {
  const lineaPeticion = `${metodo} ${ruri} SIP/2.0`;
  const lineasHeaders = Object.entries(headers).map(([nombre, valor]) => `${nombre}: ${valor}`);
  const lineaContentLength = `Content-Length: ${Buffer.byteLength(body, 'utf8')}`;
  return [lineaPeticion, ...lineasHeaders, lineaContentLength, '', body].join('\r\n');
}

function parsear(mensaje: string): RespuestaSip | null {
  const separadorCuerpo = mensaje.indexOf('\r\n\r\n');
  const cabecera = separadorCuerpo === -1 ? mensaje : mensaje.slice(0, separadorCuerpo);
  const lineas = cabecera.split('\r\n');
  const primeraLinea = lineas[0] ?? '';
  const coincidenciaEstado = primeraLinea.match(/^SIP\/2\.0\s+(\d+)\s+(.*)$/);
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
  const cseqM = cseqHeader.split(' ')[1] ?? '';

  return { status, reason, headers, cseqM };
}

function rnd(bytes: number): string {
  return crypto.randomBytes(bytes).toString('hex');
}

// --- Transporte UDP ---

function enlazarSocket(socket: dgram.Socket): Promise<number> {
  return new Promise((resolve, reject) => {
    socket.once('error', reject);
    socket.bind(0, () => {
      socket.removeListener('error', reject);
      resolve(socket.address().port);
    });
  });
}

// Determina la IP local con la que se llegaria al Mitel. Usa un socket UDP
// temporal "conectado" para que el sistema operativo resuelva la interfaz de
// salida; si eso falla o devuelve una IP no utilizable, cae a recorrer las
// interfaces de red locales.
function localIpHacia(host: string, puerto: number): Promise<string> {
  return new Promise((resolve) => {
    const sondeo = dgram.createSocket('udp4');
    let resuelto = false;

    const finalizar = (ip: string): void => {
      if (resuelto) {
        return;
      }
      resuelto = true;
      clearTimeout(temporizador);
      sondeo.close();
      resolve(ip);
    };

    const temporizador = setTimeout(() => {
      finalizar(obtenerIpLocalPorInterfaces());
    }, 1500);

    sondeo.once('error', () => {
      finalizar(obtenerIpLocalPorInterfaces());
    });

    sondeo.connect(puerto, host, () => {
      const direccion = sondeo.address().address;
      if (!direccion || direccion === '0.0.0.0' || direccion.startsWith('127.')) {
        finalizar(obtenerIpLocalPorInterfaces());
        return;
      }
      finalizar(direccion);
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
