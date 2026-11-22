import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'

import App from '@/App.vue'
import { crearRouter } from '@/router'
import { ErrorServidor } from '@/services/errores'
import { authMock } from '@/services/mocks/authMock'
import { reiniciarBaseMock } from '@/services/mocks/estado'
import { reportesMock } from '@/services/mocks/reportesMock'
import { limpiarSesionMock } from '@/services/mocks/sesionMock'
import { espera } from '@/services/mocks/simulador'
import { descargarPdf } from '@/utils/exportarPdf'

// Los tests usan los mocks y no necesitan un `.env`.
vi.mock('@/config/env', () => ({ env: { apiUrl: '/api', usarMocks: true } }))
// jsPDF y la descarga del logo se reemplazan: aquí se prueba la pantalla, no el PDF (ver pdf.spec.ts).
vi.mock('@/utils/exportarPdf', () => ({
  descargarPdf: vi.fn<() => string>(() => 'bodegas-2026-11-22.pdf'),
}))
vi.mock('@/utils/imagen', () => ({
  cargarImagen: vi.fn<() => Promise<null>>(() => Promise.resolve(null)),
}))

// Los estilos no se cargan en jsdom: se ponen las variables que lee `coloresDelTema`.
const VARIABLES_DEL_TEMA = {
  '--bs-gray-100': '#F0F4F7',
  '--bs-gray-200': '#E1E7ED',
  '--bs-gray-600': '#4C5A69',
  '--bs-gray-900': '#141B24',
}

let wrapper: VueWrapper | undefined

async function montarEn(ruta: string) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = crearRouter(createMemoryHistory())
  await router.push(ruta)
  await router.isReady()
  wrapper = mount(App, { global: { plugins: [pinia, router], stubs: { GraficoBarras: true } } })
  return { router, wrapper }
}

/** Solo las filas con datos: las 5 del skeleton de carga son `aria-hidden` y no cuentan. */
function filasDeLaTabla(): number {
  return wrapper?.findAll('tbody tr:not([aria-hidden="true"])').length ?? 0
}

beforeEach(async () => {
  espera.minimoMs = 0
  espera.maximoMs = 0
  reiniciarBaseMock()
  limpiarSesionMock()
  vi.mocked(descargarPdf).mockClear()
  for (const [nombre, valor] of Object.entries(VARIABLES_DEL_TEMA)) {
    document.documentElement.style.setProperty(nombre, valor)
  }
  await authMock.iniciarSesion({ usuario: 'admin', contrasena: 'admin123' })
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.restoreAllMocks()
  for (const nombre of Object.keys(VARIABLES_DEL_TEMA)) {
    document.documentElement.style.removeProperty(nombre)
  }
})

describe('/reportes/:vista', () => {
  it('muestra las filas con encabezados legibles y las cifras formateadas', async () => {
    await montarEn('/reportes/bodegas')

    await vi.waitFor(() => expect(filasDeLaTabla()).toBe(5))
    expect(wrapper?.findAll('thead th').map((th) => th.text())).toEqual([
      'Código',
      'Bodega',
      'Dirección',
      'Productos',
      'Unidades',
      'Valor',
    ])
    expect(wrapper?.find('tbody tr').text()).toContain('$ ')
  })

  it('el topbar y la tabla se llaman como el reporte', async () => {
    await montarEn('/reportes/cuentas-por-cobrar')

    await vi.waitFor(() => expect(filasDeLaTabla()).toBe(22))
    expect(wrapper?.find('.cc-topbar').text()).toContain('Cuentas por cobrar')
    expect(wrapper?.find('caption').text()).toBe('Cuentas por cobrar')
  })

  it('mientras carga muestra el skeleton', async () => {
    await montarEn('/reportes/bodegas')

    expect(wrapper?.findAll('.placeholder').length).toBeGreaterThan(0)
    await vi.waitFor(() => expect(filasDeLaTabla()).toBe(5))
    expect(wrapper?.findAll('.placeholder')).toHaveLength(0)
  })

  it('el buscador filtra y deja la búsqueda en la URL', async () => {
    const { router } = await montarEn('/reportes/bodegas')
    await vi.waitFor(() => expect(filasDeLaTabla()).toBe(5))

    await wrapper?.find('input[type="search"]').setValue('norte')

    await vi.waitFor(() => expect(router.currentRoute.value.query.q).toBe('norte'))
    expect(filasDeLaTabla()).toBe(1)
  })

  it('si la URL ya trae ?q= la tabla arranca filtrada y el buscador lo muestra', async () => {
    await montarEn('/reportes/bodegas?q=guayaquil')

    await vi.waitFor(() => expect(filasDeLaTabla()).toBe(1))
    const buscador = wrapper?.find('input[type="search"]').element as HTMLInputElement | undefined
    expect(buscador?.value).toBe('guayaquil')
  })

  it('vaciar el buscador quita ?q= de la URL', async () => {
    const { router } = await montarEn('/reportes/bodegas?q=norte')
    await vi.waitFor(() => expect(filasDeLaTabla()).toBe(1))

    await wrapper?.find('input[type="search"]').setValue('')

    await vi.waitFor(() => expect(router.currentRoute.value.query.q).toBeUndefined())
    expect(filasDeLaTabla()).toBe(5)
  })

  it('el estado de los empleados sale como badge con texto: Activo / Inactivo', async () => {
    await montarEn('/reportes/empleados')

    await vi.waitFor(() => expect(filasDeLaTabla()).toBe(10))
    const badges = wrapper?.findAll('tbody .badge').map((badge) => badge.text()) ?? []
    expect(badges.filter((texto) => texto === 'Inactivo')).toHaveLength(1)
    expect(badges.filter((texto) => texto === 'Activo')).toHaveLength(9)
  })

  it('pasar de un reporte a otro reutiliza la vista y carga el nuevo', async () => {
    const { router } = await montarEn('/reportes/bodegas')
    await vi.waitFor(() => expect(filasDeLaTabla()).toBe(5))

    await router.push('/reportes/empleados')

    await vi.waitFor(() => expect(filasDeLaTabla()).toBe(10))
    expect(wrapper?.find('.cc-topbar').text()).toContain('Empleados')
  })

  it('un reporte inexistente, aun desde dentro de la app, es una página no encontrada', async () => {
    const { router } = await montarEn('/reportes/bodegas')

    await router.push('/reportes/inexistente')

    expect(router.currentRoute.value.name).toBe('no-encontrado')
  })

  it('un reporte sin filas muestra el estado vacío y no deja generar el PDF', async () => {
    vi.spyOn(reportesMock, 'obtener').mockResolvedValueOnce([])
    await montarEn('/reportes/bodegas')

    await vi.waitFor(() => expect(wrapper?.find('.cc-empty').exists()).toBe(true))
    expect(wrapper?.find('.cc-empty').text()).toContain('Este reporte no tiene filas')
    expect(wrapper?.find('.btn-accent').attributes('disabled')).toBeDefined()
  })

  it('si la carga falla muestra el error y "Reintentar" vuelve a pedir', async () => {
    vi.spyOn(reportesMock, 'obtener').mockRejectedValueOnce(new ErrorServidor('Sin conexión'))
    await montarEn('/reportes/bodegas')

    await vi.waitFor(() => expect(wrapper?.find('[role="alert"]').exists()).toBe(true))
    expect(wrapper?.find('[role="alert"]').text()).toContain('Sin conexión')
    expect(wrapper?.find('.btn-accent').attributes('disabled')).toBeDefined()

    await wrapper?.find('[role="alert"] .btn-primary').trigger('click')

    await vi.waitFor(() => expect(filasDeLaTabla()).toBe(5))
  })
})

