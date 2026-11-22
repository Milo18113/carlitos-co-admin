import type { Pago } from '@/types/pago'
import { haceDias } from '@/utils/fecha'

import type { FacturaMock } from '../tiposMock'

/** Un pago de la semilla: [monto, días atrás, forma de pago]. `0` días atrás = hoy (se puede eliminar). */
type PagoSemilla = readonly [monto: number, hace: number, forma: string]

interface FacturaSemilla {
  secuencial: number
  hace: number
  cliente: string
  empleado: string
  total: number
  devolucion: number
  pagos: readonly PagoSemilla[]
}

/**
 * 25 facturas. Las 101, 105 y 112 están pagadas por completo: no aparecen en
 * `Cuentas_por_cobrar` (la vista exige saldo >= 0.01). Las que tienen un pago de hoy
 * (122, 123, 124) sirven para probar el camino feliz de eliminar un pago.
 */
const SEMILLAS: readonly FacturaSemilla[] = [
  {
    secuencial: 101,
    hace: 62,
    cliente: '0991234567001',
    empleado: 'E002',
    total: 1245.8,
    devolucion: 0,
    pagos: [
      [600, 55, '20'],
      [645.8, 40, '20'],
    ],
  },
  {
    secuencial: 102,
    hace: 58,
    cliente: '1790012345001',
    empleado: 'E002',
    total: 892.35,
    devolucion: 0,
    pagos: [[300, 50, '20']],
  },
  {
    secuencial: 103,
    hace: 55,
    cliente: '1712345678',
    empleado: 'E003',
    total: 156.4,
    devolucion: 0,
    pagos: [],
  },
  {
    secuencial: 104,
    hace: 51,
    cliente: '1791234567001',
    empleado: 'E002',
    total: 2310,
    devolucion: 120.75,
    pagos: [
      [1000, 45, '20'],
      [500, 30, '01'],
    ],
  },
  {
    secuencial: 105,
    hace: 47,
    cliente: '1803456789',
    empleado: 'E003',
    total: 78.2,
    devolucion: 0,
    pagos: [[78.2, 47, '01']],
  },
  {
    secuencial: 106,
    hace: 44,
    cliente: '0102345678',
    empleado: 'E004',
    total: 430.55,
    devolucion: 0,
    pagos: [[200, 40, '16']],
  },
  {
    secuencial: 107,
    hace: 40,
    cliente: '1792345678001',
    empleado: 'E002',
    total: 3890.1,
    devolucion: 0,
    pagos: [[1500, 35, '20']],
  },
  {
    secuencial: 108,
    hace: 38,
    cliente: '1391234567001',
    empleado: 'E004',
    total: 615,
    devolucion: 0,
    pagos: [],
  },
  {
    secuencial: 109,
    hace: 35,
    cliente: '0992345678001',
    empleado: 'E003',
    total: 1780.45,
    devolucion: 250,
    pagos: [[800, 30, '20']],
  },
  {
    secuencial: 110,
    hace: 33,
    cliente: '1104567890',
    empleado: 'E002',
    total: 224.9,
    devolucion: 0,
    pagos: [[100, 20, '01']],
  },
  {
    secuencial: 111,
    hace: 30,
    cliente: '1002345678',
    empleado: 'E005',
    total: 97.3,
    devolucion: 0,
    pagos: [],
  },
  {
    secuencial: 112,
    hace: 28,
    cliente: '1713456789',
    empleado: 'E003',
    total: 542.75,
    devolucion: 0,
    pagos: [[542.75, 27, '19']],
  },
  {
    secuencial: 113,
    hace: 26,
    cliente: '0190123456001',
    empleado: 'E004',
    total: 1325.6,
    devolucion: 0,
    pagos: [[600, 20, '20']],
  },
  {
    secuencial: 114,
    hace: 24,
    cliente: '1705678901',
    empleado: 'E002',
    total: 188.15,
    devolucion: 0,
    pagos: [],
  },
  {
    secuencial: 115,
    hace: 21,
    cliente: '1790012345001',
    empleado: 'E003',
    total: 967.4,
    devolucion: 0,
    pagos: [[400, 10, '20']],
  },
  {
    secuencial: 116,
    hace: 19,
    cliente: '1792345678001',
    empleado: 'E002',
    total: 2745.3,
    devolucion: 0,
    pagos: [[1000, 12, '20']],
  },
  {
    secuencial: 117,
    hace: 17,
    cliente: '0991234567001',
    empleado: 'E004',
    total: 356.8,
    devolucion: 35.68,
    pagos: [],
  },
  {
    secuencial: 118,
    hace: 14,
    cliente: '1712345678',
    empleado: 'E005',
    total: 412,
    devolucion: 0,
    pagos: [[150, 9, '16']],
  },
  {
    secuencial: 119,
    hace: 12,
    cliente: '1791234567001',
    empleado: 'E003',
    total: 1590.25,
    devolucion: 0,
    pagos: [],
  },
  {
    secuencial: 120,
    hace: 10,
    cliente: '0992345678001',
    empleado: 'E002',
    total: 805.6,
    devolucion: 0,
    pagos: [[300, 5, '20']],
  },
  {
    secuencial: 121,
    hace: 8,
    cliente: '1803456789',
    empleado: 'E004',
    total: 133.45,
    devolucion: 0,
    pagos: [],
  },
  {
    secuencial: 122,
    hace: 6,
    cliente: '0102345678',
    empleado: 'E003',
    total: 698.9,
    devolucion: 0,
    pagos: [[300, 0, '01']],
  },
  {
    secuencial: 123,
    hace: 4,
    cliente: '1790012345001',
    empleado: 'E002',
    total: 1120,
    devolucion: 0,
    pagos: [[500, 0, '20']],
  },
  {
    secuencial: 124,
    hace: 3,
    cliente: '1391234567001',
    empleado: 'E005',
    total: 274.35,
    devolucion: 0,
    pagos: [[100, 0, '16']],
  },
  {
    secuencial: 125,
    hace: 1,
    cliente: '1792345678001',
    empleado: 'E001',
    total: 4210.75,
    devolucion: 0,
    pagos: [],
  },
]

/** Mismo formato de serie que el SRI: establecimiento-punto-secuencial de 9 dígitos. */
function numeroFactura(secuencial: number): string {
  return `001-001-${String(secuencial).padStart(9, '0')}`
}

export function crearFacturasYPagosBase(): { facturas: FacturaMock[]; pagos: Pago[] } {
  const facturas: FacturaMock[] = []
  const pagos: Pago[] = []

  for (const semilla of SEMILLAS) {
    const numero = numeroFactura(semilla.secuencial)
    facturas.push({
      numero_factura: numero,
      fecha_emision: haceDias(semilla.hace),
      estado: 'EMITIDA',
      tCliente_numero_identificacion: semilla.cliente,
      tEmpleado_codigo_empleado: semilla.empleado,
      total: semilla.total,
      devolucion: semilla.devolucion,
    })

    for (const [monto, hace, forma] of semilla.pagos) {
      pagos.push({
        codigo_pago: `PAG-${String(pagos.length + 1).padStart(4, '0')}`,
        fecha: haceDias(hace),
        monto,
        referencia: forma === '20' ? `TRF-${semilla.secuencial}${pagos.length + 1}` : null,
        tFactura_numero_factura: numero,
        tFormaPago_codigo_forma_pago: forma,
      })
    }
  }

  return { facturas, pagos }
}
