import { ReglaNegocioError } from '@/services/errores'
import type { RespuestaEscritura } from '@/types/api'

/**
 * Rango de espera simulada. Es un objeto mutable a propósito: los tests lo ponen en 0 para
 * no depender de temporizadores reales.
 */
export const espera = { minimoMs: 300, maximoMs: 600 }

function errorCancelado(): DOMException {
  return new DOMException('Petición cancelada', 'AbortError')
}

/** Simula la latencia del API para que se vean los estados de carga. Respeta `signal`. */
export function esperar(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(errorCancelado())
      return
    }

    const duracion = espera.minimoMs + Math.random() * (espera.maximoMs - espera.minimoMs)

    function alCancelar(): void {
      clearTimeout(temporizador)
      reject(errorCancelado())
    }

    const temporizador = setTimeout(() => {
      signal?.removeEventListener('abort', alCancelar)
      resolve()
    }, duracion)

    signal?.addEventListener('abort', alCancelar, { once: true })
  })
}

/** Equivale a un `ROLLBACK: ...` del procedure: el API lo devuelve como 422. */
export function reglaDeNegocio(mensaje: string): never {
  throw new ReglaNegocioError(mensaje)
}

/** Equivale a un `COMMIT: ...` del procedure: el API lo devuelve como 200. */
export function exito(mensaje: string): RespuestaEscritura {
  return { mensaje }
}

export function redondear(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100
}

/** Formatea un monto como lo hace `CONCAT` con un DECIMAL(10,2): siempre 2 decimales. */
export function dinero(valor: number): string {
  return redondear(valor).toFixed(2)
}
