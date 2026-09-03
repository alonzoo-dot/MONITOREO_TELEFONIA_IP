import * as path from 'path';
import * as incidenciasRepo from '../repositories/incidencias.repository';
import type { FiltrosIncidencias, IncidenciaDetalle } from '../repositories/incidencias.repository';

// pdfmake 0.3.x se usa como objeto raiz. Se importa con require para el patron server-side.
// El tipado de @types/pdfmake apunta al default asi que usamos require con any controlado.
const pdfmake = require('pdfmake');

// Rutas a las fuentes Roboto que vienen dentro del paquete pdfmake.
const RAIZ_FUENTES = path.join(process.cwd(), 'node_modules', 'pdfmake', 'fonts', 'Roboto');
pdfmake.setFonts({
  Roboto: {
    normal: path.join(RAIZ_FUENTES, 'Roboto-Regular.ttf'),
    bold: path.join(RAIZ_FUENTES, 'Roboto-Medium.ttf'),
    italics: path.join(RAIZ_FUENTES, 'Roboto-Italic.ttf'),
    bolditalics: path.join(RAIZ_FUENTES, 'Roboto-MediumItalic.ttf'),
  },
});

// Formatea una fecha ISO a dd/mm/aaaa hh:mm.
function formatearFecha(valor: Date | string | null): string {
  if (!valor) return '-';
  const d = new Date(valor);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dia}/${mes}/${d.getFullYear()} ${hora}:${min}`;
}

// Formatea una fecha ISO a dd/mm/aaaa sin la hora. Para el periodo del encabezado.
function formatearSoloFecha(valor: Date | string): string {
  const d = new Date(valor);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${d.getFullYear()}`;
}

// Traduce los filtros aplicados a una linea legible para el encabezado del reporte.
function describirFiltros(filtros: FiltrosIncidencias): string {
  const partes: string[] = [];

  // Periodo segun las fechas concretas que eligio el usuario.
  if (filtros.desde && filtros.hasta) {
    partes.push(`Periodo del ${formatearSoloFecha(filtros.desde)} al ${formatearSoloFecha(filtros.hasta)}`);
  } else if (filtros.desde) {
    partes.push(`Desde el ${formatearSoloFecha(filtros.desde)}`);
  } else if (filtros.hasta) {
    partes.push(`Hasta el ${formatearSoloFecha(filtros.hasta)}`);
  } else {
    partes.push('Todo el historial');
  }

  if (filtros.soloPendientes) {
    partes.push('Solo pendientes (caidas sin atender)');
  }
  if (filtros.tipo === 'CAIDA') {
    partes.push('Solo caidas');
  } else if (filtros.tipo === 'RECUPERACION') {
    partes.push('Solo recuperaciones');
  }
  if (filtros.piso !== undefined) {
    partes.push(`Piso ${filtros.piso}`);
  }
  if (filtros.busqueda) {
    partes.push(`Busqueda: ${filtros.busqueda}`);
  }

  return `Filtros: ${partes.join('  -  ')}`;
}

// Construye la definicion del documento a partir de las filas.
function construirDefinicion(filas: IncidenciaDetalle[], filtros: FiltrosIncidencias) {
  const totalCaidas = filas.filter((f) => f.tipo_evento === 'CAIDA').length;
  const totalRecuperaciones = filas.filter((f) => f.tipo_evento === 'RECUPERACION').length;
  const totalPendientes = filas.filter((f) => f.pendiente).length;

  const encabezadoTabla = [
    { text: 'Fecha / hora', style: 'th' },
    { text: 'Habitacion', style: 'th' },
    { text: 'Piso', style: 'th' },
    { text: 'Tipo', style: 'th' },
    { text: 'IP registrada', style: 'th' },
    { text: 'Atendio', style: 'th' },
    { text: 'Observaciones', style: 'th' },
  ];

  const cuerpo = filas.map((f) => [
    formatearFecha(f.fecha_ocurrido),
    f.ubicacion_nombre,
    String(f.piso),
    f.tipo_evento === 'CAIDA' ? 'Caida' : 'Recuperacion',
    f.ip_registrada ?? '-',
    f.usuario_atendio ?? (f.pendiente ? 'Pendiente' : '-'),
    f.descripcion_falla ?? '-',
  ]);

  return {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [30, 40, 30, 40],
    content: [
      { text: 'Hotel Dreams Aventuras Riviera Maya', style: 'hotel' },
      { text: 'Reporte de incidencias', style: 'titulo' },
      { text: `Generado el ${formatearFecha(new Date())}`, style: 'sub' },
      { text: describirFiltros(filtros), style: 'filtros' },
      {
        style: 'resumen',
        text: `Total: ${filas.length}    Caidas: ${totalCaidas}    Recuperaciones: ${totalRecuperaciones}    Pendientes: ${totalPendientes}`,
      },
      {
        table: {
          headerRows: 1,
          widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', '*'],
          body: [encabezadoTabla, ...cuerpo],
        },
        layout: 'lightHorizontalLines',
      },
    ],
    styles: {
      hotel: { fontSize: 11, color: '#555555', margin: [0, 0, 0, 2] },
      titulo: { fontSize: 18, bold: true, margin: [0, 0, 0, 2] },
      sub: { fontSize: 9, color: '#888888', margin: [0, 0, 0, 10] },
      filtros: { fontSize: 9, italics: true, color: '#666666', margin: [0, 0, 0, 10] },
      resumen: { fontSize: 10, bold: true, margin: [0, 0, 0, 12] },
      th: { fontSize: 9, bold: true, color: '#333333' },
    },
    defaultStyle: { font: 'Roboto', fontSize: 9 },
  };
}

// Genera el PDF del reporte de incidencias como Buffer segun los filtros dados.
export async function generarReporteIncidencias(filtros: FiltrosIncidencias): Promise<Buffer> {
  const filas = await incidenciasRepo.listarIncidenciasSinPaginar(filtros);
  const definicion = construirDefinicion(filas, filtros);
  const doc = pdfmake.createPdf(definicion);
  return doc.getBuffer();
}
