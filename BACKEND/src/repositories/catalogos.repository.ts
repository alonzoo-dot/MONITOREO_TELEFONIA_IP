import { ejecutarConsulta } from '../config/database';

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

/** Lista todos los modelos de ATA, ordenados por modelo. */
export async function listarModelosAta(): Promise<ModeloAta[]> {
  const resultado = await ejecutarConsulta<ModeloAta>(
    `SELECT id_modelo_ata, modelo, marca, cantidad_puertos
       FROM modelos_ata
      ORDER BY modelo ASC`,
  );
  return resultado.rows;
}

/** Lista todos los modelos de teléfono, ordenados por modelo. */
export async function listarModelosTelefono(): Promise<ModeloTelefono[]> {
  const resultado = await ejecutarConsulta<ModeloTelefono>(
    `SELECT id_modelo_telefono, modelo, marca
       FROM modelos_telefono
      ORDER BY modelo ASC`,
  );
  return resultado.rows;
}

/** Lista todos los departamentos, ordenados por nombre. */
export async function listarDepartamentos(): Promise<Departamento[]> {
  const resultado = await ejecutarConsulta<Departamento>(
    `SELECT id_departamento, nombre
       FROM departamentos
      ORDER BY nombre ASC`,
  );
  return resultado.rows;
}