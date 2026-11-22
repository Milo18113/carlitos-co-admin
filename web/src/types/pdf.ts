import type { FilaReporte } from './reportes'
import type { ColumnaTabla } from './tabla'

export type ColorRgb = [number, number, number]

/** Los colores del PDF, ya resueltos desde el tema (ver `coloresDelTema`). */
export interface ColoresPdf {
  textoFuerte: ColorRgb
  textoSecundario: ColorRgb
  encabezadoFondo: ColorRgb
  encabezadoTexto: ColorRgb
  borde: ColorRgb
}

/** Una imagen ya descargada, lista para `jsPDF.addImage`. */
export interface ImagenCargada {
  dataUrl: string
  ancho: number
  alto: number
}

export interface OpcionesPdf {
  /** Para el nombre del archivo: "cuentas-por-cobrar" → "cuentas-por-cobrar-2026-11-22.pdf". */
  nombreBase: string
  titulo: string
  descripcion?: string
  columnas: ColumnaTabla<FilaReporte>[]
  /** Las filas que se ven en pantalla (con el filtro aplicado). */
  filas: FilaReporte[]
  /** Quién lo generó: nombre del empleado de la sesión. */
  usuario: string
  generadoEn: Date
  /** Si se exporta con una búsqueda activa, se deja constancia en el encabezado. */
  filtro?: string
  logo?: ImagenCargada | null
  colores: ColoresPdf
}
