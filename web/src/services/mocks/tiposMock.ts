/**
 * Filas de las tablas que los mocks simulan. Usan los nombres de columna de `schema.sql`
 * (las que el API devolvería con un SELECT) y agregan lo que el mock necesita para el login.
 */

/** `tEmpleado` con la contraseña en claro, solo para el login de demostración. */
export interface EmpleadoMock {
  codigo_empleado: string
  cedula: string
  nombres: string
  apellidos: string
  usuario: string
  contrasena: string
  activo: 0 | 1
  tRol_codigo_rol: number
}

/** `tFactura` + el total ya calculado (el mock no guarda `tDetalleFactura`). */
export interface FacturaMock {
  numero_factura: string
  fecha_emision: string
  estado: 'EMITIDA'
  tCliente_numero_identificacion: string
  tEmpleado_codigo_empleado: string
  /** Suma de líneas con descuento e IVA, como la columna `Total` de `Cuentas_por_cobrar`. */
  total: number
  /** Suma de las notas de crédito, como la columna `devolucion` de la vista. */
  devolucion: number
}

/** `tInventario`. */
export interface InventarioMock {
  tBodega_codigo_bodega: string
  tProducto_codigo_oe: string
  cantidad: number
  ubicacion: string | null
}
