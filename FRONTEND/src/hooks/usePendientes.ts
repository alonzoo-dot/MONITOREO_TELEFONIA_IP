import { useEffect, useState } from 'react';
import { suscribirPendientes } from '../store/pendientes';

/** Conteo actual de incidencias pendientes, reactivo a cambios del store. */
export function usePendientes(): number {
  const [valor, setValor] = useState(0);
  useEffect(() => suscribirPendientes(setValor), []);
  return valor;
}
