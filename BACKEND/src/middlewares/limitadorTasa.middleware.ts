import rateLimit from 'express-rate-limit';

/**
 * Limita los intentos de inicio de sesión por IP para frenar ataques de fuerza
 * bruta y credential stuffing. Solo cuenta los intentos FALLIDOS: un login exitoso
 * no consume el cupo, de modo que un usuario legítimo que se equivoca un par de
 * veces no se bloquea a sí mismo.
 */
export const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000, // ventana de 15 minutos
  limit: 10, // máximo de intentos fallidos por IP dentro de la ventana
  skipSuccessfulRequests: true, // los inicios de sesión correctos no cuentan
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    mensaje: 'Demasiados intentos de inicio de sesión. Espera unos minutos e inténtalo de nuevo.',
    codigo: 'DEMASIADOS_INTENTOS',
  },
});
