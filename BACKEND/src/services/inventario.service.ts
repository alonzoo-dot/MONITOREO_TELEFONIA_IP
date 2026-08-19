import type { PoolClient } from 'pg';
import { ejecutarEnTransaccion } from '../config/database';
import * as telefonosRepo from '../repositories/telefonos.repository';
import * as atasRepo from '../repositories/atas.repository';
import * as ubicacionesRepo from '../repositories/ubicaciones.repository';
import * as incidenciasRepo from '../repositories/incidencias.repository';
import type {
  DispositivoDetalle,
  FiltrosDispositivo,
} from '../repositories/telefonos.repository';

/** Los tres tipos de dispositivo admitidos. */
export type TipoDispositivo = 'IP_ATA' | 'IP_NATIVO' | 'ANALOGICO';

/** Error de negocio del módulo de inventario, con un código para traducir a HTTP. */
export class ErrorInventario extends Error {
  constructor(
    public readonly codigo: string,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = 'ErrorInventario';
  }
}

/** Datos que llegan desde el controlador para crear o editar un dispositivo. */
export interface DatosDispositivo {
  ubicacion_nombre: string;
  piso: number;
  tipo_ubicacion: string;
  id_modelo_telefono: number;
  extension: string;
  tipo: TipoDispositivo;
  numero_serie: string | null;
  mac: string | null;
  ip: string | null;
  // Solo para IP_ATA:
  id_modelo_ata: number | null;
  ata_numero_serie: string | null;
}

/**
 * Valida la coherencia entre el tipo del dispositivo y su MAC / modelo de ATA.
 * No consulta la base de datos: son reglas puras de forma.
 */
function validarCoherenciaPorTipo(datos: DatosDispositivo): void {
  if (datos.tipo === 'IP_ATA') {
    if (!datos.mac) {
      throw new ErrorInventario('MAC_REQUERIDA', 'Un dispositivo IP_ATA requiere MAC.');
    }
    if (datos.id_modelo_ata === null) {
      throw new ErrorInventario(
        'MODELO_ATA_REQUERIDO',
        'Un dispositivo IP_ATA requiere un modelo de ATA.',
      );
    }
    if (!datos.ip) {
      throw new ErrorInventario('IP_REQUERIDA', 'Un dispositivo IP_ATA requiere IP.');
    }
    if (!datos.ata_numero_serie) {
      throw new ErrorInventario(
        'SERIE_ATA_REQUERIDA',
        'Un dispositivo IP_ATA requiere el número de serie del ATA.',
      );
    }
  }

  if (datos.tipo === 'IP_NATIVO') {
    if (!datos.mac) {
      throw new ErrorInventario('MAC_REQUERIDA', 'Un dispositivo IP_NATIVO requiere MAC.');
    }
    if (!datos.ip) {
      throw new ErrorInventario('IP_REQUERIDA', 'Un dispositivo IP_NATIVO requiere IP.');
    }
  }

  if (datos.tipo === 'ANALOGICO') {
    if (datos.mac) {
      throw new ErrorInventario('MAC_NO_PERMITIDA', 'Un dispositivo ANALOGICO no admite MAC.');
    }
    if (datos.ip) {
      throw new ErrorInventario('IP_NO_PERMITIDA', 'Un dispositivo ANALOGICO no admite IP.');
    }
  }
}

/**
 * Verifica que la MAC no exista en telefonos ni en atas, salvo en el propio
 * dispositivo que se edita (idTelefonoActual). Lanza error si está duplicada.
 */
async function validarMacUnica(
  mac: string,
  idTelefonoActual: number | null,
  cliente: PoolClient,
): Promise<void> {
  const enTelefonos = await telefonosRepo.buscarIdPorMac(mac, cliente);
  const enAtas = await atasRepo.buscarIdTelefonoPorMac(mac, cliente);
  const duenoMac = enTelefonos ?? enAtas;

  if (duenoMac !== null && duenoMac !== idTelefonoActual) {
    throw new ErrorInventario('MAC_DUPLICADA', `La MAC ${mac} ya está registrada.`);
  }
}

