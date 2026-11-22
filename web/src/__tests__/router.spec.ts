import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'

import { crearRouter } from '@/router'
import { NoAutorizadoError } from '@/services/errores'
import { reiniciarBaseMock } from '@/services/mocks/estado'
import { authMock } from '@/services/mocks/authMock'
import { limpiarSesionMock } from '@/services/mocks/sesionMock'
import { espera } from '@/services/mocks/simulador'
import { useAuthStore } from '@/stores/auth'

// Los tests usan los mocks y no necesitan un `.env`.
vi.mock('@/config/env', () => ({ env: { apiUrl: '/api', usarMocks: true } }))

async function navegarA(ruta: string) {
  const router = crearRouter(createMemoryHistory())
  await router.push(ruta)
  await router.isReady()
  return router
}

async function entrarComo(usuario: 'admin' | 'vendedor'): Promise<void> {
  const contrasena = usuario === 'admin' ? 'admin123' : 'vendedor123'
  await authMock.iniciarSesion({ usuario, contrasena })
}

beforeEach(() => {
  setActivePinia(createPinia())
  espera.minimoMs = 0
  espera.maximoMs = 0
  reiniciarBaseMock()
  limpiarSesionMock()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('guard del router', () => {
  it('sin sesión manda al login y recuerda a dónde iba', async () => {
    const router = await navegarA('/clientes')

    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/clientes')
  })

  it('con sesión deja abrir una ruta de empleado', async () => {
    await entrarComo('vendedor')

    const router = await navegarA('/clientes')

    expect(router.currentRoute.value.name).toBe('clientes')
  })

  it('el administrador abre /administracion-empleados', async () => {
    await entrarComo('admin')

    const router = await navegarA('/administracion-empleados')

    expect(router.currentRoute.value.name).toBe('administracion-empleados')
  })

  it('el vendedor no puede abrir /administracion-empleados y vuelve al dashboard', async () => {
    await entrarComo('vendedor')

    const router = await navegarA('/administracion-empleados')

    expect(router.currentRoute.value.name).toBe('dashboard')
  })

  it('quien ya tiene sesión no se queda en el login', async () => {
    await entrarComo('vendedor')

    const router = await navegarA('/login')

    expect(router.currentRoute.value.name).toBe('dashboard')
  })

  it('un reporte que no existe se trata como página no encontrada', async () => {
    await entrarComo('vendedor')

    const router = await navegarA('/reportes/inexistente')

    expect(router.currentRoute.value.name).toBe('no-encontrado')
  })

  it('abre cada una de las 5 vistas de reporte', async () => {
    await entrarComo('vendedor')

    const router = await navegarA('/reportes/cuentas-por-cobrar')

    expect(router.currentRoute.value.name).toBe('reporte')
    expect(router.currentRoute.value.params.vista).toBe('cuentas-por-cobrar')
  })

  it('una ruta desconocida muestra la página 404 aunque no haya sesión', async () => {
    const router = await navegarA('/no-existe')

    expect(router.currentRoute.value.name).toBe('no-encontrado')
  })
})

describe('store auth', () => {
  it('pregunta por la sesión una sola vez aunque lleguen dos llamadas a la vez', async () => {
    await entrarComo('admin')
    const espia = vi.spyOn(authMock, 'obtenerSesion')
    const auth = useAuthStore()

    await Promise.all([auth.cargarSesion(), auth.cargarSesion()])
    await auth.cargarSesion()

    expect(espia).toHaveBeenCalledTimes(1)
    expect(auth.empleado?.usuario).toBe('admin')
  })

  it('sin sesión no deja un error que mostrar', async () => {
    const auth = useAuthStore()

    await auth.cargarSesion()

    expect(auth.estaAutenticado).toBe(false)
    expect(auth.error).toBeNull()
  })

  it('una contraseña incorrecta deja el motivo y no inicia sesión', async () => {
    const auth = useAuthStore()

    const entro = await auth.login({ usuario: 'admin', contrasena: 'mala' })

    expect(entro).toBe(false)
    expect(auth.error).toBe('Usuario o contraseña incorrectos')
    expect(auth.estaAutenticado).toBe(false)
  })

  it('cerrar sesión limpia al empleado y el siguiente /me ya no lo recuerda', async () => {
    const auth = useAuthStore()
    await auth.login({ usuario: 'vendedor', contrasena: 'vendedor123' })

    const cerro = await auth.logout()

    expect(cerro).toBe(true)
    expect(auth.estaAutenticado).toBe(false)
    await expect(authMock.obtenerSesion()).rejects.toBeInstanceOf(NoAutorizadoError)
  })

  it('un 401 en medio de la sesión deja el aviso de que expiró', () => {
    const auth = useAuthStore()

    auth.expirarSesion()

    expect(auth.estaAutenticado).toBe(false)
    expect(auth.error).toBe('Tu sesión expiró. Inicia sesión de nuevo.')
  })
})
