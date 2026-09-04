/** Dirección base del backend. */
export const URL_BASE = import.meta.env.VITE_API_URL;

if (!URL_BASE) {
  throw new Error(
    'VITE_API_URL no está definida. Configura FRONTEND/.env con VITE_API_URL=<url>',
  );
}

/** Error por campo dentro de un ErrorApi */
export interface ErrorCampo {
  campo: string;
  mensaje: string;
}

/** Error de una petición al backend. Conserva el `codigo` de negocio y los `errores` por campo, si vinieron en la respuesta. */
export class ErrorApi extends Error {
  readonly codigo?: string;
  readonly errores?: ErrorCampo[];

  constructor(mensaje: string, codigo?: string, errores?: ErrorCampo[]) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.codigo = codigo;
    this.errores = errores;
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
    const erroresCampo: ErrorCampo[] | undefined = Array.isArray(datos?.errores)
      ? datos.errores.map((e: { campo: string; detalle: string }) => ({
          campo: e.campo,
          mensaje: e.detalle,
        }))
      : undefined;
    throw new ErrorApi(datos?.mensaje ?? 'Error en la petición', datos?.codigo, erroresCampo);
  }

  return datos as T;
}