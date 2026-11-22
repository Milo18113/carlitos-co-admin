import { env } from '@/config/env'
import type { CuerpoError } from '@/types/api'

import { ErrorServidor, NoAutorizadoError, ReglaNegocioError } from './errores'

type Metodo = 'GET' | 'POST' | 'DELETE'

export interface OpcionesHttp {
  signal?: AbortSignal
  /** Query string. Las claves con valor `undefined` o vacío se omiten. */
  parametros?: Record<string, string | undefined>
}

const MENSAJE_SIN_CONEXION = 'No se pudo conectar con el servidor. Revisa tu conexión.'

function construirUrl(ruta: string, parametros: OpcionesHttp['parametros']): string {
  const consulta = new URLSearchParams()
  for (const [clave, valor] of Object.entries(parametros ?? {})) {
    if (valor !== undefined && valor !== '') consulta.set(clave, valor)
  }
  const texto = consulta.toString()
  return `${env.apiUrl}${ruta}${texto ? `?${texto}` : ''}`
}

function esCuerpoError(valor: unknown): valor is CuerpoError {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    'mensaje' in valor &&
    typeof valor.mensaje === 'string'
  )
}

async function leerMensaje(respuesta: Response): Promise<string | undefined> {
  try {
    const cuerpo: unknown = await respuesta.json()
    return esCuerpoError(cuerpo) ? cuerpo.mensaje : undefined
  } catch (causa) {
    // Una respuesta de error sin JSON (por ejemplo un 502 del proxy) no es un fallo nuestro.
    if (causa instanceof SyntaxError) return undefined
    throw causa
  }
}

async function solicitar<T>(
  metodo: Metodo,
  ruta: string,
  cuerpo?: unknown,
  opciones: OpcionesHttp = {},
): Promise<T> {
  let respuesta: Response
  try {
    respuesta = await fetch(construirUrl(ruta, opciones.parametros), {
      method: metodo,
      // La sesión es una cookie (express-session); `include` sirve también si el API está en otro origen.
      credentials: 'include',
      signal: opciones.signal,
      headers: cuerpo === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    })
  } catch (causa) {
    // Una cancelación no es un error real (plantilla 3.1 del skill vue-ts).
    if (causa instanceof DOMException && causa.name === 'AbortError') throw causa
    throw new ErrorServidor(MENSAJE_SIN_CONEXION)
  }

  // `fetch` no lanza en 401/422/500: hay que revisar `ok`.
  if (!respuesta.ok) {
    const mensaje = await leerMensaje(respuesta)
    if (respuesta.status === 401) throw new NoAutorizadoError(mensaje)
    if (respuesta.status === 422)
      throw new ReglaNegocioError(mensaje ?? 'La operación no es válida.')
    throw new ErrorServidor()
  }

  if (respuesta.status === 204) return undefined as T
  // `as T` no valida en runtime: el API es nuestro y el contrato vive en src/types/.
  return (await respuesta.json()) as T
}

export function obtener<T>(ruta: string, opciones?: OpcionesHttp): Promise<T> {
  return solicitar<T>('GET', ruta, undefined, opciones)
}

export function enviar<T>(ruta: string, cuerpo: unknown, opciones?: OpcionesHttp): Promise<T> {
  return solicitar<T>('POST', ruta, cuerpo, opciones)
}

export function eliminar<T>(ruta: string, opciones?: OpcionesHttp): Promise<T> {
  return solicitar<T>('DELETE', ruta, undefined, opciones)
}
