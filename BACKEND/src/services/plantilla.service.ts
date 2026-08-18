import * as ExcelJS from 'exceljs';
import * as catalogosRepo from '../repositories/catalogos.repository';

/** Encabezados de la hoja de datos, en el orden que el importador espera. */
const COLUMNAS = [
  'ubicacion',
  'piso',
  'tipo_ubicacion',
  'tipo',
  'extension',
  'modelo_telefono',
  'serie_telefono',
  'mac',
  'ip',
  'modelo_ata',
  'serie_ata',
];

/**
 * Genera la plantilla de importación como un Buffer .xlsx.
 * Incluye la hoja "Inventario" (encabezados + una fila de ejemplo) y la hoja
 * "Referencia" con los valores válidos que el administrador puede usar.
 */
export async function generarPlantilla(): Promise<Buffer> {
  const libro = new ExcelJS.Workbook();
  libro.creator = 'Sistema de Monitoreo de Telefonía IP';
  libro.created = new Date();

  // ===== Hoja 1: Inventario (donde el admin llena los datos) =====
  const hoja = libro.addWorksheet('Inventario');
  hoja.addRow(COLUMNAS);

  // Estilo de encabezados
  const encabezado = hoja.getRow(1);
  encabezado.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  encabezado.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' },
  };
  encabezado.alignment = { horizontal: 'center' };

  // Fila de ejemplo para orientar (el admin la reemplaza)
  hoja.addRow([
    '305',
    3,
    'HABITACION',
    'ATA',
    '3305',
    'GRP2601',
    'SN-EJEMPLO-TEL',
    '00:0B:82:00:00:00',
    '10.81.20.11',
    'HT802',
    'SN-EJEMPLO-ATA',
  ]);

  // Anchos de columna
  const anchos = [14, 6, 16, 10, 11, 18, 16, 20, 14, 14, 16];
  anchos.forEach((ancho, i) => {
    hoja.getColumn(i + 1).width = ancho;
  });

  // ===== Hoja 2: Referencia (valores válidos) =====
  const ref = libro.addWorksheet('Referencia');
  ref.getColumn(1).width = 26;
  ref.getColumn(2).width = 26;

  function titulo(texto: string): void {
    const fila = ref.addRow([texto]);
    fila.font = { bold: true, color: { argb: 'FF2563EB' } };
  }

  titulo('Tipos de dispositivo válidos');
  ref.addRow(['ATA', 'Teléfono con adaptador ATA (requiere mac, ip y modelo_ata)']);
  ref.addRow(['IP', 'Teléfono IP nativo (requiere mac e ip, sin modelo_ata)']);
  ref.addRow(['ANALOGO', 'Teléfono analógico (sin mac, ip ni modelo_ata)']);
  ref.addRow([]);

  titulo('Rangos de IP válidos (columna ip)');
  ref.addRow(['10.81.20.0/24']);
  ref.addRow(['10.81.21.0/24']);
  ref.addRow([]);

  titulo('Tipos de ubicación válidos');
  ref.addRow(['HABITACION']);
  ref.addRow(['DEPARTAMENTO']);
  ref.addRow([]);

  // Modelos de teléfono válidos (desde el catálogo)
  const modelosTel = await catalogosRepo.listarModelosTelefono();
  titulo('Modelos de teléfono válidos (columna modelo_telefono)');
  ref.addRow(['Modelo', 'Marca']);
  modelosTel.forEach((m) => ref.addRow([m.modelo, m.marca]));
  ref.addRow([]);

  // Modelos de ATA válidos (desde el catálogo)
  const modelosAta = await catalogosRepo.listarModelosAta();
  titulo('Modelos de ATA válidos (columna modelo_ata)');
  ref.addRow(['Modelo', 'Marca', 'Puertos']);
  modelosAta.forEach((m) => ref.addRow([m.modelo, m.marca, m.cantidad_puertos]));

  // exceljs devuelve un ArrayBuffer-like; lo normalizamos a Buffer de Node.
  const datos = await libro.xlsx.writeBuffer();
  return Buffer.from(datos as ArrayBuffer);
}