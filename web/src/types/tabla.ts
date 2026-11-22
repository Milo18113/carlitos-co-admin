export type FormatoColumna = 'texto' | 'moneda' | 'fecha' | 'numero'

/** Una columna de `DataTable`. También la usan los reportes (mapa de `types/reportes.ts`) y el PDF. */
export interface ColumnaTabla<T> {
  /** Campo de la fila que muestra la columna. */
  clave: keyof T & string
  /** Texto del encabezado. */
  etiqueta: string
  /** Cómo se escribe el valor. Moneda y número van alineados a la derecha. */
  formato?: FormatoColumna
  /** Identificador de la fila: se muestra en negrita. */
  principal?: boolean
}
