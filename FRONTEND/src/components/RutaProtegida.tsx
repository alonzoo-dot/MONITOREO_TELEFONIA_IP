import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { haySesion, obtenerUsuario } from '../services/sesion';

interface Props {
  children: ReactNode;
  /** Si se indica, además de sesión se exige que el usuario tenga este rol. */
  rol?: string;
  /** Si se indica, además de sesión se exige que el usuario tenga alguno de estos roles. */
  roles?: string[];
}

/** Envuelve una ruta que requiere sesión activa (y opcionalmente un rol o lista de roles).
 *  Si no hay sesión, redirige al login. Si el rol no coincide, al dashboard. */
function RutaProtegida({ children, rol, roles }: Props) {
  if (!haySesion()) {
    return <Navigate to="/login" replace />;
  }

  if (rol) {
    const usuario = obtenerUsuario();
    if (usuario?.tipo_rol !== rol) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  if (roles) {
    const usuario = obtenerUsuario();
    if (!usuario || !roles.includes(usuario.tipo_rol)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}

export default RutaProtegida;
