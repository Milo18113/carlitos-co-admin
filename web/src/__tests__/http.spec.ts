import { afterEach, describe, expect, it, vi } from 'vitest'

import { ErrorServidor, NoAutorizadoError, ReglaNegocioError } from '@/services/errores'
import { eliminar, enviar, obtener } from '@/services/http'

// `env.ts` exige variables de entorno; en los tests se fija un valor conocido.
vi.mock('@/config/env', () => ({ env: { apiUrl: '/api', usarMocks: false } }))

/**
 * Un `fetch` falso que devuelve un `Response` NUEVO en cada llamada: el body de un
 * `Response` solo se puede leer una vez.
 */
function fetchQueResponde(
  estado: number,
  cuerpo?: unknown,
): ReturnType<typeof vi.fn<typeof fetch>> {
  return vi.fn<typeof fetch>(() =>
    Promise.resolve(
      new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status: estado }),
    ),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('http.ts', () => {
  it('devuelve el JSON cuando la respuesta es 200', async () => {
    vi.stubGlobal('fetch', fetchQueResponde(200, { mensaje: 'listo' }))

    await expect(obtener('/pagos')).resolves.toEqual({ mensaje: 'listo' })
  })

  it('arma el query string y omite los parámetros vacíos', async () => {
    const fetchFalso = fetchQueResponde(200, [])
    vi.stubGlobal('fetch', fetchFalso)

    await obtener('/pagos', { parametros: { factura: '001-001-000000101', otro: undefined } })

    expect(fetchFalso.mock.calls[0]?.[0]).toBe('/api/pagos?factura=001-001-000000101')
  })

  it('manda el body como JSON en un POST', async () => {
    const fetchFalso = fetchQueResponde(200, { mensaje: 'ok' })
    vi.stubGlobal('fetch', fetchFalso)

    await enviar('/pagos', { monto: 10 })

    const opciones = fetchFalso.mock.calls[0]?.[1]
    expect(opciones?.method).toBe('POST')
    expect(opciones?.body).toBe('{"monto":10}')
  })

  it('traduce un 401 a NoAutorizadoError con el mensaje del API', async () => {
    vi.stubGlobal('fetch', fetchQueResponde(401, { mensaje: 'no hay sesión' }))

    const error: unknown = await obtener('/auth/me').catch((causa: unknown) => causa)

    expect(error).toBeInstanceOf(NoAutorizadoError)
    expect((error as Error).message).toBe('no hay sesión')
  })

  it('traduce un 422 a ReglaNegocioError y conserva el texto del procedure', async () => {
    const texto = 'el pago de 50.00 supera el saldo pendiente de 20.00'
    vi.stubGlobal('fetch', fetchQueResponde(422, { mensaje: texto }))

    const error: unknown = await eliminar('/pagos/PAG-0001').catch((causa: unknown) => causa)

    expect(error).toBeInstanceOf(ReglaNegocioError)
    expect((error as Error).message).toBe(texto)
  })

  it('traduce un 500 a ErrorServidor con mensaje genérico, sin filtrar el detalle', async () => {
    vi.stubGlobal('fetch', fetchQueResponde(500, { mensaje: 'ER_ACCESS_DENIED_ERROR root@host' }))

    const error: unknown = await obtener('/clientes').catch((causa: unknown) => causa)

    expect(error).toBeInstanceOf(ErrorServidor)
    expect((error as Error).message).not.toContain('root@host')
  })

  it('traduce un 502 sin JSON a ErrorServidor', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() =>
        Promise.resolve(new Response('<html>Bad Gateway</html>', { status: 502 })),
      ),
    )

    await expect(obtener('/clientes')).rejects.toBeInstanceOf(ErrorServidor)
  })

  it('traduce una falla de red a ErrorServidor', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() => Promise.reject(new TypeError('Failed to fetch'))),
    )

    await expect(obtener('/clientes')).rejects.toBeInstanceOf(ErrorServidor)
  })

  it('deja pasar la cancelación como AbortError y no como error del servidor', async () => {
    const cancelacion = new DOMException('cancelado', 'AbortError')
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() => Promise.reject(cancelacion)),
    )

    await expect(obtener('/clientes')).rejects.toBe(cancelacion)
  })
})
