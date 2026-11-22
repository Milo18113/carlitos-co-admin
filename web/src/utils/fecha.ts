/** Fechas como 'YYYY-MM-DD' en hora local (igual que `CURDATE()` en la base). */

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
