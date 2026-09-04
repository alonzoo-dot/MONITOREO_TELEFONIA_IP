import { Router } from 'express'
import { obtenerTendencia, obtenerResumen, obtenerFotoActual } from '../controllers/estadisticas.controller'
import { requiereAutenticacion } from '../middlewares/auth.middleware'
import { requiereRol } from '../middlewares/autorizacion.middleware'

const rutasEstadisticas = Router()

// Todas las rutas de estadisticas requieren usuario autenticado con rol ADMINISTRADOR o TECNICO
rutasEstadisticas.use(requiereAutenticacion)
rutasEstadisticas.use(requiereRol('ADMINISTRADOR', 'TECNICO'))

// GET /api/estadisticas/foto-actual estado actual de la red
rutasEstadisticas.get('/foto-actual', obtenerFotoActual)

// GET /api/estadisticas/tendencia serie temporal de caidas
rutasEstadisticas.get('/tendencia', obtenerTendencia)

// GET /api/estadisticas/resumen metricas agregadas del rango
rutasEstadisticas.get('/resumen', obtenerResumen)

export default rutasEstadisticas
