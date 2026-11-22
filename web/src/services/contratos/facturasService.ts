import type { RespuestaEscritura } from '@/types/api'
import type { FacturaNueva } from '@/types/factura'

export interface FacturasService {
  /**
   * ⚠ PROPUESTA — `POST /api/facturas` (CU-09). Emite la factura con todas sus líneas, todo o nada.
   * El `mensaje` de la respuesta lleva el número que asignó el servidor.
   */
  emitir(factura: FacturaNueva): Promise<RespuestaEscritura>
}
