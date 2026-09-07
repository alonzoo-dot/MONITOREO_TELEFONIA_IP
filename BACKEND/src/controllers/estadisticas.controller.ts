import type { Request, Response } from 'express'
import { esquemaFiltrosTendencia, esquemaRangoFechas } from '../schemas/estadistica.schema'
import { generarTendencia, generarResumen, generarFotoActual } from '../services/estadisticas.service'
import { generarReporteEstadisticas } from '../services/reporteEstadisticas.service'

// GET /api/estadisticas/tendencia serie temporal de caidas por periodo
export async function obtenerTendencia(peticion: Request, respuesta: Response): Promise<void> {
  const parseo = esquemaFiltrosTendencia.safeParse(peticion.query)
  if (!parseo.success) {
    const errores = parseo.error.issues.map((problema) => ({
      campo: problema.path.join('.'),
      detalle: problema.message,
    }))
    respuesta.status(400).json({ mensaje: 'Filtros invalidos', errores })
    return
  }

  try {
    const resultado = await generarTendencia(parseo.data.desde, parseo.data.hasta, parseo.data.granularidad)
    respuesta.status(200).json(resultado)
  } catch (error: unknown) {
    console.error('Error inesperado al generar la tendencia de estadisticas:', error)
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// GET /api/estadisticas/resumen metricas agregadas del rango
export async function obtenerResumen(peticion: Request, respuesta: Response): Promise<void> {
  const parseo = esquemaRangoFechas.safeParse(peticion.query)
  if (!parseo.success) {
    const errores = parseo.error.issues.map((problema) => ({
      campo: problema.path.join('.'),
      detalle: problema.message,
    }))
    respuesta.status(400).json({ mensaje: 'Filtros invalidos', errores })
    return
  }

  try {
    const resultado = await generarResumen(parseo.data.desde, parseo.data.hasta)
    respuesta.status(200).json(resultado)
  } catch (error: unknown) {
    console.error('Error inesperado al generar el resumen de estadisticas:', error)
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// GET /api/estadisticas/foto-actual estado actual de la red sin parametros
export async function obtenerFotoActual(_peticion: Request, respuesta: Response): Promise<void> {
  try {
    const resultado = await generarFotoActual()
    respuesta.status(200).json(resultado)
  } catch (error: unknown) {
    console.error('Error inesperado al generar la foto actual de estadisticas:', error)
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

// GET /api/estadisticas/reporte genera un PDF con las estadisticas del rango
export async function obtenerReporte(peticion: Request, respuesta: Response): Promise<void> {
  const parseo = esquemaRangoFechas.safeParse(peticion.query)
  if (!parseo.success) {
    const errores = parseo.error.issues.map((problema) => ({
      campo: problema.path.join('.'),
      detalle: problema.message,
    }))
    respuesta.status(400).json({ mensaje: 'Filtros invalidos', errores })
    return
  }

  try {
    const pdf = await generarReporteEstadisticas(parseo.data.desde, parseo.data.hasta)
    respuesta.setHeader('Content-Type', 'application/pdf')
    respuesta.setHeader('Content-Disposition', 'attachment; filename="reporte-estadisticas.pdf"')
    respuesta.status(200).send(pdf)
  } catch (error: unknown) {
    console.error('Error inesperado al generar el reporte de estadisticas:', error)
    respuesta.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}
