function dosDigitos(numero: number): string {
  return String(numero).padStart(2, '0')
}

/**
 * Un código para precargar en el formulario ("PAG-20261122-130501"): fecha y hora hasta el segundo,
 * así que dos pagos del mismo día no chocan. Es solo una sugerencia: el usuario puede cambiarlo, y
 * si ya existe la base lo rechaza (`registrar_pago` valida la clave primaria).
 */
export function sugerirCodigo(prefijo: string, ahora = new Date()): string {
  const fecha = `${ahora.getFullYear()}${dosDigitos(ahora.getMonth() + 1)}${dosDigitos(ahora.getDate())}`
  const hora = `${dosDigitos(ahora.getHours())}${dosDigitos(ahora.getMinutes())}${dosDigitos(ahora.getSeconds())}`
  return `${prefijo}-${fecha}-${hora}`
}
