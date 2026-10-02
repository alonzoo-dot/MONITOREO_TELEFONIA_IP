// Error de gateways de llamada, con un codigo para traducir a HTTP.
export class ErrorLlamadas extends Error {
  constructor(
    public readonly codigo: string,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = 'ErrorLlamadas';
  }
}
