import { z } from 'zod';

/** Formato de dirección MAC: seis pares hex separados por ':' o '-'. */
const REGEX_MAC = /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/;

/** IPv4 dentro de los rangos del hotel: 10.81.20.x o 10.81.21.x (último octeto 0–255). */
export const REGEX_IP_HOTEL = /^10\.81\.(20|21)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

/**
 * Esquema de forma para crear o editar un dispositivo. Valida tipos, enums y
 * formato (no reglas de negocio: la coherencia por tipo vive en el servicio).
 */
export const esquemaDispositivo = z.object({
  ubicacion_nombre: z
    .string()
    .trim()
    .min(1, 'El nombre de la ubicación es obligatorio')
    .max(40, 'El nombre de la ubicación no puede superar 40 caracteres')
    .transform((v) => v.toUpperCase()),
  piso: z
    .number()
    .int('El piso debe ser un número entero')
    .min(1, 'El piso debe ser mayor o igual a 1')
    .max(50, 'El piso no puede superar 50'),
  tipo_ubicacion: z.enum(['HABITACION', 'DEPARTAMENTO']),
  id_modelo_telefono: z
    .number()
    .int()
    .positive('El id del modelo de teléfono debe ser un número positivo'),
  extension: z
    .string()
    .trim()
    .min(1, 'La extensión es obligatoria')
    .max(10, 'La extensión no puede superar 10 caracteres'),
  tipo: z.enum(['IP_ATA', 'IP_NATIVO', 'ANALOGICO']),
  numero_serie: z
    .string()
    .trim()
    .min(1, 'El número de serie del teléfono es obligatorio')
    .max(30, 'El número de serie no puede superar 30 caracteres'),
  mac: z
    .string()
    .trim()
    .regex(REGEX_MAC, 'El formato de la MAC no es válido')
    .transform((v) => v.toUpperCase())
    .nullable()
    .default(null),
  ip: z
    .string()
    .trim()
    .regex(REGEX_IP_HOTEL, 'La IP debe pertenecer a los rangos del hotel (10.81.20.x o 10.81.21.x)')
    .nullable()
    .default(null),
  id_modelo_ata: z
    .number()
    .int()
    .positive('El id del modelo de ATA debe ser un número positivo')
    .nullable()
    .default(null),
  ata_numero_serie: z
    .string()
    .trim()
    .max(30, 'El número de serie del ATA no puede superar 30 caracteres')
    .nullable()
    .default(null),
});

/** Tipo inferido del esquema, para tipar el body ya validado. */
export type DispositivoValidado = z.infer<typeof esquemaDispositivo>;
