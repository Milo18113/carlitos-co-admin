import type { EmpleadosService } from '@/services/contratos/empleadosService'

import { contratarEmpleado } from './procedimientos'
import { esperar } from './simulador'
import { exigirSesion } from './sesionMock'

export const empleadosMock: EmpleadosService = {
  async contratar(empleado) {
    await esperar()
    exigirSesion()
    return contratarEmpleado(empleado)
  },
}