describe('PDF (CU-05)', () => {
  it('hay un solo botón de acento por pantalla y es el de "Generar reporte PDF"', async () => {
    await montarEn('/reportes/bodegas')
    await vi.waitFor(() => expect(filasDeLaTabla()).toBe(5))

    const acentos = wrapper?.findAll('.btn-accent') ?? []

    expect(acentos).toHaveLength(1)
    expect(acentos[0]?.text()).toBe('Generar reporte PDF')
  })

  it('exporta el reporte con el usuario de la sesión y avisa con un toast', async () => {
    await montarEn('/reportes/bodegas')
    await vi.waitFor(() => expect(filasDeLaTabla()).toBe(5))

    await wrapper?.find('.btn-accent').trigger('click')

    await vi.waitFor(() => expect(descargarPdf).toHaveBeenCalledOnce())
    const opciones = vi.mocked(descargarPdf).mock.calls[0]?.[0]
    expect(opciones).toMatchObject({
      nombreBase: 'bodegas',
      titulo: 'Bodegas',
      usuario: 'Carlos Andrade',
      filtro: '',
    })
    expect(opciones?.filas).toHaveLength(5)
    expect(opciones?.columnas.map((columna) => columna.etiqueta)).toContain('Valor')
    await vi.waitFor(() =>
      expect(wrapper?.find('.toast').text()).toContain('bodegas-2026-11-22.pdf'),
    )
  })

  it('con una búsqueda activa exporta solo las filas que se ven y deja anotado el filtro', async () => {
    await montarEn('/reportes/bodegas?q=norte')
    await vi.waitFor(() => expect(filasDeLaTabla()).toBe(1))

    await wrapper?.find('.btn-accent').trigger('click')

    await vi.waitFor(() => expect(descargarPdf).toHaveBeenCalledOnce())
    const opciones = vi.mocked(descargarPdf).mock.calls[0]?.[0]
    expect(opciones?.filas).toHaveLength(1)
    expect(opciones?.filtro).toBe('norte')
  })

  it('si el PDF falla avisa con un toast de error y el botón vuelve a quedar disponible', async () => {
    vi.mocked(descargarPdf).mockImplementationOnce(() => {
      throw new Error('No se pudo escribir el archivo')
    })
    await montarEn('/reportes/bodegas')
    await vi.waitFor(() => expect(filasDeLaTabla()).toBe(5))

    await wrapper?.find('.btn-accent').trigger('click')

    await vi.waitFor(() => expect(wrapper?.find('.cc-toast--danger').exists()).toBe(true))
    expect(wrapper?.find('.cc-toast--danger').text()).toContain('No se pudo escribir el archivo')
    expect(wrapper?.find('.btn-accent').attributes('disabled')).toBeUndefined()
  })
})
