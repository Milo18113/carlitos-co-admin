import { afterEach, describe, expect, it } from 'vitest'

import { crearDesempenoMarcaBase } from '@/services/mocks/datos/desempenoMarca'
import type { BodegaDisponible, DesempenoMarca } from '@/types/reportes'
import { colorDeSerie, coloresDelTema, hexARgb } from '@/utils/colores'
import { agruparVentasPorMarca, ETIQUETA_OTROS, valorPorBodega } from '@/utils/graficos'

function fila(marca: string, categoria: string, venta: number): DesempenoMarca {
  return { Marca_codigo: marca, Nombre_Marca: marca, Categoria: categoria, Venta_Marca: venta }
}

const VARIABLES = [
  '--cc-chart-1',
  '--cc-chart-2',
  '--cc-chart-3',
  '--cc-chart-4',
  '--cc-chart-5',
  '--cc-chart-6',
  '--cc-chart-other',
  '--bs-gray-100',
  '--bs-gray-200',
  '--bs-gray-600',
  '--bs-gray-900',
]

afterEach(() => {
  for (const variable of VARIABLES) document.documentElement.style.removeProperty(variable)
})

describe('agruparVentasPorMarca', () => {
  it('con 8 categorías deja 6 con serie propia y junta el resto en "Otros"', () => {
    const { series } = agruparVentasPorMarca(crearDesempenoMarcaBase())

    expect(series).toHaveLength(7)
    expect(series.slice(0, 6).every((serie) => !serie.esOtros)).toBe(true)
    expect(series[6]).toMatchObject({ categoria: ETIQUETA_OTROS, esOtros: true })
  })

  it('no pierde ni inventa ventas al agrupar', () => {
    const filas = crearDesempenoMarcaBase()
    const { series } = agruparVentasPorMarca(filas)

    const totalOriginal = filas.reduce((suma, f) => suma + f.Venta_Marca, 0)
    const totalAgrupado = series.flatMap((s) => s.valores).reduce((suma, valor) => suma + valor, 0)

    expect(totalAgrupado).toBeCloseTo(totalOriginal, 2)
  })

  it('las series van de la categoría que más vende a la que menos, y "Otros" al final', () => {
    const { series } = agruparVentasPorMarca([
      fila('A', 'Poca', 10),
      fila('A', 'Mucha', 500),
      fila('B', 'Media', 100),
    ])

    expect(series.map((s) => s.categoria)).toEqual(['Mucha', 'Media', 'Poca'])
  })

  it('ordena las marcas de la que más vende a la que menos', () => {
    const { marcas } = agruparVentasPorMarca([
      fila('Chica', 'X', 10),
      fila('Grande', 'X', 900),
      fila('Mediana', 'X', 100),
    ])

    expect(marcas).toEqual(['Grande', 'Mediana', 'Chica'])
  })

  it('con 6 categorías o menos no hay serie "Otros"', () => {
    const filas = ['A', 'B', 'C', 'D', 'E', 'F'].map((categoria, i) => fila('M', categoria, i + 1))

    const { series } = agruparVentasPorMarca(filas)

    expect(series).toHaveLength(6)
    expect(series.some((serie) => serie.esOtros)).toBe(false)
  })

  it('una marca sin ventas en una categoría queda en cero, no vacía', () => {
    const { marcas, series } = agruparVentasPorMarca([
      fila('M1', 'Frenos', 100),
      fila('M2', 'Filtros', 50),
    ])

    const frenos = series.find((s) => s.categoria === 'Frenos')
    expect(frenos?.valores[marcas.indexOf('M2')]).toBe(0)
  })

  it('suma sin arrastrar el ruido de la coma flotante', () => {
    const { series } = agruparVentasPorMarca([fila('M', 'X', 0.1), fila('M', 'X', 0.2)])

    expect(series[0]?.valores[0]).toBe(0.3)
  })
})

describe('valorPorBodega', () => {
  const bodega = (nombre: string, valor: number): BodegaDisponible => ({
    codigo_bodega: nombre,
    nombre,
    direccion: '',
    Cantidad: 0,
    Productos_Bodega: 0,
    Valor_Bodega: valor,
  })

  it('ordena de la bodega que más vale a la que menos', () => {
    const { etiquetas, valores } = valorPorBodega([
      bodega('B2', 200),
      bodega('B1', 900),
      bodega('B3', 50),
    ])

    expect(etiquetas).toEqual(['B1', 'B2', 'B3'])
    expect(valores).toEqual([900, 200, 50])
  })

  it('no modifica el arreglo que recibe', () => {
    const original = [bodega('B2', 200), bodega('B1', 900)]

    valorPorBodega(original)

    expect(original.map((b) => b.nombre)).toEqual(['B2', 'B1'])
  })
})

describe('colorDeSerie', () => {
  it('lee el color de la variable --cc-chart-N del tema', () => {
    document.documentElement.style.setProperty('--cc-chart-1', '#005B8A')
    document.documentElement.style.setProperty('--cc-chart-3', '#3691BA')

    expect(colorDeSerie(0)).toBe('#005B8A')
    expect(colorDeSerie(2)).toBe('#3691BA')
  })

  it('"Otros" usa el gris, no un color de la paleta', () => {
    document.documentElement.style.setProperty('--cc-chart-other', '#9BA6B2')

    expect(colorDeSerie(6, true)).toBe('#9BA6B2')
  })

  it('no cicla la paleta: una séptima serie con color propio es un error', () => {
    expect(() => colorDeSerie(6)).toThrow('agrúpala en "Otros"')
    expect(() => colorDeSerie(-1)).toThrow('agrúpala en "Otros"')
  })
})

describe('hexARgb y coloresDelTema', () => {
  it('convierte hex de 6 y de 3 dígitos', () => {
    expect(hexARgb('#195073')).toEqual([25, 80, 115])
    expect(hexARgb('#FFF')).toEqual([255, 255, 255])
    expect(hexARgb(' #141b24 ')).toEqual([20, 27, 36])
  })

  it('rechaza lo que no es un color hex', () => {
    expect(() => hexARgb('rgb(1, 2, 3)')).toThrow('Color no válido')
    expect(() => hexARgb('')).toThrow('Color no válido')
  })

  it('arma los colores del PDF desde las variables del tema', () => {
    document.documentElement.style.setProperty('--bs-gray-900', '#141B24')
    document.documentElement.style.setProperty('--bs-gray-600', '#4C5A69')
    document.documentElement.style.setProperty('--bs-gray-200', '#E1E7ED')
    document.documentElement.style.setProperty('--bs-gray-100', '#F0F4F7')

    const colores = coloresDelTema()

    expect(colores.textoFuerte).toEqual([20, 27, 36])
    expect(colores.encabezadoFondo).toEqual([240, 244, 247])
    expect(colores.borde).toEqual([225, 231, 237])
  })

  it('si faltan los estilos, el error dice qué variable falta', () => {
    expect(() => coloresDelTema()).toThrow('Falta la variable CSS --bs-gray-900')
  })
})
