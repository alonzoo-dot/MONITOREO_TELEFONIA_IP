import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';
import { configuracion } from './env';

export const poolConexiones = new Pool({
  connectionString: configuracion.urlBaseDatos,
});

export function ejecutarConsulta<T extends QueryResultRow>(
  sql: string,
  parametros?: readonly unknown[],
): Promise<QueryResult<T>> {
  return poolConexiones.query<T>(sql, parametros as unknown[]);
}

/**
 * Ejecuta una consulta sobre un cliente de transacción si se proporciona, o
 * sobre el pool normal si no. Permite que un mismo repositorio opere dentro o
 * fuera de una transacción sin duplicar métodos.
 */
export function consultarCon<T extends QueryResultRow>(
  cliente: PoolClient | undefined,
  sql: string,
  parametros?: readonly unknown[],
): Promise<QueryResult<T>> {
  return cliente
    ? cliente.query<T>(sql, parametros as unknown[])
    : ejecutarConsulta<T>(sql, parametros);
}

/**
 * Ejecuta una operación dentro de una transacción: abre BEGIN, hace COMMIT si
 * todo sale bien o ROLLBACK ante cualquier error, y siempre libera el cliente.
 */
export async function ejecutarEnTransaccion<T>(
  operacion: (cliente: PoolClient) => Promise<T>,
): Promise<T> {
  const cliente = await poolConexiones.connect();
  try {
    await cliente.query('BEGIN');
    const resultado = await operacion(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

export async function probarConexion(): Promise<void> {
  const cliente = await poolConexiones.connect();
  try {
    await cliente.query('SELECT 1');
  } finally {
    cliente.release();
  }
}
