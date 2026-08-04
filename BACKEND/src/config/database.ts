import { Pool, type QueryResult, type QueryResultRow } from 'pg';
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

export async function probarConexion(): Promise<void> {
  const cliente = await poolConexiones.connect();
  try {
    await cliente.query('SELECT 1');
  } finally {
    cliente.release();
  }
}