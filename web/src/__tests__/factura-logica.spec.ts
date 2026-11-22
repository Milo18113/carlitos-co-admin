import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NoAutorizadoError } from '@/services/errores'
import { authMock } from '@/services/mocks/authMock'
import { baseMock, reiniciarBaseMock } from '@/services/mocks/estado'
import { facturasMock } from '@/services/mocks/facturasMock'
import { limpiarSesionMock } from '@/services/mocks/sesionMock'
import { espera } from '@/services/mocks/simulador'
import { cuentasPorCobrar } from '@/services/mocks/vistas'
import type { FacturaNueva } from '@/types/factura'
import { calcularTotales, valorDeLinea } from '@/utils/factura'
import { validarPorcentaje } from '@/utils/validaciones'

// Los tests usan los mocks y no necesitan un `.env`.
vi.mock('@/config/env', () => ({ env: { apiUrl: '/api', usarMocks: true } }))

describe('valorDeLinea y calcularTotales', () => {
  const amortiguador = { precioUnitario: 94, cantidad: 2, porcentajeDescuento: 10 }
  const sinDescuento = { precioUnitario: 94, cantidad: 1, porcentajeDescuento: 0 }

  it('el valor de una línea es cantidad × precio menos su descuento, sin IVA', () => {
    expect(valorDeLinea(amortiguador)).toBeCloseTo(169.2, 10)
    expect(valorDeLinea(sinDescuento)).toBe(94)
  })

  it('calcula subtotal, descuento, IVA y total de una línea', () => {
    expect(calcularTotales([amortiguador], 15)).toEqual({
      subtotal: 188,
      descuento: 18.8,
      base: 169.2,
      iva: 25.38,
      total: 194.58,
    })
  })

  it('suma varias líneas', () => {
    const totales = calcularTotales([amortiguador, sinDescuento], 15)

    expect(totales.subtotal).toBe(282)
    expect(totales.base).toBe(263.2)
    expect(totales.total).toBe(302.68)
  })

  it('el total es la suma de lo que se muestra: nunca queda un centavo de diferencia en pantalla', () => {
    const totales = calcularTotales(
      [{ precioUnitario: 5.9, cantidad: 3, porcentajeDescuento: 7.5 }],
      15,
    )

    expect(totales.total).toBeCloseTo(totales.base + totales.iva, 10)
  })

  it('sin líneas todo es cero', () => {
    expect(calcularTotales([], 15)).toEqual({
      subtotal: 0,
      descuento: 0,
      base: 0,
      iva: 0,
      total: 0,
    })
  })

  it('con IVA 0 el total es la base, y con 100 % de descuento no hay nada que cobrar', () => {
    expect(calcularTotales([amortiguador], 0).total).toBe(169.2)
    expect(
      calcularTotales([{ precioUnitario: 94, cantidad: 2, porcentajeDescuento: 100 }], 15).total,
    ).toBe(0)
  })
})

describe('validarPorcentaje', () => {
  it('acepta de 0 a 100 con hasta 2 decimales, con coma o con punto', () => {
    expect(validarPorcentaje('0')).toBeNull()
    expect(validarPorcentaje('12,5')).toBeNull()
    expect(validarPorcentaje('100')).toBeNull()
  })

  it('rechaza lo que pasa de 100, el texto, los negativos y los 3 decimales', () => {
    expect(validarPorcentaje('101')).toBe('El descuento va de 0 a 100')
    expect(validarPorcentaje('abc')).toBe('El descuento va de 0 a 100')
    expect(validarPorcentaje('-5')).toBe('El descuento va de 0 a 100')
    expect(validarPorcentaje('')).toBe('El descuento va de 0 a 100')
    expect(validarPorcentaje('1,234')).toBe('El descuento admite hasta 2 decimales')
  })
})

