import { defineStore } from 'pinia'

import { reportesService } from '@/services'
import type { FilaReporte, VistaReporte } from '@/types/reportes'
import type { FilasPorReporte } from '@/types/reportes'

import { crearCargadorPorClave } from './cargadorPorClave'

/**
 * Caché de las 5 vistas. El dashboard y `/reportes/:vista` comparten la misma, así que pasar
 * del uno al otro no vuelve a pedir lo que ya se tiene. Cada vista tiene su propio estado de
 * carga y de error: el dashboard pide cuatro a la vez.
 */
export const useReportesStore = defineStore('reportes', () => {
  const cargador = crearCargadorPorClave<FilasPorReporte>(
    // `FilasPorReporte[V]` es por construcción `FilasPorVista[V][]`, lo que ya promete el contrato
    // del service; TypeScript no logra verlo cuando `V` es genérico, de ahí el cast.
    (vista) => reportesService.obtener(vista) as Promise<FilasPorReporte[typeof vista]>,
  )

  /** Lo mismo con las filas como registros genéricos, para la tabla y el PDF (ver `definicionDe`). */
  function filasGenericasDe(vista: VistaReporte): FilaReporte[] | undefined {
    return cargador.valorDe(vista) as unknown as FilaReporte[] | undefined
  }

  return {
    filasDe: cargador.valorDe,
    filasGenericasDe,
    estaCargando: cargador.estaCargando,
    errorDe: cargador.errorDe,
    cargar: cargador.cargar,
    /**
     * Vacía la caché. Se llama después de cada escritura que sale bien (pago, traslado, cliente…):
     * las vistas cambian con ella, y el siguiente reporte que se abra tiene que traer datos nuevos.
     */
    invalidar: cargador.invalidar,
  }
})
