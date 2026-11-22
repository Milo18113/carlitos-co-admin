import type { EmpleadosService } from '@/services/contratos/empleadosService'
import { enviar } from '@/services/http'
import type { RespuestaEscritura } from '@/types/api'

export const empleadosApi: EmpleadosService = {
  contratar: (empleado) => enviar<RespuestaEscritura>('/empleados', empleado),
}
