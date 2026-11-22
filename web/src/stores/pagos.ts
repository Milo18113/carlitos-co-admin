import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { pagosService } from '@/services'
import type { Pago, PagoNuevo } from '@/types/pago'

import { crearCargadorPorClave } from './cargadorPorClave'
import { ejecutarEscritura } from './ejecutarEscritura'
import { useReportesStore } from './reportes'

export const usePagosStore = defineStore('pagos', () => {
  const reportes = useReportesStore()

  // Una sola lista: la fábrica con la clave `lista`.
  const cargador = crearCargadorPorClave<{ lista: Pago[] }>(() => pagosService.listar())

  const pagos = computed(() => cargador.valorDe('lista') ?? [])
  const isLoading = computed(() => cargador.estaCargando('lista'))
  const error = computed(() => cargador.errorDe('lista'))
  const isSaving = ref(false)

  function cargar({ force = false } = {}): Promise<void> {
    return cargador.cargar('lista', { force })
  }

  /**
   * Un pago cambia dos cosas: la lista de pagos y el saldo de la factura, que la pantalla toma del
   * reporte `cuentas-por-cobrar` para ofrecer las facturas con deuda. `ejecutarEscritura` ya
   * invalidó los reportes, así que aquí se vuelven a pedir los dos.
   */
  async function recargarTrasUnaEscritura(): Promise<void> {
    await Promise.all([cargar({ force: true }), reportes.cargar('cuentas-por-cobrar')])
  }

  /** CU-10. `registrar_pago` rechaza un monto mayor al saldo, y eso llega como el texto del toast. */
  function registrar(datos: PagoNuevo): Promise<boolean> {
    return ejecutarEscritura(isSaving, () => pagosService.registrar(datos), {
      tituloExito: 'Pago registrado',
      tituloError: 'No se pudo registrar el pago',
      alExito: recargarTrasUnaEscritura,
    })
  }

  /** CU-11. `eliminar_pago` solo elimina pagos registrados hoy. */
  function eliminar(codigoPago: string): Promise<boolean> {
    return ejecutarEscritura(isSaving, () => pagosService.eliminar(codigoPago), {
      tituloExito: 'Pago eliminado',
      tituloError: 'No se pudo eliminar el pago',
      alExito: recargarTrasUnaEscritura,
    })
  }

  return { pagos, isLoading, isSaving, error, cargar, registrar, eliminar }
})
