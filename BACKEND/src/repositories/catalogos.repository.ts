import type { PoolClient } from 'pg';
import { consultarCon, ejecutarConsulta } from '../config/database';

/** Un modelo de ATA del catálogo. */
export interface ModeloAta {
  id_modelo_ata: number;
  modelo: string;
  marca: string;
  cantidad_puertos: number;
}

/** Un modelo de teléfono del catálogo. */
export interface ModeloTelefono {
  id_modelo_telefono: number;
  modelo: string;
  marca: string;
}

/** Un departamento del catálogo. */
export interface Departamento {
  id_departamento: number;
  nombre: string;
}

/** Datos escribibles de un modelo de ATA. */
export interface DatosModeloAta {
  modelo: string;
  marca: string;
  cantidad_puertos: number;
}

/** Datos escribibles de un modelo de teléfono. */
export interface DatosModeloTelefono {
  modelo: string;
  marca: string;
}

/** Datos escribibles de un departamento. */
export interface DatosDepartamento {
  nombre: string;
}

/* ===================== Modelos de ATA ===================== */

/** Lista todos los modelos de ATA, ordenados por modelo. */
export async function listarModelosAta(): Promise<ModeloAta[]> {
  const resultado = await ejecutarConsulta<ModeloAta>(
    `SELECT id_modelo_ata, modelo, marca, cantidad_puertos
       FROM modelos_ata
      ORDER BY modelo ASC`,
  );
  return resultado.rows;
}

/** Devuelve el id del modelo de ATA con ese nombre, o null si no existe. */
export async function buscarIdModeloAtaPorNombre(
  modelo: string,
  cliente?: PoolClient,
): Promise<number | null> {
  const resultado = await consultarCon<{ id_modelo_ata: number }>(
    cliente,
    `SELECT id_modelo_ata FROM modelos_ata WHERE modelo = $1`,
    [modelo],
  );
  const fila = resultado.rows[0] ?? null;
  return fila ? fila.id_modelo_ata : null;
}

/** Inserta un modelo de ATA y devuelve su id generado. */
export async function crearModeloAta(datos: DatosModeloAta): Promise<number> {
  const resultado = await ejecutarConsulta<{ id_modelo_ata: number }>(
    `INSERT INTO modelos_ata (modelo, marca, cantidad_puertos)
     VALUES ($1, $2, $3)
     RETURNING id_modelo_ata`,
    [datos.modelo, datos.marca, datos.cantidad_puertos],
  );
  return resultado.rows[0]!.id_modelo_ata;
}

/** Actualiza un modelo de ATA existente. */
export async function actualizarModeloAta(
  idModeloAta: number,
  datos: DatosModeloAta,
): Promise<void> {
  await ejecutarConsulta(
    `UPDATE modelos_ata
        SET modelo = $1, marca = $2, cantidad_puertos = $3
      WHERE id_modelo_ata = $4`,
    [datos.modelo, datos.marca, datos.cantidad_puertos, idModeloAta],
  );
}

/* ===================== Modelos de teléfono ===================== */

/** Lista todos los modelos de teléfono, ordenados por modelo. */
export async function listarModelosTelefono(): Promise<ModeloTelefono[]> {
  const resultado = await ejecutarConsulta<ModeloTelefono>(
    `SELECT id_modelo_telefono, modelo, marca
       FROM modelos_telefono
      ORDER BY modelo ASC`,
  );
  return resultado.rows;
}

/** Devuelve el id del modelo de teléfono con ese nombre, o null si no existe. */
export async function buscarIdModeloTelefonoPorNombre(
  modelo: string,
  cliente?: PoolClient,
): Promise<number | null> {
  const resultado = await consultarCon<{ id_modelo_telefono: number }>(
    cliente,
    `SELECT id_modelo_telefono FROM modelos_telefono WHERE modelo = $1`,
    [modelo],
  );
  const fila = resultado.rows[0] ?? null;
  return fila ? fila.id_modelo_telefono : null;
}

/** Inserta un modelo de teléfono y devuelve su id generado. */
export async function crearModeloTelefono(datos: DatosModeloTelefono): Promise<number> {
  const resultado = await ejecutarConsulta<{ id_modelo_telefono: number }>(
    `INSERT INTO modelos_telefono (modelo, marca)
     VALUES ($1, $2)
     RETURNING id_modelo_telefono`,
    [datos.modelo, datos.marca],
  );
  return resultado.rows[0]!.id_modelo_telefono;
}

/** Actualiza un modelo de teléfono existente. */
export async function actualizarModeloTelefono(
  idModeloTelefono: number,
  datos: DatosModeloTelefono,
): Promise<void> {
  await ejecutarConsulta(
    `UPDATE modelos_telefono
        SET modelo = $1, marca = $2
      WHERE id_modelo_telefono = $3`,
    [datos.modelo, datos.marca, idModeloTelefono],
  );
}

/* ===================== Departamentos ===================== */

/** Lista todos los departamentos, ordenados por nombre. */
export async function listarDepartamentos(): Promise<Departamento[]> {
  const resultado = await ejecutarConsulta<Departamento>(
    `SELECT id_departamento, nombre
       FROM departamentos
      ORDER BY nombre ASC`,
  );
  return resultado.rows;
}

/** Inserta un departamento y devuelve su id generado. */
export async function crearDepartamento(datos: DatosDepartamento): Promise<number> {
  const resultado = await ejecutarConsulta<{ id_departamento: number }>(
    `INSERT INTO departamentos (nombre)
     VALUES ($1)
     RETURNING id_departamento`,
    [datos.nombre],
  );
  return resultado.rows[0]!.id_departamento;
}

/** Actualiza un departamento existente. */
export async function actualizarDepartamento(
  idDepartamento: number,
  datos: DatosDepartamento,
): Promise<void> {
  await ejecutarConsulta(
    `UPDATE departamentos SET nombre = $1 WHERE id_departamento = $2`,
    [datos.nombre, idDepartamento],
  );
}
