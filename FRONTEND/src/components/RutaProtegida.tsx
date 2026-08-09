import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { haySesion } from '../services/sesion';

interface Props {
  children: ReactNode;
}

/** Envuelve una ruta que requiere sesión activa.
 *  Si no hay sesión, redirige al login. */
function RutaProtegida({ children }: Props) {
  if (!haySesion()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default RutaProtegida;