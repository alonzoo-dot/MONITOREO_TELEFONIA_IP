import { z } from 'zod';

/** Body para crear el primer administrador durante la configuracion inicial. */
export const esquemaSetup = z.object({
  usuario: z
    .string()
    .trim()
    .min(3, 'El usuario debe tener al menos 3 caracteres')
    .max(50, 'El usuario no puede superar 50 caracteres')
    .regex(/^\S+$/, 'El usuario no puede contener espacios'),
  nombre_completo: z
    .string()
    .trim()
    .min(3, 'El nombre completo debe tener al menos 3 caracteres')
    .max(120, 'El nombre completo no puede superar 120 caracteres'),
  password: z
    .string()
    .min(8, 'La contrasena debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La contrasena debe tener al menos una letra mayuscula')
    .regex(/[0-9]/, 'La contrasena debe tener al menos un numero'),
});

/** Tipo inferido del esquema para tipar el body ya validado. */
export type SetupValidado = z.infer<typeof esquemaSetup>;
