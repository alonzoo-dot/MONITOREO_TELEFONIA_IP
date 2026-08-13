import { z } from 'zod';

/** Formato de dirección MAC: seis pares hex separados por ':' o '-'. */
const REGEX_MAC = /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/;

/**
 * Esquema de forma para crear o editar un dispositivo. Valida tipos, enums y
 * formato (no reglas de negocio: la coherencia por tipo vive en el servicio).
 */
export const esquemaDispositivo = z.object({
  ubicacion_nombre: z
    .string()
    .trim()
    .min(1, 'El nombre de la ubicación es obligatorio')
    .max(40, 'El nombre de la ubicación no puede superar 40 caracteres'),
  piso: z.number().int('El piso debe ser un número entero'),
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
    .max(30, 'El número de serie no puede superar 30 caracteres')
    .nullable()
    .default(null),
  mac: z
    .string()
    .trim()
    .regex(REGEX_MAC, 'El formato de la MAC no es válido')
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
