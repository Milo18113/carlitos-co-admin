import { redondearMoneda } from './moneda'

/** Lo que hace falta de una línea para calcular su valor. */
export interface LineaCalculable {
  precioUnitario: number
  cantidad: number
  /** 0 a 100. */
  porcentajeDescuento: number
}

export interface TotalesFactura {
  /** Cantidad × precio de todas las líneas, sin descuento ni IVA. */
  subtotal: number
  descuento: number
  /** Subtotal menos descuento: lo que paga IVA. */
  base: number
  iva: number
  total: number
}

/** Valor de una línea con su descuento y sin IVA. */
export function valorDeLinea(linea: LineaCalculable): number {
  const bruto = linea.cantidad * linea.precioUnitario
  return bruto - (bruto * linea.porcentajeDescuento) / 100
}

/**
 * Los totales de la factura, con la misma fórmula de las vistas SQL (`Cuentas_por_cobrar`):
 * (cantidad × precio − descuento) × (1 + IVA). Cada importe se redondea al centavo y el total es la
 * suma de los que se muestran, para que lo que se ve en pantalla siempre cuadre. El definitivo lo
 * calcula la base; puede diferir en un centavo por el redondeo.
 */
export function calcularTotales(lineas: LineaCalculable[], porcentajeIva: number): TotalesFactura {
  const subtotal = redondearMoneda(
    lineas.reduce((suma, linea) => suma + linea.cantidad * linea.precioUnitario, 0),
  )
  const base = redondearMoneda(lineas.reduce((suma, linea) => suma + valorDeLinea(linea), 0))
  const descuento = redondearMoneda(subtotal - base)
  const iva = redondearMoneda((base * porcentajeIva) / 100)
  return { subtotal, descuento, base, iva, total: redondearMoneda(base + iva) }
}
