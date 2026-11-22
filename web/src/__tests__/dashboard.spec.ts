import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'

import App from '@/App.vue'
import GraficoBarras from '@/components/dashboard/GraficoBarras.vue'
import { crearRouter } from '@/router'
import { ErrorServidor } from '@/services/errores'
import { authMock } from '@/services/mocks/authMock'
import { baseMock, reiniciarBaseMock } from '@/services/mocks/estado'
import { reportesMock } from '@/services/mocks/reportesMock'
import { limpiarSesionMock } from '@/services/mocks/sesionMock'
import { espera } from '@/services/mocks/simulador'
import { cuentasPorCobrar, bodegasDisponibles } from '@/services/mocks/vistas'
import { formatearEntero, formatearMoneda, redondearMoneda } from '@/utils/moneda'

// Los tests usan los mocks y no necesitan un `.env`.
vi.mock('@/config/env', () => ({ env: { apiUrl: '/api', usarMocks: true } }))

const COLORES_DEL_TEMA: Record<string, string> = {
  '--cc-chart-1': '#005B8A',
  '--cc-chart-2': '#BF873A',
  '--cc-chart-3': '#3691BA',
  '--cc-chart-4': '#9A5929',
  '--cc-chart-5': '#2B9477',
  '--cc-chart-6': '#7E65A9',
  '--cc-chart-other': '#9BA6B2',
}

let wrapper: VueWrapper | undefined

async function montarDashboard() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = crearRouter(createMemoryHistory())
  await router.push('/')
  await router.isReady()
  // El gráfico se reemplaza por un stub: jsdom no tiene canvas. Lo que se prueba es qué datos recibe.
  wrapper = mount(App, { global: { plugins: [pinia, router], stubs: { GraficoBarras: true } } })
  return { router, wrapper }
}

function valoresDeLosKpi(): string[] {
  return (wrapper?.findAll('.cc-kpi__value') ?? []).map((valor) => valor.text())
}

beforeEach(async () => {
  espera.minimoMs = 0
  espera.maximoMs = 0
  reiniciarBaseMock()
  limpiarSesionMock()
  for (const [nombre, valor] of Object.entries(COLORES_DEL_TEMA)) {
    document.documentElement.style.setProperty(nombre, valor)
  }
  await authMock.iniciarSesion({ usuario: 'admin', contrasena: 'admin123' })
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.restoreAllMocks()
  for (const nombre of Object.keys(COLORES_DEL_TEMA)) {
    document.documentElement.style.removeProperty(nombre)
  }
})

describe('dashboard · KPIs (CU-03)', () => {
  it('muestra el saldo por cobrar, el valor en bodegas y los repuestos con stock', async () => {
    await montarDashboard()

    const saldo = redondearMoneda(cuentasPorCobrar().reduce((suma, c) => suma + c.Saldo, 0))
    const valor = redondearMoneda(
      bodegasDisponibles().reduce((suma, b) => suma + b.Valor_Bodega, 0),
    )
    const repuestos = new Set(
      baseMock.inventario
        .filter((fila) => fila.cantidad > 0)
        .map((fila) => fila.tProducto_codigo_oe),
    ).size

    await vi.waitFor(() =>
      expect(valoresDeLosKpi()).toEqual([
        formatearMoneda(saldo),
        formatearMoneda(valor),
        formatearEntero(repuestos),
      ]),
    )
  })

  it('cada KPI explica de dónde sale la cifra', async () => {
    await montarDashboard()

    await vi.waitFor(() => expect(wrapper?.find('.cc-kpi__hint').exists()).toBe(true))
    const detalles = (wrapper?.findAll('.cc-kpi__hint') ?? []).map((detalle) => detalle.text())
    expect(detalles[0]).toBe('22 facturas con saldo')
    expect(detalles[1]).toBe('5 bodegas')
    expect(detalles[2]).toMatch(/unidades en total$/)
  })

  it('mientras carga los KPI muestran el skeleton y no una cifra', async () => {
    await montarDashboard()

    const tarjetas = wrapper?.findAll('.cc-kpi') ?? []
    expect(tarjetas).toHaveLength(3)
    expect(tarjetas.every((tarjeta) => tarjeta.attributes('aria-busy') === 'true')).toBe(true)
    expect(tarjetas.every((tarjeta) => tarjeta.find('.placeholder').exists())).toBe(true)

    await vi.waitFor(() => expect(wrapper?.findAll('.cc-kpi .placeholder')).toHaveLength(0))
  })
})

