/** Dirección base del backend. */
export const URL_BASE = import.meta.env.VITE_API_URL;

if (!URL_BASE) {
  throw new Error(
    'VITE_API_URL no está definida. Configura FRONTEND/.env con VITE_API_URL=<url>',
  );
}

/** Error de una petición al backend. Conserva el `codigo` de negocio, si vino en la respuesta. */
export class ErrorApi extends Error {
  readonly codigo?: string;

  constructor(mensaje: string, codigo?: string) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.codigo = codigo;
  }
}

/** Opciones para una petición al backend. */
interface OpcionesPeticion {
  metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
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

  const tieneCuerpo = respuesta.status !== 204 && respuesta.headers.get('content-length') !== '0';
  const datos = tieneCuerpo ? await respuesta.json() : null;

  if (!respuesta.ok) {
    throw new ErrorApi(datos?.mensaje ?? 'Error en la petición', datos?.codigo);
  }

  return datos as T;
}