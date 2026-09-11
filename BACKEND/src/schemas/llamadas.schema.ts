import { z } from 'zod';

/** Body para marcar desde un telefono IP nativo hacia una extension destino. */
export const esquemaMarcar = z.object({
  idOrigen: z.number().int('El id de origen debe ser un numero entero').positive('El id de origen debe ser un numero positivo'),
  extensionDestino: z
    .string()
    .trim()
    .min(1, 'La extension de destino es obligatoria')
    .max(10, 'La extension de destino no puede superar 10 caracteres'),
});

/** Tipo inferido del esquema para tipar el body ya validado. */
export type MarcarValidado = z.infer<typeof esquemaMarcar>;

/** Body para hacer timbrar un telefono usando un softphone SIP con credenciales propias. */
export const esquemaHacerTimbrar = z.object({
  extensionOrigen: z.string().trim().min(1, 'La extension de origen es obligatoria'),
  usuarioSip: z.string().trim().min(1, 'El usuario SIP es obligatorio'),
  passwordSip: z.string().min(1, 'La contrasena SIP es obligatoria'),
  extensionDestino: z
    .string()
    .trim()
    .min(1, 'La extension de destino es obligatoria')
    .max(10, 'La extension de destino no puede superar 10 caracteres'),
});

/** Tipo inferido del esquema para tipar el body ya validado. */
export type HacerTimbrarValidado = z.infer<typeof esquemaHacerTimbrar>;
