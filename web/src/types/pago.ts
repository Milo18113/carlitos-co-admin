/** Fila de `GET /api/pagos?factura=`: columnas de `tPago` (schema.sql), sin renombrar. */
export interface Pago {
  codigo_pago: string
  fecha: string
  monto: number
  referencia: string | null
  tFactura_numero_factura: string
  tFormaPago_codigo_forma_pago: string
}

/** Body de `POST /api/pagos` → `registrar_pago`. */
export interface PagoNuevo {
  codigo_pago: string
  numero_factura: string
  monto: number
  forma_pago: string
  referencia: string | null
}
