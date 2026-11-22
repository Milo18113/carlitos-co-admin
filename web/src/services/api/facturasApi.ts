import type { FacturasService } from '@/services/contratos/facturasService'
import { enviar } from '@/services/http'
import type { RespuestaEscritura } from '@/types/api'

export const facturasApi: FacturasService = {
  emitir: (factura) => enviar<RespuestaEscritura>('/facturas', factura),
}
