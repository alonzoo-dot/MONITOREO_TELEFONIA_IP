import { z } from 'zod';

// Esquema de los filtros del listado de incidencias.
// Los datos llegan por query string, asi que todo entra como texto y se coacciona.
// Zod aplica los valores por defecto de pagina y tamano cuando no vienen.
export const esquemaFiltrosIncidencias = z.object({
  // Rango de fechas sobre fecha_ocurrido. El frontend manda fechas concretas.
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
  // Tipo de evento exacto. Solo dos valores validos.
  tipo: z.enum(['CAIDA', 'RECUPERACION']).optional(),
  // Piso de la ubicacion del telefono.
  piso: z.coerce.number().int().positive().optional(),
  // Busqueda libre contra numero de ubicacion o MAC.
  busqueda: z.string().trim().min(1).optional(),
  // Interruptor que limita a caidas sin atender.
  soloPendientes: z
    .enum(['true', 'false'])
    .optional()
    .transform((valor) => valor === 'true'),
  // Paginacion por offset. Tope de tamano para proteger el servidor.
  pagina: z.coerce.number().int().positive().default(1),
  tamanoPagina: z.coerce.number().int().positive().max(200).default(50),
});

export type FiltrosIncidenciasValidados = z.infer<typeof esquemaFiltrosIncidencias>;

// El body es opcional. Sin cuerpo se trata como objeto vacio y se atiende sin observacion.
export const esquemaAtenderIncidencia = z
  .object({
    descripcion_falla: z.string().trim().max(1000).optional(),
  })
  .default({});

export type AtenderIncidenciaValidado = z.infer<typeof esquemaAtenderIncidencia>;