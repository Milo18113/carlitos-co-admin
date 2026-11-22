import { avisarNoAutorizado } from '@/services/avisoNoAutorizado'
import { NoAutorizadoError } from '@/services/errores'
import type { Sesion } from '@/types/empleado'

const CLAVE_ALMACEN = 'cc-mock-sesion'

/** Copia en memoria: la sesión sigue funcionando aunque `sessionStorage` no esté disponible. */
let sesionEnMemoria: Sesion | null = null

function obtenerAlmacen(): Storage | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage
  } catch (causa) {
    // Acceder a sessionStorage lanza SecurityError con los datos del sitio bloqueados.
    if (causa instanceof DOMException) return null
    throw causa
  }
}

/**
 * La sesión del mock sobrevive a recargar la página, igual que la cookie de `express-session`
 * (los datos del mock, en cambio, se reinician en cada recarga).
 */
export function leerSesionMock(): Sesion | null {
  if (sesionEnMemoria) return sesionEnMemoria
  try {
    const texto = obtenerAlmacen()?.getItem(CLAVE_ALMACEN)
    if (texto) sesionEnMemoria = JSON.parse(texto) as Sesion
  } catch (causa) {
    if (!(causa instanceof SyntaxError || causa instanceof DOMException)) throw causa
  }
  return sesionEnMemoria
}

export function guardarSesionMock(sesion: Sesion): void {
  sesionEnMemoria = sesion
  try {
    obtenerAlmacen()?.setItem(CLAVE_ALMACEN, JSON.stringify(sesion))
  } catch (causa) {
    if (!(causa instanceof DOMException)) throw causa
  }
}

export function limpiarSesionMock(): void {
  sesionEnMemoria = null
  try {
    obtenerAlmacen()?.removeItem(CLAVE_ALMACEN)
  } catch (causa) {
    if (!(causa instanceof DOMException)) throw causa
  }
}

/** Equivale al middleware `requireAuth` del API: sin sesión, 401. */
export function exigirSesion(): Sesion {
  const sesion = leerSesionMock()
  if (!sesion) {
    avisarNoAutorizado()
    throw new NoAutorizadoError()
  }
  return sesion
}