/**
 * Verifica que la extensión no esté usada por otro dispositivo, salvo el propio
 * que se edita (idTelefonoActual). Lanza error si está duplicada.
 */
async function validarExtensionUnica(
  extension: string,
  idTelefonoActual: number | null,
  cliente: PoolClient,
): Promise<void> {
  const dueno = await telefonosRepo.buscarIdPorExtension(extension, cliente);
  if (dueno !== null && dueno !== idTelefonoActual) {
    throw new ErrorInventario(
      'EXTENSION_DUPLICADA',
      `La extensión ${extension} ya está en uso.`,
    );
  }
}

/**
 * Resuelve la ubicación por nombre: si ya existe la reutiliza, si no la crea.
 * Devuelve el id de la ubicación. Opera dentro de la transacción recibida.
 */
async function resolverUbicacion(
  datos: DatosDispositivo,
  cliente: PoolClient,
): Promise<number> {
  const existente = await ubicacionesRepo.buscarPorNombre(datos.ubicacion_nombre, cliente);
  if (existente) {
    return existente.id_ubicacion;
  }
  return ubicacionesRepo.crearUbicacion(
    {
      nombre: datos.ubicacion_nombre,
      piso: datos.piso,
      tipo_ubicacion: datos.tipo_ubicacion,
    },
    cliente,
  );
}

/** Da de alta un dispositivo completo de forma transaccional. Devuelve su detalle. */
export async function crearDispositivo(
  datos: DatosDispositivo,
): Promise<DispositivoDetalle> {
  validarCoherenciaPorTipo(datos);

  const idTelefono = await ejecutarEnTransaccion(async (cliente) => {
    await validarExtensionUnica(datos.extension, null, cliente);
    if (datos.mac) {
      await validarMacUnica(datos.mac, null, cliente);
    }

    const idUbicacion = await resolverUbicacion(datos, cliente);

    const nuevoIdTelefono = await telefonosRepo.crearTelefono(
      {
        id_ubicacion: idUbicacion,
        id_modelo_telefono: datos.id_modelo_telefono,
        extension: datos.extension,
        tipo: datos.tipo,
        numero_serie: datos.numero_serie,
        mac: datos.tipo === 'IP_NATIVO' ? datos.mac : null,
        ip: datos.tipo === 'IP_NATIVO' ? datos.ip : null,
      },
      cliente,
    );

    if (datos.tipo === 'IP_ATA') {
      await atasRepo.crearAta(
        {
          id_telefono: nuevoIdTelefono,
          id_modelo_ata: datos.id_modelo_ata!,
          mac: datos.mac!,
          ip: datos.ip!,
          numero_serie: datos.ata_numero_serie,
        },
        cliente,
      );
    }

    return nuevoIdTelefono;
  });

  return obtenerDispositivo(idTelefono);
}

/** Edita un dispositivo existente. El tipo no puede cambiar. Devuelve su detalle. */
export async function actualizarDispositivo(
  idTelefono: number,
  datos: DatosDispositivo,
): Promise<DispositivoDetalle> {
  const actual = await telefonosRepo.buscarDetallePorId(idTelefono);
  if (!actual) {
    throw new ErrorInventario('NO_ENCONTRADO', 'El dispositivo no existe.');
  }
  if (datos.tipo !== actual.tipo) {
    throw new ErrorInventario(
      'TIPO_NO_EDITABLE',
      'No se puede cambiar el tipo de un dispositivo. Dé de baja y cree uno nuevo.',
    );
  }

  validarCoherenciaPorTipo(datos);

  await ejecutarEnTransaccion(async (cliente) => {
    await validarExtensionUnica(datos.extension, idTelefono, cliente);
    if (datos.mac) {
      await validarMacUnica(datos.mac, idTelefono, cliente);
    }

    const idUbicacion = await resolverUbicacion(datos, cliente);

    await telefonosRepo.actualizarTelefono(
      idTelefono,
      {
        id_ubicacion: idUbicacion,
        id_modelo_telefono: datos.id_modelo_telefono,
        extension: datos.extension,
        tipo: datos.tipo,
        numero_serie: datos.numero_serie,
        mac: datos.tipo === 'IP_NATIVO' ? datos.mac : null,
        ip: datos.tipo === 'IP_NATIVO' ? datos.ip : null,
      },
      cliente,
    );

    if (datos.tipo === 'IP_ATA') {
      await atasRepo.actualizarAta(
        idTelefono,
        {
          id_telefono: idTelefono,
          id_modelo_ata: datos.id_modelo_ata!,
          mac: datos.mac!,
          ip: datos.ip!,
          numero_serie: datos.ata_numero_serie,
        },
        cliente,
      );
    }
  });

  return obtenerDispositivo(idTelefono);
}

