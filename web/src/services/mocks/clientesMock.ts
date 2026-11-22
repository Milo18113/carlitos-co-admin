import type { ClientesService } from '@/services/contratos/clientesService'

import { baseMock } from './estado'
import { registrarCliente } from './procedimientos'
import { esperar } from './simulador'
import { exigirSesion } from './sesionMock'

export const clientesMock: ClientesService = {
  async listar(signal) {
    await esperar(signal)
    exigirSesion()
    return baseMock.clientes.map((cliente) => ({ ...cliente }))
  },

  async registrar(cliente) {
    await esperar()
    exigirSesion()
    return registrarCliente(cliente)
  },
}
