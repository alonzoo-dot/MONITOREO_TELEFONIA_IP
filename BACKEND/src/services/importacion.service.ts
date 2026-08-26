import * as ExcelJS from 'exceljs';
import * as inventarioService from './inventario.service';
import { ErrorInventario } from './inventario.service';
import type { DatosDispositivo, TipoDispositivo } from './inventario.service';
import * as catalogosRepo from '../repositories/catalogos.repository';
import { esquemaDispositivo } from '../schemas/dispositivo.schema';

/** Un error de importación asociado a una fila del archivo. */
export interface ErrorFila {
  fila: number;
  mensaje: string;
}

/** Resultado de una importación: totales y errores por fila. */
export interface ReporteImportacion {
  total: number;
  creados: number;
  errores: ErrorFila[];
}

/** Encabezados esperados en la fila 1 de la plantilla, en orden. */
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
] as const;

/** Traduce el 'tipo' de la plantilla (ATA/IP/ANALOGO) al valor interno. */
const MAPA_TIPO: Record<string, TipoDispositivo> = {
  ATA: 'IP_ATA',
  IP: 'IP_NATIVO',
  ANALOGO: 'ANALOGICO',
};

/** Lee el valor de una celda como texto limpio, o cadena vacía. */
function texto(valor: ExcelJS.CellValue): string {
  if (valor === null || valor === undefined) return '';
  return String(valor).trim();
}

/**
 * Procesa un archivo .xlsx de inventario. Cada fila se valida y se crea de forma
 * independiente reutilizando crearDispositivo; los errores se acumulan por fila.
 */
export async function importarInventario(
  buffer: Buffer,
): Promise<ReporteImportacion> {
  const libro = new ExcelJS.Workbook();
 await libro.xlsx.load(buffer as unknown as ArrayBuffer);

  const hoja = libro.worksheets[0];
  if (!hoja) {
    throw new ErrorInventario('ARCHIVO_INVALIDO', 'El archivo no contiene ninguna hoja.');
  }

  // Cachés de catálogos para resolver modelos por nombre (nombre -> id)
  const modelosTel = await catalogosRepo.listarModelosTelefono();
  const modelosAta = await catalogosRepo.listarModelosAta();
  const mapaTel = new Map(modelosTel.map((m) => [m.modelo.toUpperCase(), m.id_modelo_telefono]));
  const mapaAta = new Map(modelosAta.map((m) => [m.modelo.toUpperCase(), m.id_modelo_ata]));

  const errores: ErrorFila[] = [];
  let total = 0;
  let creados = 0;

  // Recorre desde la fila 2 (la 1 son encabezados)
  const filas = hoja.getRows(2, hoja.rowCount) ?? [];

  // Índice de la columna 'ip' dentro de COLUMNAS, para la pasada previa de duplicados.
  const indiceColumnaIp = COLUMNAS.indexOf('ip');

  // Pasada previa: detectar IPs duplicadas entre filas del propio archivo.
  const conteoIps = new Map<string, number[]>(); // ip → números de fila (1-based del Excel)
  for (const fila of filas) {
    const valores = COLUMNAS.map((_, i) => texto(fila.getCell(i + 1).value));
    if (valores.every((v) => v === '')) continue;

    const ip = valores[indiceColumnaIp];
    if (!ip) continue;
    if (!conteoIps.has(ip)) conteoIps.set(ip, []);
    conteoIps.get(ip)!.push(fila.number);
  }

  const filasDuplicadasInternas = new Map<number, string>(); // número de fila → ip
  for (const [ip, numerosFila] of conteoIps.entries()) {
    if (numerosFila.length > 1) {
      for (const numeroFila of numerosFila) {
        filasDuplicadasInternas.set(numeroFila, ip);
      }
    }
  }

  for (const fila of filas) {
    // Saltar filas completamente vacías
    const valores = COLUMNAS.map((_, i) => texto(fila.getCell(i + 1).value));
    if (valores.every((v) => v === '')) continue;

    total += 1;
    const numeroFila = fila.number;

    const ipDuplicada = filasDuplicadasInternas.get(numeroFila);
    if (ipDuplicada !== undefined) {
      const filasImplicadas = conteoIps.get(ipDuplicada)!;
      errores.push({
        fila: numeroFila,
        mensaje: `La IP ${ipDuplicada} está duplicada en el archivo (fila ${filasImplicadas.join(', fila ')})`,
      });
      continue;
    }

    try {
      const datos = construirDatos(valores, mapaTel, mapaAta);

      const validacionForma = esquemaDispositivo.safeParse(datos);
      if (!validacionForma.success) {
        throw new Error(validacionForma.error.issues[0]?.message ?? 'Datos inválidos.');
      }

      await inventarioService.crearDispositivo(datos);
      creados += 1;
    } catch (error: unknown) {
      const mensaje =
        error instanceof ErrorInventario
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Error desconocido';
      errores.push({ fila: numeroFila, mensaje });
    }
  }

  return { total, creados, errores };
}

