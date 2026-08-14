import { z } from 'zod';

/** Esquema para crear/editar un modelo de ATA. */
export const esquemaModeloAta = z.object({
  modelo: z
    .string()
    .trim()
    .min(1, 'El modelo es obligatorio')
    .max(30, 'El modelo no puede superar 30 caracteres'),
  marca: z
    .string()
    .trim()
    .min(1, 'La marca es obligatoria')
    .max(40, 'La marca no puede superar 40 caracteres'),
  cantidad_puertos: z
    .number()
    .int('La cantidad de puertos debe ser un número entero')
    .positive('La cantidad de puertos debe ser mayor a cero'),
});

/** Esquema para crear/editar un modelo de teléfono. */
export const esquemaModeloTelefono = z.object({
  modelo: z
    .string()
    .trim()
    .min(1, 'El modelo es obligatorio')
    .max(40, 'El modelo no puede superar 40 caracteres'),
  marca: z
    .string()
    .trim()
    .min(1, 'La marca es obligatoria')
    .max(40, 'La marca no puede superar 40 caracteres'),
});

/** Esquema para crear/editar un departamento. */
export const esquemaDepartamento = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(50, 'El nombre no puede superar 50 caracteres'),
});
