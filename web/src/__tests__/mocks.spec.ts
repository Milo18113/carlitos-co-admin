import { beforeEach, describe, expect, it } from 'vitest'

import { ReglaNegocioError, NoAutorizadoError } from '@/services/errores'
import { authMock } from '@/services/mocks/authMock'
import { clientesMock } from '@/services/mocks/clientesMock'
import { empleadosMock } from '@/services/mocks/empleadosMock'
import { reiniciarBaseMock } from '@/services/mocks/estado'
import { pagosMock } from '@/services/mocks/pagosMock'
import { reportesMock } from '@/services/mocks/reportesMock'
import { repuestosMock } from '@/services/mocks/repuestosMock'
import { limpiarSesionMock } from '@/services/mocks/sesionMock'
import { espera } from '@/services/mocks/simulador'
import { haceDias } from '@/utils/fecha'

const FACTURA_CON_SALDO = '001-001-000000102' // total 892.35, pagado 300 → saldo 592.35
const PAGO_DE_HOY = 'PAG-0017' // primer pago de hoy de la fixture (factura 122)

async function iniciarComoAdmin(): Promise<void> {
  await authMock.iniciarSesion({ usuario: 'admin', contrasena: 'admin123' })
}

beforeEach(() => {
  espera.minimoMs = 0
  espera.maximoMs = 0
  reiniciarBaseMock()
  limpiarSesionMock()
})

describe('sesión del mock', () => {
  it('entra con el usuario demo y devuelve rol y datos sin contraseña', async () => {
    const sesion = await authMock.iniciarSesion({ usuario: 'vendedor', contrasena: 'vendedor123' })

    expect(sesion).toMatchObject({ usuario: 'vendedor', codigo_rol: 2, rol: 'Vendedor' })
    expect(sesion).not.toHaveProperty('contrasena')
  })

  it('rechaza con 401 una contraseña incorrecta', async () => {
    await expect(
      authMock.iniciarSesion({ usuario: 'admin', contrasena: 'incorrecta' }),
    ).rejects.toBeInstanceOf(NoAutorizadoError)
  })

  it('rechaza con 401 a un empleado inactivo aunque la contraseña sea correcta', async () => {
    await expect(
      authMock.iniciarSesion({ usuario: 'jperez', contrasena: 'demo1234' }),
    ).rejects.toBeInstanceOf(NoAutorizadoError)
  })

  it('responde 401 a cualquier endpoint si no hay sesión', async () => {
    await expect(reportesMock.obtener('bodegas')).rejects.toBeInstanceOf(NoAutorizadoError)
  })

  it('vuelve a pedir login después de cerrar sesión', async () => {
    await iniciarComoAdmin()
    await authMock.cerrarSesion()

    await expect(authMock.obtenerSesion()).rejects.toBeInstanceOf(NoAutorizadoError)
  })
})

describe('reportes del mock', () => {
  it('Cuentas_por_cobrar solo trae facturas con saldo y no las pagadas por completo', async () => {
    await iniciarComoAdmin()

    const filas = await reportesMock.obtener('cuentas-por-cobrar')

    expect(filas.length).toBeGreaterThanOrEqual(15)
    expect(filas.every((fila) => fila.Saldo >= 0.01)).toBe(true)
    expect(filas.map((fila) => fila.seriefactura)).not.toContain('001-001-000000101')
  })

  it('un pago nuevo baja el saldo en el reporte', async () => {
    await iniciarComoAdmin()
    await pagosMock.registrar({
      codigo_pago: 'PAG-X1',
      numero_factura: FACTURA_CON_SALDO,
      monto: 92.35,
      forma_pago: '01',
      referencia: null,
    })

    const filas = await reportesMock.obtener('cuentas-por-cobrar')

    expect(filas.find((f) => f.seriefactura === FACTURA_CON_SALDO)?.Saldo).toBe(500)
  })
})

