/** El texto de un error para mostrarlo en la UI: el mensaje de los errores tipados de `services/errores`. */
export function mensajeDeError(causa: unknown): string {
  return causa instanceof Error ? causa.message : 'Error desconocido'
}
