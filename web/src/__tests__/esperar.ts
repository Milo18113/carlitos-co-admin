import { vi } from 'vitest'

/**
 * `vi.waitFor` con más margen que el de fábrica (1 segundo). Las animaciones de Bootstrap (el modal
 * del `ConfirmDialog`) usan temporizadores reales, y con la máquina ocupada (otro servidor de Vite,
 * una compilación) 1 segundo no alcanza: la prueba fallaba sin que hubiera un error en el código.
 */
export function esperarHasta<T>(comprobacion: () => T | Promise<T>): Promise<T> {
  return vi.waitFor(comprobacion, { timeout: 5000, interval: 25 })
}
