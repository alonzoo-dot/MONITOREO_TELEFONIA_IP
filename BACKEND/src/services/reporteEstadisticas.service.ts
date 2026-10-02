import * as path from 'path'
import {
  generarResumen,
  generarFotoActual,
  generarTendencia
} from './estadisticas.service'
import type {
  RespuestaResumen,
  RespuestaFotoActual,
  RespuestaTendencia
} from './estadisticas.service'

// pdfmake 0.3.x se usa como objeto raiz. Se importa con require para el patron server-side.
// El tipado de @types/pdfmake apunta al default asi que usamos require con any controlado.
const pdfmake = require('pdfmake')

// Rutas a las fuentes Roboto que vienen dentro del paquete pdfmake.
const RAIZ_FUENTES = path.join(process.cwd(), 'node_modules', 'pdfmake', 'fonts', 'Roboto')
pdfmake.setFonts({
  Roboto: {
    normal: path.join(RAIZ_FUENTES, 'Roboto-Regular.ttf'),
    bold: path.join(RAIZ_FUENTES, 'Roboto-Medium.ttf'),
    italics: path.join(RAIZ_FUENTES, 'Roboto-Italic.ttf'),
    bolditalics: path.join(RAIZ_FUENTES, 'Roboto-MediumItalic.ttf')
  }
})

type Celda = string | { text: string; colSpan?: number; alignment?: string; style?: string }

// Formatea una fecha a dd/mm/aaaa hh:mm
function formatearFecha(valor: Date): string {
  const dia = String(valor.getDate()).padStart(2, '0')
  const mes = String(valor.getMonth() + 1).padStart(2, '0')
  const hora = String(valor.getHours()).padStart(2, '0')
  const min = String(valor.getMinutes()).padStart(2, '0')
  return `${dia}/${mes}/${valor.getFullYear()} ${hora}:${min}`
}

// Formatea una fecha ISO YYYY-MM-DD a dd/mm/aaaa
function formatearSoloFecha(valor: string): string {
  const [anio, mes, dia] = valor.split('-')
  return `${dia}/${mes}/${anio}`
}

// Describe el periodo del reporte segun las fechas dadas
function describirPeriodo(desde: string | null, hasta: string | null): string {
  if (!desde || !hasta) {
    return 'Todo el historial'
  }
  return `Periodo del ${formatearSoloFecha(desde)} al ${formatearSoloFecha(hasta)}`
}

// Arma el cuerpo de una tabla o una fila unica de aviso si no hay datos
function filasOAviso(filas: string[][], columnas: number): Celda[][] {
  if (filas.length === 0) {
    const aviso: Celda[] = [{ text: 'Sin datos en el periodo', colSpan: columnas, alignment: 'center' }]
    for (let i = 1; i < columnas; i++) {
      aviso.push('')
    }
    return [aviso]
  }
  return filas
}

// Construye el bloque de titulo mas tabla para una seccion del reporte
function construirTabla(titulo: string, encabezados: string[], filas: string[][], anchos: string[]) {
  return [
    { text: titulo, style: 'seccion' },
    {
      table: {
        headerRows: 1,
        widths: anchos,
        body: [encabezados.map((texto) => ({ text: texto, style: 'th' })), ...filasOAviso(filas, encabezados.length)]
      },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 12]
    }
  ]
}

// Construye la definicion del documento a partir de los datos ya obtenidos
function construirDefinicion(
  resumen: RespuestaResumen,
  fotoActual: RespuestaFotoActual,
  tendencia: RespuestaTendencia,
  desde: string | undefined,
  hasta: string | undefined
) {
  const totalCaidas = tendencia.puntos.reduce((acumulado, punto) => acumulado + punto.caidas, 0)
  const promedio = resumen.tiempoAtencion.promedioMinutos
  const mediana = resumen.tiempoAtencion.medianaMinutos

  return {
    pageSize: 'A4',
    pageMargins: [30, 40, 30, 40],
    content: [
      { text: 'Reporte de Estadisticas de Telefonia IP', style: 'titulo' },
      { text: describirPeriodo(desde ?? null, hasta ?? null), style: 'filtros' },
      { text: `Generado el ${formatearFecha(new Date())}`, style: 'sub' },
      {
        style: 'resumen',
        text: `Total de caidas: ${totalCaidas}    Atendidas: ${resumen.tiempoAtencion.atendidas}    Promedio (min): ${promedio ?? '-'}    Mediana (min): ${mediana ?? '-'}`
      },
      ...construirTabla(
        'Foto actual',
        ['Total', 'Online', 'Offline', 'Mantenimiento', 'Desconocido'],
        [[
          String(fotoActual.total),
          String(fotoActual.online),
          String(fotoActual.offline),
          String(fotoActual.mantenimiento),
          String(fotoActual.desconocido)
        ]],
        ['*', '*', '*', '*', '*']
      ),
      ...construirTabla(
        'Top 10 dispositivos',
        ['Extension', 'Ubicacion', 'Tipo', 'Caidas'],
        resumen.topDispositivos
          .slice(0, 10)
          .map((fila) => [fila.extension, fila.ubicacion, fila.tipoUbicacion, String(fila.caidas)]),
        ['auto', '*', '*', 'auto']
      ),
      ...construirTabla(
        'Distribucion por piso',
        ['Piso', 'Caidas'],
        resumen.distribucionPiso.map((fila) => [fila.piso, String(fila.caidas)]),
        ['*', 'auto']
      ),
      ...construirTabla(
        'Distribucion por modelo',
        ['Modelo', 'Caidas'],
        resumen.distribucionModelo.map((fila) => [fila.modelo, String(fila.caidas)]),
        ['*', 'auto']
      ),
      ...construirTabla(
        'Distribucion por tipo de ubicacion',
        ['Tipo', 'Caidas'],
        resumen.distribucionTipoUbicacion.map((fila) => [fila.tipoUbicacion, String(fila.caidas)]),
        ['*', 'auto']
      ),
      ...construirTabla(
        'Carga por usuario',
        ['Usuario', 'Atendidas'],
        resumen.cargaUsuarios.map((fila) => [fila.usuario, String(fila.atendidas)]),
        ['*', 'auto']
      )
    ],
    styles: {
      titulo: { fontSize: 18, bold: true, margin: [0, 0, 0, 2] },
      sub: { fontSize: 9, color: '#888888', margin: [0, 0, 0, 10] },
      filtros: { fontSize: 9, italics: true, color: '#666666', margin: [0, 0, 0, 2] },
      resumen: { fontSize: 10, bold: true, margin: [0, 0, 0, 12] },
      seccion: { fontSize: 12, bold: true, margin: [0, 6, 0, 6] },
      th: { fontSize: 9, bold: true, color: '#333333' }
    },
    defaultStyle: { font: 'Roboto', fontSize: 9 }
  }
}

// Genera el PDF del reporte de estadisticas como Buffer segun el rango dado
export async function generarReporteEstadisticas(desde?: string, hasta?: string): Promise<Buffer> {
  const [resumen, fotoActual, tendencia] = await Promise.all([
    generarResumen(desde, hasta),
    generarFotoActual(),
    generarTendencia(desde, hasta, 'dia')
  ])

  const definicion = construirDefinicion(resumen, fotoActual, tendencia, desde, hasta)
  const doc = pdfmake.createPdf(definicion)
  return doc.getBuffer()
}
