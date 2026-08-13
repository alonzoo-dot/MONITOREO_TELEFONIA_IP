import * as catalogosRepo from '../repositories/catalogos.repository';
import type {
  ModeloAta,
  ModeloTelefono,
  Departamento,
} from '../repositories/catalogos.repository';

/** Lista los modelos de ATA disponibles. */
export async function listarModelosAta(): Promise<ModeloAta[]> {
  return catalogosRepo.listarModelosAta();
}

/** Lista los modelos de teléfono disponibles. */
export async function listarModelosTelefono(): Promise<ModeloTelefono[]> {
  return catalogosRepo.listarModelosTelefono();
}

/** Lista los departamentos disponibles. */
export async function listarDepartamentos(): Promise<Departamento[]> {
  return catalogosRepo.listarDepartamentos();
}