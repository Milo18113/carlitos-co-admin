import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { ErrorServidor, NoAutorizadoError, ReglaNegocioError } from '@/services/errores'
import { crearCargadorPorClave } from '@/stores/cargadorPorClave'
import { ejecutarEscritura } from '@/stores/ejecutarEscritura'
import { useNotificacionesStore } from '@/stores/notificaciones'
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

interface Datos {
  a: string[]
  b: number[]
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('crearCargadorPorClave', () => {
  it('un `force` mientras hay una petición en vuelo la reemplaza: gana la última, llegue cuando llegue', async () => {
    const lenta = respuestaManual<string[]>()
    const pedir = vi
      .fn<(clave: string) => Promise<unknown>>()
      .mockImplementationOnce(() => lenta.promesa)
      .mockImplementationOnce(() => Promise.resolve(['dato nuevo']))
    const cargador = crearCargadorPorClave<Datos>(pedir as never)

    const primera = cargador.cargar('a')
    const segunda = cargador.cargar('a', { force: true }) // p. ej. recargar tras una escritura
    await segunda
    expect(cargador.valorDe('a')).toEqual(['dato nuevo'])

    lenta.resolver(['dato viejo']) // la primera llega tarde, con datos de antes de la escritura
    await primera

    expect(cargador.valorDe('a')).toEqual(['dato nuevo'])
    expect(cargador.estaCargando('a')).toBe(false)
  })

  it('sin `force`, una segunda llamada se une a la petición en vuelo', async () => {
    const pedir = vi.fn<(clave: string) => Promise<unknown>>(() => Promise.resolve(['x']))
    const cargador = crearCargadorPorClave<Datos>(pedir as never)

    await Promise.all([cargador.cargar('a'), cargador.cargar('a')])

    expect(pedir).toHaveBeenCalledTimes(1)
  })

  it('una lista vacía también es un dato cacheado: no se vuelve a pedir', async () => {
    const pedir = vi.fn<(clave: string) => Promise<unknown>>(() => Promise.resolve([]))
    const cargador = crearCargadorPorClave<Datos>(pedir as never)

    await cargador.cargar('a')
    await cargador.cargar('a')

    expect(pedir).toHaveBeenCalledTimes(1)
    expect(cargador.valorDe('a')).toEqual([])
  })

  it('cada clave tiene su propio estado de carga y de error', async () => {
    const pedir = vi
      .fn<(clave: string) => Promise<unknown>>()
      .mockRejectedValueOnce(new ErrorServidor('Sin conexión'))
      .mockResolvedValueOnce([1, 2])
    const cargador = crearCargadorPorClave<Datos>(pedir as never)

    await cargador.cargar('a')
    await cargador.cargar('b')

    expect(cargador.errorDe('a')).toBe('Sin conexión')
    expect(cargador.errorDe('b')).toBeNull()
    expect(cargador.valorDe('b')).toEqual([1, 2])
  })

  it('al reintentar con `force` el error se limpia al empezar', async () => {
    const pedir = vi
      .fn<(clave: string) => Promise<unknown>>()
      .mockRejectedValueOnce(new ErrorServidor('Sin conexión'))
      .mockResolvedValueOnce(['ok'])
    const cargador = crearCargadorPorClave<Datos>(pedir as never)
    await cargador.cargar('a')

    await cargador.cargar('a', { force: true })

    expect(cargador.errorDe('a')).toBeNull()
    expect(cargador.valorDe('a')).toEqual(['ok'])
  })

  it('invalidar vacía los valores y los errores', async () => {
    const pedir = vi.fn<(clave: string) => Promise<unknown>>(() => Promise.resolve(['x']))
    const cargador = crearCargadorPorClave<Datos>(pedir as never)
    await cargador.cargar('a')

    cargador.invalidar()

    expect(cargador.valorDe('a')).toBeUndefined()
    await cargador.cargar('a')
    expect(pedir).toHaveBeenCalledTimes(2)
  })
})

describe('ejecutarEscritura', () => {
  it('si sale bien: toast de éxito con el mensaje del procedure, reportes invalidados y recarga', async () => {
    const enviando = ref(false)
    const reportes = useReportesStore()
    const invalidar = vi.spyOn(reportes, 'invalidar')
    const alExito = vi.fn<() => void>()

    const salioBien = await ejecutarEscritura(
      enviando,
      () => Promise.resolve({ mensaje: 'cliente TALLER registrado' }),
      { tituloExito: 'Cliente guardado', tituloError: 'No se pudo', alExito },
    )

    expect(salioBien).toBe(true)
    const [toast] = useNotificacionesStore().items
    expect(toast).toMatchObject({
      tipo: 'exito',
      titulo: 'Cliente guardado',
      texto: 'cliente TALLER registrado',
    })
    expect(invalidar).toHaveBeenCalledOnce()
    expect(alExito).toHaveBeenCalledOnce()
    expect(enviando.value).toBe(false)
  })

  it('marca `enviando` mientras la petición está en curso', async () => {
    const enviando = ref(false)
    const lenta = respuestaManual<{ mensaje: string }>()

    const pendiente = ejecutarEscritura(enviando, () => lenta.promesa, {
      tituloExito: 'Listo',
      tituloError: 'Falló',
    })
    expect(enviando.value).toBe(true)

    lenta.resolver({ mensaje: 'ok' })
    await pendiente
    expect(enviando.value).toBe(false)
  })

  it('una regla de negocio (422) muestra el texto del procedure tal cual y NO invalida ni recarga', async () => {
    const enviando = ref(false)
    const invalidar = vi.spyOn(useReportesStore(), 'invalidar')
    const alExito = vi.fn<() => void>()
    const texto = 'el pago de 600.00 supera el saldo pendiente de 592.35'

    const salioBien = await ejecutarEscritura(
      enviando,
      () => Promise.reject(new ReglaNegocioError(texto)),
      { tituloExito: 'Pago registrado', tituloError: 'No se pudo registrar el pago', alExito },
    )

    expect(salioBien).toBe(false)
    expect(useNotificacionesStore().items[0]).toMatchObject({
      tipo: 'error',
      titulo: 'No se pudo registrar el pago',
      texto,
    })
    expect(invalidar).not.toHaveBeenCalled()
    expect(alExito).not.toHaveBeenCalled()
    expect(enviando.value).toBe(false)
  })

  it('un error del servidor o de red muestra el mensaje genérico', async () => {
    const enviando = ref(false)

    await ejecutarEscritura(enviando, () => Promise.reject(new ErrorServidor()), {
      tituloExito: 'Listo',
      tituloError: 'No se pudo guardar',
    })

    expect(useNotificacionesStore().items[0]).toMatchObject({
      tipo: 'error',
      titulo: 'No se pudo guardar',
      texto: 'No se pudo completar la operación. Intenta de nuevo en unos minutos.',
    })
  })

  it('un 401 no muestra ningún toast: el aviso global ya mandó al login', async () => {
    const enviando = ref(false)

    const salioBien = await ejecutarEscritura(
      enviando,
      () => Promise.reject(new NoAutorizadoError()),
      { tituloExito: 'Listo', tituloError: 'No se pudo guardar' },
    )

    expect(salioBien).toBe(false)
    expect(useNotificacionesStore().items).toHaveLength(0)
  })
})
