/** Una serie de `GraficoBarras`: una cifra por etiqueta del eje de categorías. */
export interface SerieGrafico {
  etiqueta: string
  datos: number[]
  /** Color CSS ya resuelto (ver `colorDeSerie`). */
  color: string
}

/** Un punto de la leyenda HTML de `ChartCard`. */
export interface ItemLeyenda {
  etiqueta: string
  /** Color CSS ya resuelto (ver `leerVariableCss`). */
  color: string
}