describe('dashboard · gráficos', () => {
  async function esperarGraficos() {
    await montarDashboard()
    await vi.waitFor(() => expect(wrapper?.findAllComponents(GraficoBarras)).toHaveLength(2))
    return wrapper?.findAllComponents(GraficoBarras) ?? []
  }

  it('la venta por marca va apilada: 6 categorías con color propio y el resto en "Otros"', async () => {
    const [ventas] = await esperarGraficos()

    const props = ventas?.props()
    expect(props?.apilado).toBe(true)
    expect(props?.series).toHaveLength(7)
    expect(props?.etiquetas).toHaveLength(12) // una barra por marca
    const colores = props?.series.map((serie: { color: string }) => serie.color)
    expect(colores).toEqual([
      COLORES_DEL_TEMA['--cc-chart-1'],
      COLORES_DEL_TEMA['--cc-chart-2'],
      COLORES_DEL_TEMA['--cc-chart-3'],
      COLORES_DEL_TEMA['--cc-chart-4'],
      COLORES_DEL_TEMA['--cc-chart-5'],
      COLORES_DEL_TEMA['--cc-chart-6'],
      COLORES_DEL_TEMA['--cc-chart-other'],
    ])
  })

  it('no se repite ningún color entre las series', async () => {
    const [ventas] = await esperarGraficos()

    const colores = ventas?.props().series.map((serie: { color: string }) => serie.color) ?? []

    expect(new Set(colores).size).toBe(colores.length)
  })

  it('la leyenda HTML tiene un punto por serie, con su mismo color, y "Otros" al final', async () => {
    await esperarGraficos()

    const items = wrapper?.findAll('.cc-legend__item') ?? []
    expect(items).toHaveLength(7)
    expect(items[6]?.text()).toBe('Otros')
    expect(items[6]?.find('.cc-legend__dot').attributes('style')).toContain(
      COLORES_DEL_TEMA['--cc-chart-other'],
    )
    expect(items[0]?.find('.cc-legend__dot').attributes('style')).toContain(
      COLORES_DEL_TEMA['--cc-chart-1'],
    )
  })

  it('el valor por bodega es una sola serie horizontal y sin leyenda, de mayor a menor', async () => {
    const [, bodegas] = await esperarGraficos()

    const props = bodegas?.props()
    expect(props?.horizontal).toBe(true)
    expect(props?.series).toHaveLength(1)
    expect(props?.series[0]?.color).toBe(COLORES_DEL_TEMA['--cc-chart-1'])
    expect(props?.etiquetas).toHaveLength(5)
    const valores: number[] = props?.series[0]?.datos ?? []
    expect(valores).toHaveLength(5)
    expect(valores).toEqual([...valores].sort((a, b) => b - a))
    // La leyenda de abajo es la del primer gráfico: el segundo no tiene.
    expect(wrapper?.findAll('.cc-chart-card')[1]?.find('.cc-legend').exists()).toBe(false)
  })

  it('cada gráfico lleva su descripción para lectores de pantalla y enlaza a su tabla', async () => {
    const [ventas, bodegas] = await esperarGraficos()

    expect(ventas?.props().descripcion).toContain('Desempeño por marca')
    expect(bodegas?.props().descripcion).toContain('Bodegas')
    const enlaces = (wrapper?.findAll('.cc-chart-card a') ?? []).map((a) => a.attributes('href'))
    expect(enlaces).toEqual(['/reportes/desempeno-marca', '/reportes/bodegas'])
  })

  it('sin ventas muestra el estado vacío en lugar del gráfico', async () => {
    const original = reportesMock.obtener.bind(reportesMock)
    vi.spyOn(reportesMock, 'obtener').mockImplementation(((vista: string) =>
      vista === 'desempeno-marca' ? Promise.resolve([]) : original(vista as never)) as never)
    await montarDashboard()

    await vi.waitFor(() => expect(wrapper?.text()).toContain('Sin ventas para mostrar'))
    expect(wrapper?.findAllComponents(GraficoBarras)).toHaveLength(1) // solo el de bodegas
  })
})

describe('dashboard · caché y errores', () => {
  it('pasar del dashboard a un reporte no vuelve a pedir lo que ya se tiene', async () => {
    const espia = vi.spyOn(reportesMock, 'obtener')
    const { router } = await montarDashboard()
    // Con los datos ya cargados: sin skeletons y con una cifra real en cada KPI.
    await vi.waitFor(() => expect(wrapper?.findAll('.cc-kpi .placeholder')).toHaveLength(0))
    expect(valoresDeLosKpi().every((valor) => valor !== '' && valor !== '—')).toBe(true)
    expect(espia).toHaveBeenCalledTimes(4)

    await router.push('/reportes/bodegas')
    await vi.waitFor(() =>
      expect(wrapper?.findAll('tbody tr:not([aria-hidden="true"])')).toHaveLength(5),
    )

    expect(espia).toHaveBeenCalledTimes(4)
  })

  it('si una vista falla avisa, deja "—" en su KPI y "Reintentar" la recupera', async () => {
    // La primera vista que pide el dashboard es `cuentas-por-cobrar`.
    vi.spyOn(reportesMock, 'obtener').mockRejectedValueOnce(new ErrorServidor('Sin conexión'))
    await montarDashboard()

    await vi.waitFor(() => expect(wrapper?.find('.alert-danger').exists()).toBe(true))
    expect(wrapper?.find('.alert-danger').text()).toContain('No se pudieron cargar algunos datos')
    expect(wrapper?.find('.alert-danger').text()).toContain('Sin conexión')
    expect(valoresDeLosKpi()[0]).toBe('—')

    await wrapper?.find('.alert-danger .btn').trigger('click')

    await vi.waitFor(() => expect(valoresDeLosKpi()[0]).not.toBe('—'))
    expect(wrapper?.find('.alert-danger').exists()).toBe(false)
  })
})