/** Obtiene un dispositivo por su id. Lanza error si no existe. */
export async function obtenerDispositivo(
  idTelefono: number,
): Promise<DispositivoDetalle> {
  const dispositivo = await telefonosRepo.buscarDetallePorId(idTelefono);
  if (!dispositivo) {
    throw new ErrorInventario('NO_ENCONTRADO', 'El dispositivo no existe.');
  }
  return dispositivo;
}

/** Lista los dispositivos que cumplan los filtros dados. */
export async function listarDispositivos(
  filtros: FiltrosDispositivo,
): Promise<DispositivoDetalle[]> {
  return telefonosRepo.listarDispositivos(filtros);
}

/** Baja lógica del dispositivo y, si es IP_ATA, también de su ATA. */
export async function desactivarDispositivo(idTelefono: number): Promise<void> {
  const actual = await telefonosRepo.buscarDetallePorId(idTelefono);
  if (!actual) {
    throw new ErrorInventario('NO_ENCONTRADO', 'El dispositivo no existe.');
  }

  await ejecutarEnTransaccion(async (cliente) => {
    await telefonosRepo.desactivarTelefono(idTelefono, cliente);
    if (actual.tipo === 'IP_ATA') {
      await atasRepo.desactivarAta(idTelefono, cliente);
    }
  });
}

/** Reactiva el dispositivo y, si es IP_ATA, también su ATA. */
export async function reactivarDispositivo(idTelefono: number): Promise<void> {
  const actual = await telefonosRepo.buscarDetallePorId(idTelefono);
  if (!actual) {
    throw new ErrorInventario('NO_ENCONTRADO', 'El dispositivo no existe.');
  }

  await ejecutarEnTransaccion(async (cliente) => {
    await telefonosRepo.reactivarTelefono(idTelefono, cliente);
    if (actual.tipo === 'IP_ATA') {
      await atasRepo.reactivarAta(idTelefono, cliente);
    }
  });
}

/**
 * Borrado físico de un dispositivo. Rechaza el borrado si tiene incidencias
 * registradas (en ese caso debe darse de baja en su lugar).
 */
export async function eliminarDispositivo(idTelefono: number): Promise<void> {
  const actual = await telefonosRepo.buscarDetallePorId(idTelefono);
  if (!actual) {
    throw new ErrorInventario('NO_ENCONTRADO', 'El dispositivo no existe.');
  }

  await ejecutarEnTransaccion(async (cliente) => {
    const totalIncidencias = await incidenciasRepo.contarPorTelefono(idTelefono, cliente);
    if (totalIncidencias > 0) {
      throw new ErrorInventario(
        'TIENE_INCIDENCIAS',
        'El dispositivo tiene historial de incidencias. Desactívalo en su lugar.',
      );
    }

    if (actual.tipo === 'IP_ATA') {
      await atasRepo.eliminarAta(idTelefono, cliente);
    }
    await telefonosRepo.eliminarTelefono(idTelefono, cliente);
  });
}