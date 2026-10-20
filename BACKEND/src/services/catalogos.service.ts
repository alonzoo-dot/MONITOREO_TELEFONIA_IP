import { ejecutarEnTransaccion } from '../config/database';
import * as catalogosRepo from '../repositories/catalogos.repository';
import type {
  ModeloAta,
  ModeloTelefono,
  Departamento,
  DatosModeloAta,
  DatosModeloTelefono,
  DatosDepartamento,
} from '../repositories/catalogos.repository';

/** Error de negocio de catálogos, con un código para traducir a HTTP. */
export class ErrorCatalogos extends Error {
  constructor(
    public readonly codigo: string,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = 'ErrorCatalogos';
  }
}

/* ===================== Lecturas ===================== */

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

/* ===================== Modelos de ATA ===================== */

/** Crea un modelo de ATA, verificando que el nombre no exista. */
export async function crearModeloAta(datos: DatosModeloAta): Promise<number> {
  const existente = await catalogosRepo.buscarIdModeloAtaPorNombre(datos.modelo);
  if (existente !== null) {
    throw new ErrorCatalogos('MODELO_DUPLICADO', `El modelo de ATA "${datos.modelo}" ya existe.`);
  }
  return catalogosRepo.crearModeloAta(datos);
}

/** Edita un modelo de ATA, verificando que el nombre no choque con otro. */
export async function actualizarModeloAta(
  idModeloAta: number,
  datos: DatosModeloAta,
): Promise<void> {
  const duenoNombre = await catalogosRepo.buscarIdModeloAtaPorNombre(datos.modelo);
  if (duenoNombre !== null && duenoNombre !== idModeloAta) {
    throw new ErrorCatalogos('MODELO_DUPLICADO', `El modelo de ATA "${datos.modelo}" ya existe.`);
  }
  await catalogosRepo.actualizarModeloAta(idModeloAta, datos);
}

/* ===================== Modelos de teléfono ===================== */

/** Crea un modelo de teléfono, verificando que el nombre no exista. */
export async function crearModeloTelefono(datos: DatosModeloTelefono): Promise<number> {
  const existente = await catalogosRepo.buscarIdModeloTelefonoPorNombre(datos.modelo);
  if (existente !== null) {
    throw new ErrorCatalogos(
      'MODELO_DUPLICADO',
      `El modelo de teléfono "${datos.modelo}" ya existe.`,
    );
  }
  return catalogosRepo.crearModeloTelefono(datos);
}

/** Edita un modelo de teléfono, verificando que el nombre no choque con otro. */
export async function actualizarModeloTelefono(
  idModeloTelefono: number,
  datos: DatosModeloTelefono,
): Promise<void> {
  const duenoNombre = await catalogosRepo.buscarIdModeloTelefonoPorNombre(datos.modelo);
  if (duenoNombre !== null && duenoNombre !== idModeloTelefono) {
    throw new ErrorCatalogos(
      'MODELO_DUPLICADO',
      `El modelo de teléfono "${datos.modelo}" ya existe.`,
    );
  }
  await catalogosRepo.actualizarModeloTelefono(idModeloTelefono, datos);
}

/* ===================== Departamentos ===================== */

/** Crea un departamento (la unicidad del nombre la protege la base de datos). */
export async function crearDepartamento(datos: DatosDepartamento): Promise<number> {
  return catalogosRepo.crearDepartamento(datos);
}

/** Edita un departamento. */
export async function actualizarDepartamento(
  idDepartamento: number,
  datos: DatosDepartamento,
): Promise<void> {
  await catalogosRepo.actualizarDepartamento(idDepartamento, datos);
}

/* ===================== Borrado ===================== */

/** Indica si el error es una violacion de llave foranea de PostgreSQL (23503). */
function esErrorLlaveForanea(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === '23503'
  );
}

/** Elimina un modelo de telefono si ningun telefono lo usa. */
export async function eliminarModeloTelefono(idModeloTelefono: number): Promise<void> {
  try {
    await ejecutarEnTransaccion(async (cliente) => {
      const enUso = await catalogosRepo.contarTelefonosPorModelo(idModeloTelefono, cliente);
      if (enUso > 0) {
        throw new ErrorCatalogos(
          'EN_USO',
          `No se puede eliminar el modelo de teléfono: lo usan ${enUso} teléfono(s).`,
        );
      }
      const eliminado = await catalogosRepo.eliminarModeloTelefono(idModeloTelefono, cliente);
      if (!eliminado) {
        throw new ErrorCatalogos('NO_ENCONTRADO', 'El modelo de teléfono no existe.');
      }
    });
  } catch (error: unknown) {
    if (esErrorLlaveForanea(error)) {
      throw new ErrorCatalogos(
        'EN_USO',
        'No se puede eliminar el modelo de teléfono: tiene registros asociados.',
      );
    }
    throw error;
  }
}

/** Elimina un modelo de ATA si ningun ATA lo usa. */
export async function eliminarModeloAta(idModeloAta: number): Promise<void> {
  try {
    await ejecutarEnTransaccion(async (cliente) => {
      const enUso = await catalogosRepo.contarAtasPorModelo(idModeloAta, cliente);
      if (enUso > 0) {
        throw new ErrorCatalogos(
          'EN_USO',
          `No se puede eliminar el modelo de ATA: lo usan ${enUso} ATA(s).`,
        );
      }
      const eliminado = await catalogosRepo.eliminarModeloAta(idModeloAta, cliente);
      if (!eliminado) {
        throw new ErrorCatalogos('NO_ENCONTRADO', 'El modelo de ATA no existe.');
      }
    });
  } catch (error: unknown) {
    if (esErrorLlaveForanea(error)) {
      throw new ErrorCatalogos(
        'EN_USO',
        'No se puede eliminar el modelo de ATA: tiene registros asociados.',
      );
    }
    throw error;
  }
}

/** Elimina un departamento si ninguna incidencia lo referencia. */
export async function eliminarDepartamento(idDepartamento: number): Promise<void> {
  try {
    await ejecutarEnTransaccion(async (cliente) => {
      const enUso = await catalogosRepo.contarIncidenciasPorDepartamento(idDepartamento, cliente);
      if (enUso > 0) {
        throw new ErrorCatalogos(
          'EN_USO',
          `No se puede eliminar el departamento: tiene ${enUso} incidencia(s) asociada(s).`,
        );
      }
      const eliminado = await catalogosRepo.eliminarDepartamento(idDepartamento, cliente);
      if (!eliminado) {
        throw new ErrorCatalogos('NO_ENCONTRADO', 'El departamento no existe.');
      }
    });
  } catch (error: unknown) {
    if (esErrorLlaveForanea(error)) {
      throw new ErrorCatalogos(
        'EN_USO',
        'No se puede eliminar el departamento: tiene registros asociados.',
      );
    }
    throw error;
  }
}
