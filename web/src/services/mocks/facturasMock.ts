import type { FacturasService } from '@/services/contratos/facturasService'

import { emitirFactura } from './facturacion'
import { esperar } from './simulador'
import { exigirSesion } from './sesionMock'

export const facturasMock: FacturasService = {
  async emitir(factura) {
    await esperar()
    exigirSesion()
    return emitirFactura(factura)
  },
}
