import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

import { reportesService } from '@/services'
import { VISTAS_REPORTE } from '@/types/reportes'
import type { FilaReporte, FilasPorVista, VistaReporte } from '@/types/reportes'
import { mensajeDeError } from '@/utils/errores'

type FilasPorReporte = { [V in VistaReporte]: FilasPorVista[V][] }

function porVista<T>(valorInicial: T): Record<VistaReporte, T> {
  return Object.fromEntries(VISTAS_REPORTE.map((vista) => [vista, valorInicial])) as Record<
    VistaReporte,
    T
  >
}

/**
 * Caché de las 5 vistas. El dashboard y `/reportes/:vista` comparten la misma, así que pasar
 * del uno al otro no vuelve a pedir lo que ya se tiene. Cada vista tiene su propio estado de
 * carga y de error: el dashboard pide cuatro a la vez.
 */
export const useReportesStore = defineStore('reportes', () => {
  // `shallowRef`: son listados de solo lectura y no hace falta volverlos reactivos fila por fila.
  const filas = shallowRef<Partial<FilasPorReporte>>({})
  const cargando = ref(porVista(false))
  const errores = ref(porVista<string | null>(null))

  // Privado: la UI no reacciona a las promesas en vuelo.
  const enVuelo = new Map<VistaReporte, Promise<void>>()
  // Qué petición es la vigente de cada vista: las demás ya no pueden tocar el estado.
  const ultimaPeticion = new Map<VistaReporte, number>()
  let contadorPeticiones = 0
  // Sube con cada `invalidar()`: una respuesta que salió antes de una escritura ya es vieja.
  let version = 0

  function filasDe<V extends VistaReporte>(vista: V): FilasPorReporte[V] | undefined {
    return filas.value[vista]
  }

  /** Lo mismo con las filas como registros genéricos, para la tabla y el PDF (ver `definicionDe`). */
  function filasGenericasDe(vista: VistaReporte): FilaReporte[] | undefined {
    return filas.value[vista] as unknown as FilaReporte[] | undefined
  }

  function estaCargando(vista: VistaReporte): boolean {
    return cargando.value[vista]
  }

  function errorDe(vista: VistaReporte): string | null {
    return errores.value[vista]
  }

  /**
   * Carga una vista si no está en la caché. Carga compartida (plantilla 3.2 del skill): si ya hay
   * una petición de esa vista en vuelo, la segunda llamada espera a la primera en vez de salir
   * con la tabla todavía vacía. `force` salta la caché (el botón "Reintentar").
   */
  function cargar(vista: VistaReporte, { force = false } = {}): Promise<void> {
    if (!force && filas.value[vista]) return Promise.resolve()

    const existente = enVuelo.get(vista)
    if (existente) return existente

    const versionAlPedir = version
    const idPeticion = ++contadorPeticiones
    ultimaPeticion.set(vista, idPeticion)
    // Solo la última petición de esta vista apaga el loading y registra el error (plantilla 3.1):
    // una que `invalidar()` dejó vieja no debe pisar a la nueva.
    const esLaVigente = (): boolean => ultimaPeticion.get(vista) === idPeticion

    const pendiente = (async () => {
      cargando.value[vista] = true
      errores.value[vista] = null
      try {
        const resultado = await reportesService.obtener(vista)
        // Si hubo una escritura mientras llegaba, se descarta: el próximo `cargar` la pide de nuevo.
        if (versionAlPedir === version) {
          filas.value = { ...filas.value, [vista]: resultado } as Partial<FilasPorReporte>
        }
      } catch (causa) {
        if (esLaVigente()) errores.value[vista] = mensajeDeError(causa)
      } finally {
        if (esLaVigente()) {
          cargando.value[vista] = false
          enVuelo.delete(vista)
        }
      }
    })()
    enVuelo.set(vista, pendiente)
    return pendiente
  }

  /**
   * Vacía la caché. Se llama después de cada escritura que sale bien (pago, traslado, cliente…):
   * las vistas cambian con ella, y el siguiente reporte que se abra tiene que traer datos nuevos.
   */
  function invalidar(): void {
    version++
    filas.value = {}
    // Lo que estaba en vuelo ya es viejo: la próxima llamada tiene que pedir de nuevo, no unirse a eso.
    enVuelo.clear()
    ultimaPeticion.clear()
    cargando.value = porVista(false)
    errores.value = porVista(null)
  }

  return { filasDe, filasGenericasDe, estaCargando, errorDe, cargar, invalidar }
})
