/** Dirección base del backend. */
const URL_BASE = 'http://localhost:4000/api';

/** Opciones para una petición al backend. */
interface OpcionesPeticion {
  metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  cuerpo?: unknown;
  token?: string;
}

/** Realiza una petición al backend y devuelve la respuesta en JSON.
 *  Lanza un error con el mensaje del backend si la respuesta no es exitosa. */
export async function peticionApi<T>(
  ruta: string,
  opciones: OpcionesPeticion = {},
): Promise<T> {
  const { metodo = 'GET', cuerpo, token } = opciones;

  const encabezados: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    encabezados['Authorization'] = `Bearer ${token}`;
  }

  const respuesta = await fetch(`${URL_BASE}${ruta}`, {
    method: metodo,
    headers: encabezados,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.mensaje ?? 'Error en la petición');
  }

  return datos as T;
}