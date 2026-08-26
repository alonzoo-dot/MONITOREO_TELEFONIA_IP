// Forzar salida sincrónica de logs para que aparezcan en tiempo real en Windows.
if (process.stdout.isTTY === false || process.stdout.isTTY === undefined) {
  // @ts-ignore — _handle es API interna de Node, no está tipada
  process.stdout._handle?.setBlocking?.(true);
  // @ts-ignore
  process.stderr._handle?.setBlocking?.(true);
}

import { crearAplicacion } from './app';
import { configuracion } from './config/env';
import { probarConexion } from './config/database';
import { MotorMonitoreo } from './motor/motorMonitoreo';
import { ResolvedorIpArp } from './motor/resolvedorIpArp';
import { establecerInstanciaMotor } from './motor/instancia';
import * as monitoreoRepo from './repositories/monitoreo.repository';
import * as telefonosRepo from './repositories/telefonos.repository';
import * as monitoreoService from './services/monitoreo.service';

async function iniciarServidor(): Promise<void> {
  await probarConexion();

  const aplicacion = crearAplicacion();
  aplicacion.listen(configuracion.puerto, () => {
    console.log(
      `Monitoreo backend en http://localhost:${configuracion.puerto} (${configuracion.entorno})`,
    );
  });

  if (configuracion.motorActivo) {
    const resolvedor = new ResolvedorIpArp();
    const motor = new MotorMonitoreo(resolvedor, monitoreoRepo, telefonosRepo);
    await motor.iniciar();
    establecerInstanciaMotor(motor);
    console.log('[MOTOR] Iniciado');

    monitoreoService.suscribirAlMotor(motor);
    console.log('[MONITOREO] Servicio suscrito al motor');
  } else {
    console.log('[MOTOR] Inactivo (MOTOR_ACTIVO=false)');
  }
}

iniciarServidor().catch((error: unknown) => {
  console.error('Fallo al iniciar el servidor:', error);
  process.exit(1);
});