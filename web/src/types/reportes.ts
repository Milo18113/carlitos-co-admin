/**
 * Una interfaz por vista de `database/views.sql`. Los nombres de campo son EXACTAMENTE los
 * alias de la vista: el API no los renombra, así cada campo se rastrea directo al SQL.
 *
 * Montos y conteos llegan como `number` (el API configura `decimalNumbers: true` en mysql2;
 * por defecto el driver devuelve DECIMAL como string). Fechas: 'YYYY-MM-DD'.
 */

/** Vista `repuestos_disponibles`. */
export interface RepuestoDisponible {
  Bodega: string
  Codigo_oe: string
  cantidad: number
  ubicacion: string | null
  descripcion: string
  Marca: string
}

/** Vista `Cuentas_por_cobrar`. */
export interface CuentaPorCobrar {
  Nombre_Cliente: string
  seriefactura: string
  fechafactura: string
  Total: number
  Saldo: number
  pagado: number
  devolucion: number
}

/** Vista `Empleados`. `activo` es TINYINT(1): llega como 0 o 1. */
export interface EmpleadoResumen {
  cedula: string
  nombres: string
  apellidos: string
  activo: 0 | 1
  Rol: string
  Facturas_emitidas: number
}

/** Vista `Bodegas_Disponibles`. */
export interface BodegaDisponible {
  codigo_bodega: string
  nombre: string
  direccion: string
  Cantidad: number
  Productos_Bodega: number
  Valor_Bodega: number
}

/** Vista `Desempeno_marca`. */
export interface DesempenoMarca {
  Marca_codigo: string
  Nombre_Marca: string
  Categoria: string
  Venta_Marca: number
}

/**
 * Slug de `GET /api/reportes/:vista` → forma de cada fila. También es el `:vista` de la ruta
 * `/reportes/:vista` del front.
 */
export interface FilasPorVista {
  'repuestos-disponibles': RepuestoDisponible
  'cuentas-por-cobrar': CuentaPorCobrar
  empleados: EmpleadoResumen
  bodegas: BodegaDisponible
  'desempeno-marca': DesempenoMarca
}

export type VistaReporte = keyof FilasPorVista
