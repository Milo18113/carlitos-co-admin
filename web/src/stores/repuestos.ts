import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { repuestosService } from '@/services'
import type { Repuesto, RepuestoNuevo, TrasladoNuevo } from '@/types/repuesto'

import { crearCargadorPorClave } from './cargadorPorClave'
import { ejecutarEscritura } from './ejecutarEscritura'
import { useReportesStore } from './reportes'

export const useRepuestosStore = defineStore('repuestos', () => {
  const reportes = useReportesStore()

  // Una sola lista: la fábrica con la clave `lista`.
  const cargador = crearCargadorPorClave<{ lista: Repuesto[] }>(() => repuestosService.listar())

  const repuestos = computed(() => cargador.valorDe('lista') ?? [])
  const isLoading = computed(() => cargador.estaCargando('lista'))
  const error = computed(() => cargador.errorDe('lista'))
  const isSaving = ref(false)

  function cargar({ force = false } = {}): Promise<void> {
    return cargador.cargar('lista', { force })
  }

  /**
   * Después de mover stock cambia el listado de productos (si entró uno nuevo) y el stock por
   * bodega, que la pantalla toma del reporte `repuestos-disponibles`: `ejecutarEscritura` ya
   * invalidó los reportes, así que aquí se vuelven a pedir los dos.
   */
  async function recargarTrasUnaEscritura(): Promise<void> {
    await Promise.all([cargar({ force: true }), reportes.cargar('repuestos-disponibles')])
  }

  /** CU-07. Crea el repuesto si no existe y suma el stock en la bodega. */
  function ingresar(datos: RepuestoNuevo): Promise<boolean> {
    return ejecutarEscritura(isSaving, () => repuestosService.ingresar(datos), {
      tituloExito: 'Repuesto ingresado',
      tituloError: 'No se pudo ingresar el repuesto',
      alExito: recargarTrasUnaEscritura,
    })
  }

  /** CU-08. Mueve unidades de una bodega a otra. */
  function trasladar(datos: TrasladoNuevo): Promise<boolean> {
    return ejecutarEscritura(isSaving, () => repuestosService.trasladar(datos), {
      tituloExito: 'Traslado registrado',
      tituloError: 'No se pudo trasladar el repuesto',
      alExito: recargarTrasUnaEscritura,
    })
  }

  return { repuestos, isLoading, isSaving, error, cargar, ingresar, trasladar }
})
