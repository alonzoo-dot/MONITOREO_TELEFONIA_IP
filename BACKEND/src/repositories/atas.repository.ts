import type { PoolClient } from 'pg';
import { consultarCon, ejecutarConsulta } from '../config/database';

/** Un ATA tal como vive en la base de datos. */
export interface Ata {
  id_ata: number;
  id_telefono: number;
  id_modelo_ata: number;
  mac: string;
  ip: string | null; // la escribe el monitoreo; null en este módulo
  numero_serie: string | null;
  activo: boolean;
}

/** Campos escribibles de un ATA, compartidos por el alta y la edición. */
export interface DatosAta {
  id_telefono: number;
  id_modelo_ata: number;
  mac: string;
  numero_serie: string | null;
}

/** Obtiene el ATA de un teléfono, o null si el teléfono no tiene ATA. */
export async function buscarPorTelefono(
  idTelefono: number,
  cliente?: PoolClient,
): Promise<Ata | null> {
  const resultado = await consultarCon<Ata>(
    cliente,
    `SELECT id_ata, id_telefono, id_modelo_ata, mac, ip, numero_serie, activo
       FROM atas
      WHERE id_telefono = $1`,
    [idTelefono],
  );
  return resultado.rows[0] ?? null;
}

/** Devuelve el id del teléfono cuyo ATA usa esa MAC, o null si está libre. */
export async function buscarIdTelefonoPorMac(
  mac: string,
  cliente?: PoolClient,
): Promise<number | null> {
  const resultado = await consultarCon<{ id_telefono: number }>(
    cliente,
    `SELECT id_telefono FROM atas WHERE mac = $1`,
    [mac],
  );
  const fila = resultado.rows[0] ?? null;
  return fila ? fila.id_telefono : null;
}

/** Inserta un ATA y devuelve su id generado. */
export async function crearAta(
  datos: DatosAta,
  cliente?: PoolClient,
): Promise<number> {
  const resultado = await consultarCon<{ id_ata: number }>(
    cliente,
    `INSERT INTO atas (id_telefono, id_modelo_ata, mac, numero_serie)
     VALUES ($1, $2, $3, $4)
     RETURNING id_ata`,
    [datos.id_telefono, datos.id_modelo_ata, datos.mac, datos.numero_serie],
  );
  return resultado.rows[0]!.id_ata;
}

/** Actualiza el ATA de un teléfono (identificado por su id_telefono). */
export async function actualizarAta(
  idTelefono: number,
  datos: DatosAta,
  cliente?: PoolClient,
): Promise<void> {
  await consultarCon(
    cliente,
    `UPDATE atas
        SET id_modelo_ata = $1,
            mac = $2,
            numero_serie = $3
      WHERE id_telefono = $4`,
    [datos.id_modelo_ata, datos.mac, datos.numero_serie, idTelefono],
  );
}

/** Baja lógica: marca como inactivo el ATA de un teléfono. */
export async function desactivarAta(
  idTelefono: number,
  cliente?: PoolClient,
): Promise<void> {
  await consultarCon(
    cliente,
    `UPDATE atas SET activo = false WHERE id_telefono = $1`,
    [idTelefono],
  );
}

/** Reactiva el ATA de un teléfono. */
export async function reactivarAta(
  idTelefono: number,
  cliente?: PoolClient,
): Promise<void> {
  await consultarCon(
    cliente,
    `UPDATE atas SET activo = true WHERE id_telefono = $1`,
    [idTelefono],
  );
}