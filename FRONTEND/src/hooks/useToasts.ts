import { useEffect, useState } from 'react';
import { suscribirToasts } from '../store/toasts';
import type { ToastItem } from '../types/toast';

/** Lista de toasts activos, reactiva a cambios del store. */
export function useToasts(): ToastItem[] {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  useEffect(() => suscribirToasts(setToasts), []);
  return toasts;
}
