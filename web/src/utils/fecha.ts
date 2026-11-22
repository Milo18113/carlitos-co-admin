/** Fechas como 'YYYY-MM-DD' en hora local (igual que `CURDATE()` en la base). */

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function dosDigitos(numero: number): string {
  return String(numero).padStart(2, '0')
}

export function aFechaISO(fecha: Date): string {
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`
}

export function hoyISO(): string {
  return aFechaISO(new Date())
}

export function haceDias(dias: number): string {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() - dias)
  return aFechaISO(fecha)
}

/**
 * 'YYYY-MM-DD' → "18 nov 2026". Se parte el texto en vez de usar `new Date(iso)`, que
 * interpreta la fecha en UTC y en Ecuador (UTC-5) mostraría el día anterior.
 */
export function formatearFecha(iso: string): string {
  const [anio, mes, dia] = iso.split('-')
  const nombreMes = MESES[Number(mes) - 1]
  if (!anio || !dia || !nombreMes) return iso
  return `${dia} ${nombreMes} ${anio}`
}

/** "22 nov 2026, 13:05": la fecha de generación de los PDF. */
export function formatearFechaHora(fecha: Date): string {
  const dia = dosDigitos(fecha.getDate())
  const mes = MESES[fecha.getMonth()] ?? ''
  const hora = `${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`
  return `${dia} ${mes} ${fecha.getFullYear()}, ${hora}`
}
