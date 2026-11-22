import type { PagosService } from '@/services/contratos/pagosService'

import { baseMock } from './estado'
import { eliminarPago, registrarPago } from './procedimientos'
import { esperar } from './simulador'
import { exigirSesion } from './sesionMock'

export const pagosMock: PagosService = {
  async listar(numeroFactura, signal) {
    await esperar(signal)
    exigirSesion()
    return baseMock.pagos
      .filter((pago) => !numeroFactura || pago.tFactura_numero_factura === numeroFactura)
      .map((pago) => ({ ...pago }))
  },

  async registrar(pago) {
    await esperar()
    exigirSesion()
    return registrarPago(pago)
  },

  async eliminar(codigoPago) {
    await esperar()
    exigirSesion()
    return eliminarPago(codigoPago)
  },
}
