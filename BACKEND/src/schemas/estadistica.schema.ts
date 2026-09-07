import { z } from 'zod'

// Valida que una cadena tenga formato ISO YYYY-MM-DD y represente una fecha real
const fechaIso = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD')
  .refine((valor) => !Number.isNaN(Date.parse(valor)), 'Fecha invalida')

// Campos de rango reutilizados por los esquemas del modulo
const camposRango = {
  desde: fechaIso.optional(),
  hasta: fechaIso.optional()
}

// desde no puede ser posterior a hasta (comparacion lexicografica valida para ISO)
const rangoCoherente = (datos: { desde?: string; hasta?: string }) =>
  !datos.desde || !datos.hasta || datos.desde <= datos.hasta

const mensajeRango = {
  message: 'La fecha desde no puede ser posterior a la fecha hasta',
  path: ['desde']
}

// Filtros para /resumen y /reporte
export const esquemaRangoFechas = z.object(camposRango).refine(rangoCoherente, mensajeRango)

// Filtros para /tendencia: rango mas granularidad temporal
export const esquemaFiltrosTendencia = z
  .object({
    ...camposRango,
    granularidad: z.enum(['dia', 'semana', 'mes']).default('dia')
  })
  .refine(rangoCoherente, mensajeRango)

export type RangoFechas = z.infer<typeof esquemaRangoFechas>
export type FiltrosTendencia = z.infer<typeof esquemaFiltrosTendencia>
