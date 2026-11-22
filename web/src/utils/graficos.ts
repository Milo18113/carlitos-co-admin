import type { BodegaDisponible, DesempenoMarca } from '@/types/reportes'

import { redondearMoneda } from './moneda'

/**
 * Máximo de series con color propio (DESIGN.md › Gráficos): la paleta tiene 6 y nunca se cicla.
 * Desde la serie 7 todo se agrupa en "Otros".
 */
export const MAXIMO_SERIES = 6
export const ETIQUETA_OTROS = 'Otros'

export interface SerieVentas {
  categoria: string
  /** Una cifra por marca, en el mismo orden que `VentasAgrupadas.marcas`. */
  valores: number[]
  /** Es la serie que junta las categorías sobrantes: va en gris, no en la paleta. */
  esOtros: boolean
}

export interface VentasAgrupadas {
  marcas: string[]
  series: SerieVentas[]
}

function sumarEn(mapa: Map<string, number>, clave: string, valor: number): void {
  mapa.set(clave, (mapa.get(clave) ?? 0) + valor)
}

/** Las claves del mapa, de mayor a menor total (a igualdad, por nombre: el orden no cambia entre cargas). */
function claveOrdenadasPorTotal(mapa: Map<string, number>): string[] {
  return [...mapa.entries()]
    .sort(([claveA, totalA], [claveB, totalB]) => totalB - totalA || claveA.localeCompare(claveB))
    .map(([clave]) => clave)
}

/**
 * `Desempeno_marca` (una fila por marca y categoría) → barras apiladas: una barra por marca y una
 * serie por categoría. Las `maximoSeries` categorías que más venden tienen serie propia y el resto
 * se suma en "Otros".
 */
export function agruparVentasPorMarca(
  filas: DesempenoMarca[],
  maximoSeries = MAXIMO_SERIES,
): VentasAgrupadas {
  const totalPorMarca = new Map<string, number>()
  const totalPorCategoria = new Map<string, number>()
  for (const fila of filas) {
    sumarEn(totalPorMarca, fila.Nombre_Marca, fila.Venta_Marca)
    sumarEn(totalPorCategoria, fila.Categoria, fila.Venta_Marca)
  }

  const marcas = claveOrdenadasPorTotal(totalPorMarca)
  const categorias = claveOrdenadasPorTotal(totalPorCategoria)
  const principales = categorias.slice(0, maximoSeries)
  const sobrantes = new Set(categorias.slice(maximoSeries))

  function ventasDe(marca: string, incluye: (categoria: string) => boolean): number {
    const suma = filas
      .filter((fila) => fila.Nombre_Marca === marca && incluye(fila.Categoria))
      .reduce((total, fila) => total + fila.Venta_Marca, 0)
    return redondearMoneda(suma)
  }

  const series: SerieVentas[] = principales.map((categoria) => ({
    categoria,
    valores: marcas.map((marca) => ventasDe(marca, (c) => c === categoria)),
    esOtros: false,
  }))
  if (sobrantes.size > 0) {
    series.push({
      categoria: ETIQUETA_OTROS,
      valores: marcas.map((marca) => ventasDe(marca, (c) => sobrantes.has(c))),
      esOtros: true,
    })
  }
  return { marcas, series }
}

/** `Bodegas_Disponibles` → una barra por bodega, de la que más vale a la que menos. */
export function valorPorBodega(filas: BodegaDisponible[]): {
  etiquetas: string[]
  valores: number[]
} {
  const ordenadas = [...filas].sort(
    (a, b) => b.Valor_Bodega - a.Valor_Bodega || a.nombre.localeCompare(b.nombre),
  )
  return {
    etiquetas: ordenadas.map((bodega) => bodega.nombre),
    valores: ordenadas.map((bodega) => bodega.Valor_Bodega),
  }
}