/**
 * Construye el objeto DatosDispositivo a partir de los valores de una fila.
 * Lanza ErrorInventario si algún dato de forma es inválido (tipo, modelo, etc.).
 */
function construirDatos(
  valores: string[],
  mapaTel: Map<string, number>,
  mapaAta: Map<string, number>,
): DatosDispositivo {
  const [
    ubicacion,
    pisoTexto,
    tipoUbicacion,
    tipoTexto,
    extension,
    modeloTelefono,
    serieTelefono,
    mac,
    ip,
    modeloAta,
    serieAta,
  ] = valores;

  // Tipo
  const tipo = MAPA_TIPO[tipoTexto.toUpperCase()];
  if (!tipo) {
    throw new ErrorInventario(
      'TIPO_INVALIDO',
      `Tipo "${tipoTexto}" inválido. Usa ATA, IP o ANALOGO.`,
    );
  }

  // Piso
  const piso = Number(pisoTexto);
  if (!Number.isInteger(piso)) {
    throw new ErrorInventario('PISO_INVALIDO', `El piso "${pisoTexto}" no es un número entero.`);
  }

  // Tipo de ubicación
  const tipoUbic = tipoUbicacion.toUpperCase();
  if (tipoUbic !== 'HABITACION' && tipoUbic !== 'DEPARTAMENTO') {
    throw new ErrorInventario(
      'TIPO_UBICACION_INVALIDO',
      `Tipo de ubicación "${tipoUbicacion}" inválido. Usa HABITACION o DEPARTAMENTO.`,
    );
  }

  // Modelo de teléfono (resolver por nombre)
  const idModeloTelefono = mapaTel.get(modeloTelefono.toUpperCase());
  if (idModeloTelefono === undefined) {
    throw new ErrorInventario(
      'MODELO_TELEFONO_INEXISTENTE',
      `El modelo de teléfono "${modeloTelefono}" no existe en el catálogo.`,
    );
  }

  // Modelo de ATA (solo si tipo ATA)
  let idModeloAta: number | null = null;
  if (tipo === 'IP_ATA') {
    if (!modeloAta) {
      throw new ErrorInventario(
        'MODELO_ATA_REQUERIDO',
        'Un dispositivo ATA requiere un modelo de ATA.',
      );
    }
    const id = mapaAta.get(modeloAta.toUpperCase());
    if (id === undefined) {
      throw new ErrorInventario(
        'MODELO_ATA_INEXISTENTE',
        `El modelo de ATA "${modeloAta}" no existe en el catálogo.`,
      );
    }
    idModeloAta = id;
  }

  return {
    ubicacion_nombre: ubicacion,
    piso,
    tipo_ubicacion: tipoUbic,
    id_modelo_telefono: idModeloTelefono,
    extension,
    tipo,
    numero_serie: serieTelefono || null,
    mac: mac || null,
    ip: ip || null,
    id_modelo_ata: idModeloAta,
    ata_numero_serie: tipo === 'IP_ATA' ? serieAta || null : null,
  };
}