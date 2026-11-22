/** Fila de `GET /api/repuestos`: columnas de `tProducto` (schema.sql), sin renombrar. */
export interface Repuesto {
  codigo_oe: string
  descripcion: string
  precio_venta: number
  stock_minimo: number
  tCategoria_codigo_categoria: string
  tMarca_codigo_marca: string
}

/** Body de `POST /api/repuestos` → `ingresar_repuesto`. */
export interface RepuestoNuevo {
  codigo_oe: string
  descripcion: string
  precio_venta: number
  stock_minimo: number
  codigo_marca: string
  codigo_categoria: string
  codigo_bodega: string
  cantidad: number
  ubicacion: string | null
}

/** Body de `POST /api/repuestos/traslados` → `trasladar_repuesto`. */
export interface TrasladoNuevo {
  codigo_oe: string
  bodega_origen: string
  bodega_destino: string
  cantidad: number
  ubicacion_destino: string | null
}
