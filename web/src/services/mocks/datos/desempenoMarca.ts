import type { DesempenoMarca } from '@/types/reportes'

import { CATALOGOS_BASE } from './catalogos'

/**
 * Ventas por (marca, categoría). Es estático: en la base real sale de `tDetalleFactura`, y los
 * mocks no guardan líneas de factura (la factura nueva, CU-09, todavía es una propuesta).
 */
const VENTAS: readonly (readonly [marca: string, categoria: string, venta: number])[] = [
  ['TOY', 'FRE', 12480.55],
  ['TOY', 'FIL', 4310.2],
  ['MON', 'SUS', 6975.8],
  ['CHV', 'FIL', 2890.45],
  ['GAT', 'MOT', 5120.3],
  ['NGK', 'ENC', 3745.1],
  ['BOS', 'ELE', 9860.75],
  ['BRE', 'FRE', 8215.4],
  ['DEN', 'ELE', 2150.6],
  ['DEN', 'REF', 3380],
  ['HYU', 'FIL', 1895.25],
  ['KIA', 'FIL', 1640.9],
  ['NIS', 'FIL', 1420.35],
  ['NIS', 'TRA', 4650],
  ['MTC', 'MOT', 3290.7],
]

function nombreDe(catalogo: { codigo: string; nombre: string }[], codigo: string): string {
  return catalogo.find((item) => item.codigo === codigo)?.nombre ?? codigo
}

export function crearDesempenoMarcaBase(): DesempenoMarca[] {
  return VENTAS.map(([marca, categoria, venta]) => ({
    Marca_codigo: marca,
    Nombre_Marca: nombreDe(CATALOGOS_BASE.marcas, marca),
    Categoria: nombreDe(CATALOGOS_BASE.categorias, categoria),
    Venta_Marca: venta,
  }))
}
