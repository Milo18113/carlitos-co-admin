import { TIPO_IDENTIFICACION } from '@/types/cliente'

/**
 * Validaciones de los formularios. Reflejan las reglas de los procedures para darle al usuario el
 * error antes de enviar, pero la base tiene la última palabra: lo que el procedure rechace llega
 * como toast con su propio texto. Por eso no se agregan reglas que la base no tiene (por ejemplo,
 * el dígito verificador de la cédula, que `registrar_cliente` no revisa).
 */

/** Cada función devuelve el mensaje de error, o `null` si el valor está bien. */
export type Validacion = string | null

/** Un campo opcional vacío se manda como `null`, nunca como `''` ni `undefined` (contrato del API). */
export function textoONull(valor: string): string | null {
  const texto = valor.trim()
  return texto === '' ? null : texto
}

/** "12,50" y "12.50" son el mismo número; si no lo es, `null`. */
export function aNumero(texto: string): number | null {
  const normalizado = texto.trim().replace(',', '.')
  return /^\d+(\.\d+)?$/.test(normalizado) ? Number(normalizado) : null
}

export function aEntero(texto: string): number | null {
  const limpio = texto.trim()
  return /^\d+$/.test(limpio) ? Number(limpio) : null
}

/** Mismo criterio que `registrar_cliente`: un RUC tiene 13 dígitos y una cédula 10. */
export function validarIdentificacion(tipo: string, numero: string): Validacion {
  const limpio = numero.trim()
  if (limpio === '') return 'Escribe el número de identificación'
  if (!/^\d+$/.test(limpio)) return 'Usa solo dígitos, sin espacios ni guiones'
  if (tipo === TIPO_IDENTIFICACION.RUC && limpio.length !== 13) return 'Un RUC tiene 13 dígitos'
  if (tipo === TIPO_IDENTIFICACION.CEDULA && limpio.length !== 10) {
    return 'Una cédula tiene 10 dígitos'
  }
  return null
}

/** El email es opcional; si se escribe, debe tener forma de email (el LIKE '%_@_%._%' del procedure). */
export function validarEmail(valor: string): Validacion {
  const email = valor.trim()
  if (email === '') return null
  return /^.+@.+\..+$/.test(email) ? null : 'El email no es válido'
}

export function validarObligatorio(valor: string, mensaje: string): Validacion {
  return valor.trim() === '' ? mensaje : null
}

export function validarLargoMaximo(valor: string, maximo: number, nombre: string): Validacion {
  return valor.trim().length > maximo ? `${nombre} admite hasta ${maximo} caracteres` : null
}

/** Entero mayor que 0 (cantidades). */
export function validarCantidad(texto: string): Validacion {
  const cantidad = aEntero(texto)
  return cantidad !== null && cantidad > 0
    ? null
    : 'La cantidad debe ser un número entero mayor que 0'
}

/** Monto mayor que 0 con hasta 2 decimales (`DECIMAL(10,2)`). */
export function validarMonto(texto: string, nombre = 'El monto'): Validacion {
  const monto = aNumero(texto)
  if (monto === null || monto <= 0) return `${nombre} debe ser un número mayor que 0`
  if (!/^\d+([.,]\d{1,2})?$/.test(texto.trim())) return `${nombre} admite hasta 2 decimales`
  if (monto >= 100_000_000) return `${nombre} es demasiado grande`
  return null
}

/** Entero de 0 en adelante (stock mínimo). */
export function validarEnteroNoNegativo(texto: string, nombre: string): Validacion {
  return aEntero(texto) === null ? `${nombre} debe ser un número entero, 0 o más` : null
}