describe('procedures simulados (ROLLBACK → ReglaNegocioError)', () => {
  beforeEach(iniciarComoAdmin)

  it('registrar_pago: un pago mayor al saldo se rechaza con el texto del procedure', async () => {
    await expect(
      pagosMock.registrar({
        codigo_pago: 'PAG-X2',
        numero_factura: FACTURA_CON_SALDO,
        monto: 600,
        forma_pago: '01',
        referencia: null,
      }),
    ).rejects.toMatchObject({
      name: 'ReglaNegocioError',
      message: 'el pago de 600.00 supera el saldo pendiente de 592.35',
    })
  })

  it('registrar_pago: el mensaje de éxito no trae el prefijo COMMIT', async () => {
    const respuesta = await pagosMock.registrar({
      codigo_pago: 'PAG-X3',
      numero_factura: FACTURA_CON_SALDO,
      monto: 92.35,
      forma_pago: '01',
      referencia: null,
    })

    expect(respuesta.mensaje).toBe('pago PAG-X3 de 92.35 registrado. Saldo pendiente: 500.00')
  })

  it('trasladar_repuesto: más unidades que el stock de la bodega se rechaza', async () => {
    await expect(
      repuestosMock.trasladar({
        codigo_oe: 'G7345',
        bodega_origen: 'B1',
        bodega_destino: 'B2',
        cantidad: 10,
        ubicacion_destino: null,
      }),
    ).rejects.toMatchObject({ message: 'la bodega B1 solo tiene 9 unidad(es) de G7345' })
  })

  it('trasladar_repuesto: mover todo el stock elimina la fila de origen', async () => {
    const respuesta = await repuestosMock.trasladar({
      codigo_oe: 'G7345',
      bodega_origen: 'B1',
      bodega_destino: 'B2',
      cantidad: 9,
      ubicacion_destino: 'C-09-1',
    })

    expect(respuesta.mensaje).toContain('Quedan 0 en B1 (fila eliminada) y 9 en B2')
    const disponibles = await reportesMock.obtener('repuestos-disponibles')
    expect(disponibles.some((f) => f.Bodega === 'B1' && f.Codigo_oe === 'G7345')).toBe(false)
  })

  it('eliminar_pago: un pago que no es de hoy se rechaza', async () => {
    await expect(pagosMock.eliminar('PAG-0001')).rejects.toMatchObject({
      message: `el pago PAG-0001 es del ${haceDias(55)}; solo se eliminan pagos registrados hoy`,
    })
  })

  it('eliminar_pago: un pago de hoy se elimina y desaparece del listado', async () => {
    const respuesta = await pagosMock.eliminar(PAGO_DE_HOY)

    expect(respuesta.mensaje).toContain(`se elimino el pago ${PAGO_DE_HOY}`)
    const pagos = await pagosMock.listar()
    expect(pagos.map((p) => p.codigo_pago)).not.toContain(PAGO_DE_HOY)
  })

  it('registrar_cliente: un RUC con menos de 13 dígitos se rechaza', async () => {
    await expect(
      clientesMock.registrar({
        numero_identificacion: '1790012345',
        codigo_tipo: '04',
        razon_social: 'Taller Nuevo',
        telefono: null,
        email: null,
        direccion: null,
        codigo_ciudad: null,
      }),
    ).rejects.toMatchObject({ message: 'un RUC tiene 13 digitos y una cedula 10' })
  })

  it('registrar_cliente: guarda la razón social en mayúsculas y aparece en el listado', async () => {
    await clientesMock.registrar({
      numero_identificacion: '1750000011',
      codigo_tipo: '05',
      razon_social: 'Lucía Mora',
      telefono: null,
      email: 'lucia@example.com',
      direccion: null,
      codigo_ciudad: 'UIO',
    })

    const clientes = await clientesMock.listar()
    expect(clientes.find((c) => c.numero_identificacion === '1750000011')?.razon_social).toBe(
      'LUCÍA MORA',
    )
  })

  it('contratar_empleado: el usuario repetido de otro empleado se rechaza', async () => {
    const intento = empleadosMock.contratar({
      codigo_empleado: 'E011',
      cedula: '1712340110',
      nombres: 'Nuevo',
      apellidos: 'Empleado',
      codigo_rol: 2,
      usuario: 'vendedor',
      contrasena: 'clave',
    })

    await expect(intento).rejects.toBeInstanceOf(ReglaNegocioError)
    await expect(intento).rejects.toMatchObject({
      message: 'el usuario vendedor ya lo usa otro empleado',
    })
  })

  it('contratar_empleado: recontratar una cédula inactiva conserva su código', async () => {
    const respuesta = await empleadosMock.contratar({
      codigo_empleado: 'E099',
      cedula: '1712340086', // Javier Pérez, inactivo
      nombres: 'Javier',
      apellidos: 'Pérez',
      codigo_rol: 2,
      usuario: 'jperez2',
      contrasena: 'clave',
    })

    expect(respuesta.mensaje).toBe('Javier Pérez recontratado, conserva el codigo E008')
  })
})
