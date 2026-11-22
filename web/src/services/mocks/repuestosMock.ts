import type { RepuestosService } from '@/services/contratos/repuestosService'

import { baseMock } from './estado'
import { ingresarRepuesto, trasladarRepuesto } from './procedimientos'
import { esperar } from './simulador'
import { exigirSesion } from './sesionMock'

export const repuestosMock: RepuestosService = {
  async listar(signal) {
    await esperar(signal)
    exigirSesion()
    return baseMock.productos.map((producto) => ({ ...producto }))
  },

  async ingresar(repuesto) {
    await esperar()
    exigirSesion()
    return ingresarRepuesto(repuesto)
  },

  async trasladar(traslado) {
    await esperar()
    exigirSesion()
    return trasladarRepuesto(traslado)
  },
}
