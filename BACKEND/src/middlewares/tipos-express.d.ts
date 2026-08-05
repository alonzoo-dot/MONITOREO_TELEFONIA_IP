import type { DatosToken } from '../utils/jwt';

// Amplía el tipo de Express para que las peticiones puedan llevar el usuario autenticado.
declare global {
  namespace Express {
    interface Request {
      usuario?: DatosToken;
    }
  }
}