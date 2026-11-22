import { defineStore } from 'pinia'
import { ref } from 'vue'

import { facturasService } from '@/services'
import type { FacturaNueva } from '@/types/factura'

import { ejecutarEscritura } from './ejecutarEscritura'
import { usePagosStore } from './pagos'

export const useFacturasStore = defineStore('facturas', () => {
  const pagos = usePagosStore()
  const isSaving = ref(false)

  /**
   * ⚠ CU-09 (propuesta): el contrato de `POST /api/facturas` se cierra con el API. Devuelve `true`
   * si se emitió. Una factura nueva (y su pago, si fue al contado) cambia las cuentas por cobrar:
   * `ejecutarEscritura` ya invalida los reportes.
   */
  function emitir(datos: FacturaNueva): Promise<boolean> {
    return ejecutarEscritura(isSaving, () => facturasService.emitir(datos), {
      tituloExito: 'Factura emitida',
      tituloError: 'No se pudo emitir la factura',
      // Una venta al contado crea además un pago: se refresca la lista para que la pantalla de pagos
      // no muestre una copia vieja que quedó en la caché.
      alExito: () => (datos.forma_pago !== null ? pagos.cargar({ force: true }) : undefined),
    })
  }

  return { isSaving, emitir }
})
