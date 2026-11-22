import type { FormatoColumna } from '@/types/tabla'

import { formatearFecha } from './fecha'
import { formatearEntero, formatearMoneda } from './moneda'

/** Texto que se muestra cuando el valor es `null` (una columna opcional sin dato). */
export const SIN_DATO = '—'

/** Moneda y número se alinean a la derecha para que las columnas de cifras se lean en vertical. */
export function esNumerico(formato: FormatoColumna = 'texto'): boolean {
  return formato === 'moneda' || formato === 'numero'
}

/** Un solo lugar que decide cómo se escribe cada valor, para la tabla y para el PDF. */
export function formatearCelda(valor: unknown, formato: FormatoColumna = 'texto'): string {
  if (valor === null || valor === undefined || valor === '') return SIN_DATO

  if (typeof valor === 'number') {
    if (formato === 'moneda') return formatearMoneda(valor)
    if (formato === 'numero') return formatearEntero(valor)
  }
  if (typeof valor === 'string' && formato === 'fecha') return formatearFecha(valor)

  return String(valor)
}
