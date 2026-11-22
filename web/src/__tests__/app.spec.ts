import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'

import App from '@/App.vue'
import { crearRouter } from '@/router'
import { authMock } from '@/services/mocks/authMock'
import { reiniciarBaseMock } from '@/services/mocks/estado'
import { limpiarSesionMock } from '@/services/mocks/sesionMock'
import { espera } from '@/services/mocks/simulador'

// Los tests usan los mocks y no necesitan un `.env`.
vi.mock('@/config/env', () => ({ env: { apiUrl: '/api', usarMocks: true } }))

let wrapper: VueWrapper | undefined

/** Monta la app completa (router + pinia) ya navegada a `ruta`. */
async function montarEn(ruta: string) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = crearRouter(createMemoryHistory())
  await router.push(ruta)
  await router.isReady()
  wrapper = mount(App, { global: { plugins: [pinia, router] } })
  return { router, wrapper }
}

function hrefsDelMenu(): string[] {
  return (wrapper?.findAll('.cc-nav-item') ?? []).map((enlace) => enlace.attributes('href') ?? '')
}

async function escribirYEnviar(usuario: string, contrasena: string): Promise<void> {
  await wrapper?.find('#login-usuario').setValue(usuario)
  await wrapper?.find('#login-contrasena').setValue(contrasena)
  await wrapper?.find('form').trigger('submit')
}

beforeEach(() => {
  espera.minimoMs = 0
  espera.maximoMs = 0
  reiniciarBaseMock()
  limpiarSesionMock()
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('la app completa', () => {
  it('el login se ve sin sidebar ni topbar', async () => {
    await montarEn('/')

    expect(wrapper?.find('#login-usuario').exists()).toBe(true)
    expect(wrapper?.find('.cc-sidebar').exists()).toBe(false)
    expect(wrapper?.find('.cc-topbar').exists()).toBe(false)
  })

  it('entrar a /clientes sin sesión pasa por el login y después vuelve a /clientes', async () => {
    const { router } = await montarEn('/clientes')
    expect(router.currentRoute.value.name).toBe('login')

    await escribirYEnviar('vendedor', 'vendedor123')

    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('clientes'))
    expect(wrapper?.find('.cc-topbar').text()).toContain('Clientes')
  })

  it('una contraseña incorrecta muestra el error y se queda en el login', async () => {
    const { router } = await montarEn('/')

    await escribirYEnviar('admin', 'mala')

    await vi.waitFor(() => expect(wrapper?.find('.alert-danger').exists()).toBe(true))
    expect(wrapper?.find('.alert-danger').text()).toContain('Usuario o contraseña incorrectos')
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('el formulario vacío marca los dos campos y no llama al API', async () => {
    await montarEn('/')

    await wrapper?.find('form').trigger('submit')

    expect(wrapper?.text()).toContain('Escribe tu usuario')
    expect(wrapper?.text()).toContain('Escribe tu contraseña')
  })

  it('el vendedor no ve Administrar empleados en el menú', async () => {
    await authMock.iniciarSesion({ usuario: 'vendedor', contrasena: 'vendedor123' })
    await montarEn('/')

    await vi.waitFor(() => expect(hrefsDelMenu().length).toBeGreaterThan(0))
    expect(hrefsDelMenu()).toContain('/clientes')
    expect(hrefsDelMenu()).not.toContain('/administracion-empleados')
  })

  it('el administrador sí ve Administrar empleados en el menú', async () => {
    await authMock.iniciarSesion({ usuario: 'admin', contrasena: 'admin123' })
    await montarEn('/')

    await vi.waitFor(() => expect(hrefsDelMenu()).toContain('/administracion-empleados'))
  })

  it('cerrar sesión desde el topbar vuelve al login', async () => {
    await authMock.iniciarSesion({ usuario: 'admin', contrasena: 'admin123' })
    const { router } = await montarEn('/')
    await vi.waitFor(() => expect(wrapper?.find('.cc-topbar').exists()).toBe(true))

    await wrapper?.find('.cc-topbar [aria-label="Cerrar sesión"]').trigger('click')

    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('login'))
    expect(wrapper?.find('.cc-sidebar').exists()).toBe(false)
  })
})
