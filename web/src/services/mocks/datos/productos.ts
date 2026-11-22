import type { Repuesto } from '@/types/repuesto'

import type { InventarioMock } from '../tiposMock'

function producto(
  codigo_oe: string,
  descripcion: string,
  precio_venta: number,
  stock_minimo: number,
  marca: string,
  categoria: string,
): Repuesto {
  return {
    codigo_oe,
    descripcion,
    precio_venta,
    stock_minimo,
    tCategoria_codigo_categoria: categoria,
    tMarca_codigo_marca: marca,
  }
}

export function crearProductosBase(): Repuesto[] {
  return [
    producto('04465-0K240', 'Pastillas de freno delanteras Hilux', 58.9, 8, 'TOY', 'FRE'),
    producto('90915-YZZD4', 'Filtro de aceite Corolla / Yaris', 7.45, 20, 'TOY', 'FIL'),
    producto('17801-0T030', 'Filtro de aire Hilux diésel', 18.6, 10, 'TOY', 'FIL'),
    producto('42431-0K030', 'Disco de freno delantero Hilux', 76.5, 6, 'TOY', 'FRE'),
    producto('G7345', 'Amortiguador delantero Hilux 4x4', 94.0, 4, 'MON', 'SUS'),
    producto('G8021', 'Amortiguador posterior Chevrolet D-Max', 88.4, 4, 'MON', 'SUS'),
    producto('94580825', 'Filtro de aceite Chevrolet Sail / Spark', 5.9, 25, 'CHV', 'FIL'),
    producto('K060775', 'Banda poly-V Chevrolet Sail 1.4', 21.35, 8, 'GAT', 'MOT'),
    producto('KP15598XS', 'Kit de distribución Hyundai Accent 1.6', 112.0, 3, 'GAT', 'MOT'),
    producto('BKR6E-11', 'Bujía estándar Kia Rio / Hyundai Accent', 4.8, 40, 'NGK', 'ENC'),
    producto('ILKAR7B11', 'Bujía de iridio Toyota Corolla', 14.9, 20, 'NGK', 'ENC'),
    producto('0986479V62', 'Alternador reconstruido 90A', 185.0, 2, 'BOS', 'ELE'),
    producto('0986024230', 'Motor de arranque Nissan Frontier D22', 142.3, 2, 'BOS', 'ELE'),
    producto('0092S40020', 'Batería 12V 65Ah libre de mantenimiento', 118.0, 5, 'BOS', 'ELE'),
    producto('P06047', 'Pastillas de freno traseras Kia Sportage', 37.25, 6, 'BRE', 'FRE'),
    producto('P28039', 'Pastillas de freno delanteras Hyundai Tucson', 52.8, 6, 'BRE', 'FRE'),
    producto('09.A819.11', 'Disco de freno ventilado Nissan Navara', 69.9, 4, 'BRE', 'FRE'),
    producto('234-9006', 'Sensor de oxígeno universal', 64.5, 4, 'DEN', 'ELE'),
    producto('DR-3210', 'Radiador de aluminio Hyundai Accent', 138.75, 2, 'DEN', 'REF'),
    producto('26300-35504', 'Filtro de aceite Hyundai Santa Fe / Tucson', 9.3, 15, 'HYU', 'FIL'),
    producto('28113-2P000', 'Filtro de aire Kia Sportage / Hyundai Tucson', 16.4, 10, 'KIA', 'FIL'),
    producto('15208-65F0A', 'Filtro de aceite Nissan Frontier / Sentra', 8.2, 15, 'NIS', 'FIL'),
    producto('30100-VK20A', 'Kit de embrague Nissan Frontier D22', 215.0, 2, 'NIS', 'TRA'),
    producto('XO-5W30-GAL', 'Aceite de motor 5W-30 sintético, galón', 38.9, 12, 'MTC', 'MOT'),
  ]
}

function stock(
  bodega: string,
  codigo_oe: string,
  cantidad: number,
  ubicacion: string,
): InventarioMock {
  return {
    tBodega_codigo_bodega: bodega,
    tProducto_codigo_oe: codigo_oe,
    cantidad,
    ubicacion,
  }
}

export function crearInventarioBase(): InventarioMock[] {
  return [
    // B1 · Central
    stock('B1', '04465-0K240', 24, 'A-01-1'),
    stock('B1', '90915-YZZD4', 80, 'B-02-3'),
    stock('B1', '17801-0T030', 35, 'B-02-4'),
    stock('B1', '42431-0K030', 14, 'A-01-2'),
    stock('B1', 'G7345', 9, 'C-04-1'),
    stock('B1', '94580825', 60, 'B-03-1'),
    stock('B1', 'K060775', 18, 'D-01-2'),
    stock('B1', 'BKR6E-11', 120, 'E-02-1'),
    stock('B1', '0092S40020', 12, 'F-01-1'),
    stock('B1', 'P28039', 11, 'A-02-3'),
    stock('B1', '26300-35504', 40, 'B-03-4'),
    stock('B1', 'XO-5W30-GAL', 30, 'G-01-1'),
    // B2 · Norte
    stock('B2', '90915-YZZD4', 25, 'A-01-1'),
    stock('B2', 'G8021', 6, 'C-02-1'),
    stock('B2', 'P06047', 10, 'D-01-3'),
    stock('B2', '28113-2P000', 14, 'B-01-2'),
    stock('B2', '0986479V62', 3, 'F-02-1'),
    stock('B2', 'ILKAR7B11', 22, 'E-01-2'),
    // B3 · Valle
    stock('B3', '94580825', 20, 'A-02-1'),
    stock('B3', 'BKR6E-11', 45, 'A-03-2'),
    stock('B3', 'KP15598XS', 4, 'C-01-1'),
    stock('B3', '234-9006', 5, 'D-02-1'),
    // B4 · Guayaquil
    stock('B4', '04465-0K240', 15, 'A-01-3'),
    stock('B4', '09.A819.11', 6, 'B-01-1'),
    stock('B4', '0986024230', 3, 'F-01-2'),
    stock('B4', '30100-VK20A', 2, 'H-01-1'),
    stock('B4', '15208-65F0A', 20, 'B-02-2'),
    // B5 · Cuenca
    stock('B5', '42431-0K030', 5, 'A-01-1'),
    stock('B5', 'DR-3210', 2, 'G-01-3'),
    stock('B5', 'XO-5W30-GAL', 16, 'C-01-2'),
  ]
}
