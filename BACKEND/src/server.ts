// Forzar salida sincrónica de logs para que aparezcan en tiempo real en Windows.
if (process.stdout.isTTY === false || process.stdout.isTTY === undefined) {
  // @ts-ignore — _handle es API interna de Node, no está tipada
  process.stdout._handle?.setBlocking?.(true);
  // @ts-ignore
  process.stderr._handle?.setBlocking?.(true);
}

import os from 'os';
import { crearAplicacion } from './app';
import { configuracion } from './config/env';
import { probarConexion } from './config/database';
import { MotorMonitoreo } from './motor/motorMonitoreo';
import { ResolvedorIpArp } from './motor/resolvedorIpArp';
import { establecerInstanciaMotor } from './motor/instancia';
import * as monitoreoRepo from './repositories/monitoreo.repository';
import * as telefonosRepo from './repositories/telefonos.repository';
import * as monitoreoService from './services/monitoreo.service';
import * as incidenciasService from './services/incidencias.service';

// Redes de seguridad de último recurso: registran fallos asíncronos que se
// escapen de los try/catch, en vez de dejar que Node mate el proceso por su
// comportamiento por defecto. El backend (API + motor) debe seguir vivo; node-windows
// reinicia el proceso solo si aun así llegara a caer.
process.on('unhandledRejection', (motivo: unknown) => {
  console.error('[PROCESO] Promesa rechazada sin manejar:', motivo);
});
process.on('uncaughtException', (error: unknown) => {
  console.error('[PROCESO] Excepción no capturada:', error);
});

function obtenerIpsLan(): string[] {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];
  for (const nombre of Object.keys(interfaces)) {
    for (const info of interfaces[nombre] ?? []) {
      if (info.family === 'IPv4' && !info.internal) {
        ips.push(info.address);
      }
    }
  }
  return ips;
}

async function iniciarServidor(): Promise<void> {
  await probarConexion();

  const aplicacion = crearAplicacion();
  const puerto = configuracion.puerto;
  aplicacion.listen(puerto, '0.0.0.0', () => {
    console.log(`Monitoreo backend escuchando en el puerto ${puerto} (${configuracion.entorno})`);
    console.log(`  Local:   http://localhost:${puerto}/health`);
    for (const ip of obtenerIpsLan()) {
      console.log(`  Red LAN: http://${ip}:${puerto}/health`);
    }
  });

  if (configuracion.motorActivo) {
    const resolvedor = new ResolvedorIpArp();
    const motor = new MotorMonitoreo(resolvedor, monitoreoRepo, telefonosRepo, {
      intentosPing: configuracion.intentosPing,
      barridoArranque: configuracion.barridoArranque,
      rebarridoMinutos: configuracion.rebarridoMinutos,
      subredesBarrido: configuracion.subredesBarrido,
    });
    await motor.iniciar();
    establecerInstanciaMotor(motor);
    console.log('[MOTOR] Iniciado');

    monitoreoService.suscribirAlMotor(motor);
    console.log('[MONITOREO] Servicio suscrito al motor');

    // Job de auto-cierre de incidencias antiguas (Capa 3 del esquema de
    // cierre automatico). Corre una vez tras el arranque y luego cada hora.
    setTimeout(() => {
      void incidenciasService.ejecutarAutoCierreIncidenciasAntiguas();
    }, incidenciasService.DELAY_INICIAL_MS);

    setInterval(() => {
      void incidenciasService.ejecutarAutoCierreIncidenciasAntiguas();
    }, incidenciasService.INTERVALO_JOB_MS);

    console.log(`[INCIDENCIAS] Auto-cierre activo cada 1h (umbral: ${incidenciasService.HORAS_AUTO_CIERRE}h)`);
  } else {
    console.log('[MOTOR] Inactivo (MOTOR_ACTIVO=false)');
  }
}

iniciarServidor().catch((error: unknown) => {
  console.error('Fallo al iniciar el servidor:', error);
  process.exit(1);
});