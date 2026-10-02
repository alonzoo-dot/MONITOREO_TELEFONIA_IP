import { useEffect, useState } from 'react';
import { suscribirConfirmacion } from '../store/confirmaciones';
import type { ConfirmacionPendiente } from '../types/confirmacion';

/** Confirmacion pendiente activa, reactiva a cambios del store */
export function useConfirmacion(): ConfirmacionPendiente | null {
  const [confirmacion, setConfirmacion] = useState<ConfirmacionPendiente | null>(null);
  useEffect(() => suscribirConfirmacion(setConfirmacion), []);
  return confirmacion;
}
