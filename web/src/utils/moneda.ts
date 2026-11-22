/**
 * Formato de números del diseño (system.html): punto de miles, coma decimal y "$ " delante,
 * por ejemplo "$ 1.240,00". Se arma a mano en vez de `Intl` porque el agrupado de miles de
 * `Intl` en español cambia según el locale (en `es` un 1240 se escribe "1240", sin punto).
 */

function agruparMiles(entero: string): string {
  return entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/** Al centavo: para sumar montos sin arrastrar el ruido de la coma flotante (0.1 + 0.2). */
export function redondearMoneda(valor: number): number {
  return Math.round(valor * 100) / 100
}

/** Dos decimales siempre, en USD. Las cifras de tablas y KPIs llevan además la clase `tabular`. */
export function formatearMoneda(valor: number): string {
  const centavos = Math.round(valor * 100)
  const [entero = '0', decimales = '00'] = (Math.abs(centavos) / 100).toFixed(2).split('.')
  return `${centavos < 0 ? '-' : ''}$ ${agruparMiles(entero)},${decimales}`
}

/** Conteos y cantidades: "1.284". */
export function formatearEntero(valor: number): string {
  const redondeado = Math.round(valor)
  return `${redondeado < 0 ? '-' : ''}${agruparMiles(String(Math.abs(redondeado)))}`
}
