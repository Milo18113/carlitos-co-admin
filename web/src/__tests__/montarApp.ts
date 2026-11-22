import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'

import App from '@/App.vue'
import { crearRouter } from '@/router'
import { authMock } from '@/services/mocks/authMock'
import { reiniciarBaseMock } from '@/services/mocks/estado'
import { limpiarSesionMock } from '@/services/mocks/sesionMock'
import { espera } from '@/services/mocks/simulador'

/**
 * Ayudas para las pruebas que montan la app completa (router + Pinia + mocks). Cada spec debe
 * declarar su propio `vi.mock('@/config/env', ...)`: un `vi.mock` solo se aplica en el archivo
 * donde está escrito.
 */

let montada: VueWrapper | undefined

/** Mocks sin demora, datos de fábrica y sesión abierta con ese usuario. */
export async function prepararMocks(usuario: 'admin' | 'vendedor' = 'admin'): Promise<void> {
  espera.minimoMs = 0
  espera.maximoMs = 0
  reiniciarBaseMock()
  limpiarSesionMock()
  const contrasena = usuario === 'admin' ? 'admin123' : 'vendedor123'
  await authMock.iniciarSesion({ usuario, contrasena })
}

/**
 * Monta la app ya navegada a `ruta`. Se une al `document`: el `Teleport` del panel lateral busca su
 * destino (`#panel-lateral`) en el DOM real. El gráfico se reemplaza por un stub: jsdom no tiene canvas.
 */
export async function montarApp(ruta: string) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = crearRouter(createMemoryHistory())
  await router.push(ruta)
  await router.isReady()
  montada = mount(App, {
    global: { plugins: [pinia, router], stubs: { GraficoBarras: true } },
    attachTo: document.body,
  })
  return { wrapper: montada, router, pinia }
}

export function desmontarApp(): void {
  montada?.unmount()
  montada = undefined
  document.body.innerHTML = ''
  vi.restoreAllMocks()
}

/** Las filas con datos de la tabla (las 5 del skeleton de carga son `aria-hidden` y no cuentan). */
export function filasDeDatos(wrapper: VueWrapper): number {
  return wrapper.findAll('tbody tr:not([aria-hidden="true"])').length
}

/** El botón visible con ese texto. */
export function botonConTexto(wrapper: VueWrapper, texto: string) {
  const boton = wrapper.findAll('button').find((candidato) => candidato.text().includes(texto))
  if (!boton) throw new Error(`No hay un botón con el texto "${texto}"`)
  return boton
}
