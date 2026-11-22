import type { Ref } from 'vue'

import { NoAutorizadoError } from '@/services/errores'
import type { RespuestaEscritura } from '@/types/api'
import { mensajeDeError } from '@/utils/errores'

import { useNotificacionesStore } from './notificaciones'
import { useReportesStore } from './reportes'

export interface OpcionesEscritura {
  /** Título del toast cuando sale bien; el texto es el `mensaje` del procedure. */
  tituloExito: string
  /** Título del toast cuando falla; el texto es el motivo. */
  tituloError: string
  /** Qué hacer después de una escritura exitosa, normalmente recargar el listado. */
  alExito?: () => Promise<unknown> | unknown
}

/**
 * El flujo que repiten todas las escrituras (plan 5.2, "Ejemplo de flujo"): llamar al API → toast
 * con el `mensaje` del procedure → invalidar los reportes → recargar el listado. Los stores de
 * clientes, repuestos, pagos y empleados lo comparten en vez de copiarlo cada uno.
 *
 * Devuelve `true` si la escritura salió bien, para que la view cierre el formulario; si falló, el
 * formulario sigue abierto con lo que el usuario escribió.
 *
 * Los errores (plan 5.3): una regla de negocio (422) muestra el texto del procedure tal cual, y un
 * error del servidor o de red (500) muestra un mensaje genérico. Un 401 no muestra nada: el aviso
 * global ya limpió la sesión y mandó al login.
 */
export async function ejecutarEscritura(
  enviando: Ref<boolean>,
  accion: () => Promise<RespuestaEscritura>,
  opciones: OpcionesEscritura,
): Promise<boolean> {
  const notificaciones = useNotificacionesStore()
  const reportes = useReportesStore()

  enviando.value = true
  try {
    const respuesta = await accion()
    notificaciones.exito(opciones.tituloExito, respuesta.mensaje)
    // Las vistas SQL cambian con cualquier escritura: el siguiente reporte tiene que traer datos nuevos.
    reportes.invalidar()
    await opciones.alExito?.()
    return true
  } catch (causa) {
    if (causa instanceof NoAutorizadoError) return false
    notificaciones.error(opciones.tituloError, mensajeDeError(causa))
    return false
  } finally {
    enviando.value = false
  }
}
