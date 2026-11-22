/** Respuesta de cualquier escritura (procedure). `mensaje` va SIN el prefijo `COMMIT: ` / `ROLLBACK: `. */
export interface RespuestaEscritura {
  mensaje: string
}

/** Cuerpo de las respuestas 401, 422 y 500 del API. */
export interface CuerpoError {
  mensaje: string
}
