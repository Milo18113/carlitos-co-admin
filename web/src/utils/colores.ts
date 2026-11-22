import type { ColoresPdf, ColorRgb } from '@/types/pdf'

import { MAXIMO_SERIES } from './graficos'

/**
 * Lee una variable CSS del `:root` (por ejemplo `--cc-chart-1`). Los gráficos y las leyendas
 * sacan sus colores de las variables `--cc-chart-*` y nunca llevan hex escritos a mano
 * (DESIGN.md › Gráficos), así que cambiar la paleta es cambiar `_tokens.scss`.
 */
export function leerVariableCss(nombre: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(nombre).trim()
}

/**
 * Color de la serie número `indice` (desde 0): `--cc-chart-1` … `--cc-chart-6`, o el gris
 * `--cc-chart-other` para "Otros". La paleta no se cicla: pedir una séptima serie con color propio
 * es un error de quien arma el gráfico (debió agruparla en "Otros"), no algo que se disimula.
 */
export function colorDeSerie(indice: number, esOtros = false): string {
  if (esOtros) return leerVariableCss('--cc-chart-other')
  if (indice < 0 || indice >= MAXIMO_SERIES) {
    throw new Error(`No hay un color para la serie ${indice + 1}: agrúpala en "Otros".`)
  }
  return leerVariableCss(`--cc-chart-${indice + 1}`)
}

/** '#195073' o '#fff' → [25, 80, 115]. Es el formato que pide jsPDF. */
export function hexARgb(valor: string): ColorRgb {
  const hex = valor.trim().replace(/^#/, '')
  const completo = hex.length === 3 ? [...hex].map((digito) => digito + digito).join('') : hex
  if (!/^[0-9a-f]{6}$/i.test(completo)) throw new Error(`Color no válido: "${valor}"`)
  return [
    parseInt(completo.slice(0, 2), 16),
    parseInt(completo.slice(2, 4), 16),
    parseInt(completo.slice(4, 6), 16),
  ]
}

function colorDeVariable(nombre: string): ColorRgb {
  const valor = leerVariableCss(nombre)
  if (valor === '') throw new Error(`Falta la variable CSS ${nombre}: no se cargaron los estilos.`)
  return hexARgb(valor)
}

/** Los colores del PDF salen del mismo tema que la pantalla (variables de Bootstrap en `:root`). */
export function coloresDelTema(): ColoresPdf {
  return {
    textoFuerte: colorDeVariable('--bs-gray-900'),
    textoSecundario: colorDeVariable('--bs-gray-600'),
    encabezadoFondo: colorDeVariable('--bs-gray-100'),
    encabezadoTexto: colorDeVariable('--bs-gray-600'),
    borde: colorDeVariable('--bs-gray-200'),
  }
}
