/**
 * Lee una variable CSS del `:root` (por ejemplo `--cc-chart-1`). Los gráficos y las leyendas
 * sacan sus colores de las variables `--cc-chart-*` y nunca llevan hex escritos a mano
 * (DESIGN.md › Gráficos), así que cambiar la paleta es cambiar `_tokens.scss`.
 */
export function leerVariableCss(nombre: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(nombre).trim()
}
