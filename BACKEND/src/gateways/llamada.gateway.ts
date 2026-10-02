// Contrato comun para disparar llamadas desde distintos tipos de telefono/gateway.

export type ResultadoLlamada = {
  exito: boolean;
  detalle: string;
};

// Parametros de marcado. Los campos son opcionales porque cada implementacion
// de LlamadaGateway usa solo el subconjunto que necesita.
export type ParametrosLlamada = {
  // ip: direccion IP del telefono a controlar. Usado por SnomGateway.
  ip?: string;
  // extensionDestino: numero o extension a marcar. Usado por SnomGateway y SoftphoneGateway.
  extensionDestino?: string;
  // extensionOrigen: extension con la que el softphone se registra en el Mitel. Usado por SoftphoneGateway.
  extensionOrigen?: string;
  // usuarioSip: usuario de autenticacion SIP. Usado por SoftphoneGateway.
  usuarioSip?: string;
  // passwordSip: contrasena de autenticacion SIP. Usado por SoftphoneGateway.
  passwordSip?: string;
};

export interface LlamadaGateway {
  ejecutar(parametros: ParametrosLlamada): Promise<ResultadoLlamada>;
}
