import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ErrorServidor } from '@/services/errores'
import { authMock } from '@/services/mocks/authMock'
import { reiniciarBaseMock } from '@/services/mocks/estado'
import { pagosMock } from '@/services/mocks/pagosMock'
import { reportesMock } from '@/services/mocks/reportesMock'
import { limpiarSesionMock } from '@/services/mocks/sesionMock'
import { espera } from '@/services/mocks/simulador'
import { useReportesStore } from '@/stores/reportes'

// Los tests usan los mocks y no necesitan un `.env`.
vi.mock('@/config/env', () => ({ env: { apiUrl: '/api', usarMocks: true } }))

/** Una respuesta que el test resuelve cuando quiere, para controlar el orden en que llegan. */
function respuestaManual<T>() {
  let resolver!: (valor: T) => void
  const promesa = new Promise<T>((resolve) => {
    resolver = resolve
  })
  return { promesa, resolver }
}

beforeEach(async () => {
  setActivePinia(createPinia())
  espera.minimoMs = 0
  espera.maximoMs = 0
  reiniciarBaseMock()
  limpiarSesionMock()
  await authMock.iniciarSesion({ usuario: 'admin', contrasena: 'admin123' })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('store reportes · caché', () => {
  it('guarda las filas y la segunda carga no vuelve a pedirlas', async () => {
    const espia = vi.spyOn(reportesMock, 'obtener')
    const reportes = useReportesStore()

    await reportes.cargar('bodegas')
    await reportes.cargar('bodegas')

    expect(espia).toHaveBeenCalledTimes(1)
    expect(reportes.filasDe('bodegas')).toHaveLength(5)
  })

  it('dos cargas a la vez comparten una sola petición y las dos ven los datos', async () => {
    const espia = vi.spyOn(reportesMock, 'obtener')
    const reportes = useReportesStore()

    // Es el caso del dashboard y la pantalla de reportes pidiendo la misma vista juntos.
    await Promise.all([reportes.cargar('bodegas'), reportes.cargar('bodegas')])

    expect(espia).toHaveBeenCalledTimes(1)
    expect(reportes.filasDe('bodegas')).toHaveLength(5)
  })

  it('`force` salta la caché y vuelve a pedir', async () => {
    const espia = vi.spyOn(reportesMock, 'obtener')
    const reportes = useReportesStore()
    await reportes.cargar('bodegas')

    await reportes.cargar('bodegas', { force: true })

    expect(espia).toHaveBeenCalledTimes(2)
  })

  it('cada vista tiene su propio estado de carga', async () => {
    const lenta = respuestaManual<never[]>()
    vi.spyOn(reportesMock, 'obtener').mockImplementationOnce(() => lenta.promesa as never)
    const reportes = useReportesStore()

    const pendiente = reportes.cargar('bodegas')

    expect(reportes.estaCargando('bodegas')).toBe(true)
    expect(reportes.estaCargando('empleados')).toBe(false)

    lenta.resolver([])
    await pendiente
    expect(reportes.estaCargando('bodegas')).toBe(false)
  })
})

describe('store reportes · invalidación', () => {
  it('invalidar vacía la caché y la próxima carga pide datos nuevos', async () => {
    const espia = vi.spyOn(reportesMock, 'obtener')
    const reportes = useReportesStore()
    await reportes.cargar('bodegas')

    reportes.invalidar()
    expect(reportes.filasDe('bodegas')).toBeUndefined()

    await reportes.cargar('bodegas')
    expect(espia).toHaveBeenCalledTimes(2)
  })

  it('un pago nuevo solo se ve en el reporte después de invalidar', async () => {
    const reportes = useReportesStore()
    await reportes.cargar('cuentas-por-cobrar')
    const saldoAntes = reportes
      .filasDe('cuentas-por-cobrar')
      ?.find((fila) => fila.seriefactura === '001-001-000000102')?.Saldo

    await pagosMock.registrar({
      codigo_pago: 'PAG-E1',
      numero_factura: '001-001-000000102',
      monto: 92.35,
      forma_pago: '01',
      referencia: null,
    })
    await reportes.cargar('cuentas-por-cobrar')
    // Sin invalidar sigue la caché: por eso cada escritura que sale bien tiene que invalidar.
    expect(
      reportes.filasDe('cuentas-por-cobrar')?.find((f) => f.seriefactura === '001-001-000000102')
        ?.Saldo,
    ).toBe(saldoAntes)

    reportes.invalidar()
    await reportes.cargar('cuentas-por-cobrar')

    expect(
      reportes.filasDe('cuentas-por-cobrar')?.find((f) => f.seriefactura === '001-001-000000102')
        ?.Saldo,
    ).toBe(500)
  })

  it('una respuesta que salió antes de invalidar se descarta y no pisa a la nueva', async () => {
    const vieja = respuestaManual<never[]>()
    vi.spyOn(reportesMock, 'obtener').mockImplementationOnce(() => vieja.promesa as never)
    const reportes = useReportesStore()

    const peticionVieja = reportes.cargar('bodegas')
    reportes.invalidar() // hubo una escritura mientras la primera petición seguía en camino
    await reportes.cargar('bodegas') // pide de nuevo: no se une a la vieja

    expect(reportes.filasDe('bodegas')).toHaveLength(5)

    vieja.resolver([]) // llega tarde, con datos de antes de la escritura
    await peticionVieja

    expect(reportes.filasDe('bodegas')).toHaveLength(5)
    expect(reportes.estaCargando('bodegas')).toBe(false)
  })

  it('la petición vieja no apaga el loading de la nueva', async () => {
    const vieja = respuestaManual<never[]>()
    const nueva = respuestaManual<never[]>()
    vi.spyOn(reportesMock, 'obtener')
      .mockImplementationOnce(() => vieja.promesa as never)
      .mockImplementationOnce(() => nueva.promesa as never)
    const reportes = useReportesStore()

    const peticionVieja = reportes.cargar('bodegas')
    reportes.invalidar()
    const peticionNueva = reportes.cargar('bodegas')

    vieja.resolver([])
    await peticionVieja
    // La nueva todavía no llegó: el spinner no puede haberse apagado.
    expect(reportes.estaCargando('bodegas')).toBe(true)

    nueva.resolver([])
    await peticionNueva
    expect(reportes.estaCargando('bodegas')).toBe(false)
  })
})

describe('store reportes · errores', () => {
  it('guarda el mensaje del error y "reintentar" (force) lo limpia al salir bien', async () => {
    vi.spyOn(reportesMock, 'obtener').mockRejectedValueOnce(new ErrorServidor('Sin conexión'))
    const reportes = useReportesStore()

    await reportes.cargar('empleados')

    expect(reportes.errorDe('empleados')).toBe('Sin conexión')
    expect(reportes.filasDe('empleados')).toBeUndefined()
    expect(reportes.estaCargando('empleados')).toBe(false)

    await reportes.cargar('empleados', { force: true })

    expect(reportes.errorDe('empleados')).toBeNull()
    expect(reportes.filasDe('empleados')).toHaveLength(10)
  })

  it('un error en una vista no toca a las demás', async () => {
    vi.spyOn(reportesMock, 'obtener').mockRejectedValueOnce(new ErrorServidor('Sin conexión'))
    const reportes = useReportesStore()

    await reportes.cargar('empleados')
    await reportes.cargar('bodegas')

    expect(reportes.errorDe('empleados')).toBe('Sin conexión')
    expect(reportes.errorDe('bodegas')).toBeNull()
    expect(reportes.filasDe('bodegas')).toHaveLength(5)
  })
})
