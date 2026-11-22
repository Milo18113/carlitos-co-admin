/**
 * ⚠ PROPUESTA (CU-09). No hay un procedure para emitir una factura (plan 7): este es el body que
 * propone el front para `POST /api/facturas`, a cerrar con el API. Sea con un procedure nuevo o con
 * una transacción desde el API (`beginTransaction` / `commit` / `rollback`), el body no cambia.
 *
 * Lo que NO manda el front, porque lo decide el servidor:
 *   - `numero_factura`: el API asigna el siguiente de la serie ("001-001-000000126") y lo devuelve en el `mensaje`.
 *   - `fecha_emision`: la fecha del servidor (`CURDATE()`).
 *   - `estado`: 'EMITIDA'.
 *   - `tEmpleado_codigo_empleado`: el empleado de la sesión.
 *   - `precio_unitario` de cada línea: el `precio_venta` del repuesto en ese momento.
 */

/** Una fila de `tDetalleFactura`. La clave es (repuesto, factura): un repuesto no se repite en la misma factura. */
export interface LineaFacturaNueva {
  codigo_oe: string
  cantidad: number
  /** 0 a 100. */
  porcentaje_descuento: number
}

export interface FacturaNueva {
  /** `tCliente.numero_identificacion` (el consumidor final también vale). */
  numero_identificacion: string
  /** Columna `porcentaje_iva` de `tFactura`. */
  porcentaje_iva: number
  /**
   * `tFactura` no tiene forma de pago (los pagos son otra tabla, `tPago`). Propuesta: con una forma
   * de pago, el API registra además un pago por el total (venta al contado); con `null` la factura
   * queda con saldo por cobrar (venta a crédito).
   */
  forma_pago: string | null
  /** Al menos una. */
  lineas: LineaFacturaNueva[]
}
