/**
 * Fila de `GET /api/catalogos/:nombre`. El API mapea la columna de texto de cada tabla
 * (`nombre` o `descripcion`) a `nombre`. `codigo` conserva el tipo de la base: texto en
 * casi todas, número en `tRol.codigo_rol` (INT).
 */
export interface ItemCatalogo<C extends string | number = string> {
  codigo: C
  nombre: string
}

/** Lista blanca de catálogos: el API nunca arma SQL con el parámetro (plan 4.3). */
export interface CatalogosPorNombre {
  marcas: ItemCatalogo[]
  categorias: ItemCatalogo[]
  bodegas: ItemCatalogo[]
  ciudades: ItemCatalogo[]
  'tipos-identificacion': ItemCatalogo[]
  'formas-pago': ItemCatalogo[]
  roles: ItemCatalogo<number>[]
}

export type NombreCatalogo = keyof CatalogosPorNombre
