/**
 * Errores tipados que lanzan `http.ts` y los mocks. La UI los distingue con `instanceof`
 * (plan 5.3). Viven aparte para que los mocks lancen exactamente los mismos que el API real.
 */

/** 401: sin sesión, sesión vencida o credenciales incorrectas. */
export class NoAutorizadoError extends Error {
  constructor(mensaje = 'Tu sesión no es válida o expiró. Inicia sesión de nuevo.') {
    super(mensaje)
    this.name = 'NoAutorizadoError'
  }
}

/** 422: el procedure respondió `ROLLBACK: ...`. El mensaje es el texto del procedure, para mostrarlo tal cual. */
export class ReglaNegocioError extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = 'ReglaNegocioError'
  }
}

/** 500 o falla de red: el detalle va al log del API, a la UI solo llega un mensaje genérico. */
export class ErrorServidor extends Error {
  constructor(mensaje = 'No se pudo completar la operación. Intenta de nuevo en unos minutos.') {
    super(mensaje)
    this.name = 'ErrorServidor'
  }
}
