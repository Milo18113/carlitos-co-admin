import type { ColumnaTabla } from './tabla'

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

/** Lo que devuelve cada vista: la lista de sus filas. */
export type FilasPorReporte = { [V in VistaReporte]: FilasPorVista[V][] }

/** Todo lo que la UI necesita saber de un reporte: la pantalla, el menú y el PDF salen de aquí. */
export interface DefinicionReporte<F> {
  titulo: string
  /** Una línea que explica qué muestra; va sobre la tabla y en el PDF. */
  descripcion: string
  /** Endpoint del API (plan 4.3), relativo a `VITE_API_URL`. */
  endpoint: string
  /** Etiquetas legibles y formato de cada columna. Los `clave` son los alias de la vista SQL. */
  columnas: ColumnaTabla<F>[]
}

export const REPORTES: { [V in VistaReporte]: DefinicionReporte<FilasPorVista[V]> } = {
  'repuestos-disponibles': {
    titulo: 'Repuestos disponibles',
    descripcion: 'Repuestos con stock en cada bodega.',
    endpoint: '/reportes/repuestos-disponibles',
    columnas: [
      { clave: 'Codigo_oe', etiqueta: 'Código OE', principal: true },
      { clave: 'descripcion', etiqueta: 'Descripción' },
      { clave: 'Marca', etiqueta: 'Marca' },
      { clave: 'Bodega', etiqueta: 'Bodega' },
      { clave: 'ubicacion', etiqueta: 'Ubicación' },
      { clave: 'cantidad', etiqueta: 'Cantidad', formato: 'numero' },
    ],
  },
  'cuentas-por-cobrar': {
    titulo: 'Cuentas por cobrar',
    descripcion: 'Facturas emitidas que todavía tienen saldo pendiente.',
    endpoint: '/reportes/cuentas-por-cobrar',
    columnas: [
      { clave: 'seriefactura', etiqueta: 'Factura', principal: true },
      { clave: 'Nombre_Cliente', etiqueta: 'Cliente' },
      { clave: 'fechafactura', etiqueta: 'Fecha', formato: 'fecha' },
      { clave: 'Total', etiqueta: 'Total', formato: 'moneda' },
      { clave: 'pagado', etiqueta: 'Pagado', formato: 'moneda' },
      { clave: 'devolucion', etiqueta: 'Devoluciones', formato: 'moneda' },
      { clave: 'Saldo', etiqueta: 'Saldo', formato: 'moneda' },
    ],
  },
  empleados: {
    titulo: 'Empleados',
    descripcion: 'Empleados y las facturas que emitió cada uno.',
    endpoint: '/reportes/empleados',
    columnas: [
      { clave: 'cedula', etiqueta: 'Cédula', principal: true },
      { clave: 'nombres', etiqueta: 'Nombres' },
      { clave: 'apellidos', etiqueta: 'Apellidos' },
      { clave: 'Rol', etiqueta: 'Rol' },
      { clave: 'activo', etiqueta: 'Estado', formato: 'activo' },
      { clave: 'Facturas_emitidas', etiqueta: 'Facturas emitidas', formato: 'numero' },
    ],
  },
  bodegas: {
    titulo: 'Bodegas',
    descripcion: 'Unidades, productos y valor del inventario de cada bodega.',
    endpoint: '/reportes/bodegas',
    columnas: [
      { clave: 'codigo_bodega', etiqueta: 'Código', principal: true },
      { clave: 'nombre', etiqueta: 'Bodega' },
      { clave: 'direccion', etiqueta: 'Dirección' },
      { clave: 'Productos_Bodega', etiqueta: 'Productos', formato: 'numero' },
      { clave: 'Cantidad', etiqueta: 'Unidades', formato: 'numero' },
      { clave: 'Valor_Bodega', etiqueta: 'Valor', formato: 'moneda' },
    ],
  },
  'desempeno-marca': {
    titulo: 'Desempeño por marca',
    descripcion: 'Ventas con IVA por marca y categoría.',
    endpoint: '/reportes/desempeno-marca',
    columnas: [
      { clave: 'Nombre_Marca', etiqueta: 'Marca', principal: true },
      { clave: 'Categoria', etiqueta: 'Categoría' },
      { clave: 'Venta_Marca', etiqueta: 'Ventas', formato: 'moneda' },
    ],
  },
}

export const VISTAS_REPORTE = Object.keys(REPORTES) as VistaReporte[]

/** Valida el `:vista` de la ruta antes de usarlo como clave. */
export function esVistaReporte(valor: unknown): valor is VistaReporte {
  return VISTAS_REPORTE.some((vista) => vista === valor)
}

/** Una fila de cualquiera de las 5 vistas, para los componentes que las sirven todas. */
export type FilaReporte = Record<string, unknown>

/**
 * La definición con las filas como registros genéricos. `DataTable` y el PDF no se escriben una
 * vez por vista: reciben columnas y filas genéricas. El cast es seguro porque `REPORTES` ya
 * garantiza (con su tipo mapeado) que las columnas de cada vista existen en su fila.
 */
export function definicionDe(vista: VistaReporte): DefinicionReporte<FilaReporte> {
  return REPORTES[vista] as unknown as DefinicionReporte<FilaReporte>
}
