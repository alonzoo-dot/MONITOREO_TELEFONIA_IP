
import path from 'path';
import dotenv from 'dotenv';

// Carga el .env por RUTA ABSOLUTA, no por directorio de trabajo del proceso.
// Como servicio de Windows, process.cwd() NO es la carpeta del backend; sin esta
// ruta explicita dotenv no hallaria el .env y faltarian las variables obligatorias.
// __dirname resuelve a src/config (dev) o dist/config (prod); el .env vive en la raiz.
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

function variableObligatoria(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(`Falta la variable de entorno obligatoria: ${nombre}`);
  }
  return valor;
}

// Lee un entero positivo del entorno; si falta o no es valido usa el valor por defecto
function enteroPositivo(nombre: string, porDefecto: number): number {
  const valor = Number(process.env[nombre] ?? porDefecto);
  return Number.isFinite(valor) && valor > 0 ? valor : porDefecto;
}

export const configuracion = {
  urlBaseDatos: variableObligatoria('DATABASE_URL'),
  puerto: Number(process.env.PORT ?? 4000),
  entorno: process.env.NODE_ENV ?? 'development',
  jwtSecret: variableObligatoria('JWT_SECRET'),
  jwtExpiracion: process.env.JWT_EXPIRES_IN ?? '12h',
  /** Si es true, el motor de monitoreo ICMP arranca al levantar el backend. */
  motorActivo: process.env.MOTOR_ACTIVO === 'true',
  /** Credenciales de administrador de los telefonos Snom, usadas en HTTP Basic. */
  snomUsuario: process.env.SNOM_USUARIO ?? '',
  snomPassword: process.env.SNOM_PASSWORD ?? '',
  /** Credenciales de administrador de los telefonos Yealink, usadas en HTTP Basic. */
  yealinkUsuario: process.env.YEALINK_USUARIO ?? '',
  yealinkPassword: process.env.YEALINK_PASSWORD ?? '',
  /** IP y puerto SIP fijos de la central Mitel, usados por SoftphoneGateway. */
  mitelIp: process.env.MITEL_IP ?? '',
  mitelPuertoSip: Number(process.env.MITEL_PUERTO_SIP ?? 5060),
  /** Maximo de pings simultaneos en todo el motor (rondas + barridos). */
  maxPingsConcurrentes: enteroPositivo('MOTOR_MAX_PINGS_CONCURRENTES', 50),
} as const;