describe('mock de POST /api/facturas (propuesta)', () => {
  const factura = (cambios: Partial<FacturaNueva> = {}): FacturaNueva => ({
    numero_identificacion: '1790012345001',
    porcentaje_iva: 15,
    forma_pago: null,
    lineas: [{ codigo_oe: 'G7345', cantidad: 2, porcentaje_descuento: 10 }],
    ...cambios,
  })

  beforeEach(async () => {
    espera.minimoMs = 0
    espera.maximoMs = 0
    reiniciarBaseMock()
    limpiarSesionMock()
    await authMock.iniciarSesion({ usuario: 'admin', contrasena: 'admin123' })
  })

  it('emite la factura con el siguiente número de la serie y el total con IVA', async () => {
    const antes = baseMock.facturas.length

    const respuesta = await facturasMock.emitir(factura())

    expect(respuesta.mensaje).toBe(
      'factura 001-001-000000126 emitida. Total: 194.58. Queda con saldo por cobrar',
    )
    expect(baseMock.facturas).toHaveLength(antes + 1)
    expect(baseMock.facturas[baseMock.facturas.length - 1]).toMatchObject({
      numero_factura: '001-001-000000126',
      estado: 'EMITIDA',
      tCliente_numero_identificacion: '1790012345001',
      tEmpleado_codigo_empleado: 'E001', // el empleado de la sesión (admin)
      total: 194.58,
    })
  })

  it('dos facturas seguidas llevan números consecutivos', async () => {
    await facturasMock.emitir(factura())
    const segunda = await facturasMock.emitir(factura())

    expect(segunda.mensaje).toContain('001-001-000000127')
  })

  it('una factura a crédito aparece en cuentas por cobrar con todo su total como saldo', async () => {
    await facturasMock.emitir(factura())

    const nueva = cuentasPorCobrar().find((fila) => fila.seriefactura === '001-001-000000126')
    expect(nueva).toMatchObject({ Total: 194.58, Saldo: 194.58, pagado: 0 })
  })

  it('al contado registra un pago por el total y la factura no queda con saldo', async () => {
    const pagosAntes = baseMock.pagos.length

    const respuesta = await facturasMock.emitir(factura({ forma_pago: '01' }))

    expect(respuesta.mensaje).toContain('Pagada al contado')
    expect(baseMock.pagos).toHaveLength(pagosAntes + 1)
    expect(baseMock.pagos[baseMock.pagos.length - 1]).toMatchObject({
      tFactura_numero_factura: '001-001-000000126',
      monto: 194.58,
      tFormaPago_codigo_forma_pago: '01',
    })
    expect(cuentasPorCobrar().some((f) => f.seriefactura === '001-001-000000126')).toBe(false)
  })

  it.each([
    [
      'un cliente que no existe',
      { numero_identificacion: '1111111111' },
      'el cliente 1111111111 no existe',
    ],
    ['una factura sin líneas', { lineas: [] }, 'la factura necesita al menos una linea'],
    ['una forma de pago que no existe', { forma_pago: '99' }, 'la forma de pago 99 no existe'],
    ['un IVA fuera de rango', { porcentaje_iva: 150 }, 'el IVA debe estar entre 0 y 100'],
    [
      'un repuesto que no existe',
      { lineas: [{ codigo_oe: 'NO-EXISTE', cantidad: 1, porcentaje_descuento: 0 }] },
      'el repuesto NO-EXISTE no existe',
    ],
    [
      'una cantidad de 0',
      { lineas: [{ codigo_oe: 'G7345', cantidad: 0, porcentaje_descuento: 0 }] },
      'la cantidad de G7345 debe ser mayor que 0',
    ],
    [
      'un descuento de más de 100',
      { lineas: [{ codigo_oe: 'G7345', cantidad: 1, porcentaje_descuento: 101 }] },
      'el descuento de G7345 debe estar entre 0 y 100',
    ],
    [
      'el mismo repuesto en dos líneas (la clave de tDetalleFactura es repuesto + factura)',
      {
        lineas: [
          { codigo_oe: 'G7345', cantidad: 1, porcentaje_descuento: 0 },
          { codigo_oe: 'G7345', cantidad: 2, porcentaje_descuento: 0 },
        ],
      },
      'el repuesto G7345 esta repetido en la factura',
    ],
  ] satisfies [string, Partial<FacturaNueva>, string][])(
    'rechaza %s con el texto de la regla',
    async (_nombre, cambios, mensaje) => {
      await expect(facturasMock.emitir(factura(cambios))).rejects.toMatchObject({
        name: 'ReglaNegocioError',
        message: mensaje,
      })
    },
  )

  it('es todo o nada: si una línea falla no queda ni la cabecera ni el pago', async () => {
    const facturasAntes = baseMock.facturas.length
    const pagosAntes = baseMock.pagos.length

    await expect(
      facturasMock.emitir(
        factura({
          forma_pago: '01',
          lineas: [
            { codigo_oe: 'G7345', cantidad: 1, porcentaje_descuento: 0 },
            { codigo_oe: 'NO-EXISTE', cantidad: 1, porcentaje_descuento: 0 },
          ],
        }),
      ),
    ).rejects.toBeInstanceOf(Error)

    expect(baseMock.facturas).toHaveLength(facturasAntes)
    expect(baseMock.pagos).toHaveLength(pagosAntes)
  })

  it('sin sesión responde 401', async () => {
    limpiarSesionMock()

    await expect(facturasMock.emitir(factura())).rejects.toBeInstanceOf(NoAutorizadoError)
  })
})
