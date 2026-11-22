import type { RespuestaEscritura } from '@/types/api'
import type { EmpleadoNuevo } from '@/types/empleado'

export interface EmpleadosService {
  /** `POST /api/empleados` → `contratar_empleado`. La contraseña la hashea el API. */
  contratar(empleado: EmpleadoNuevo): Promise<RespuestaEscritura>
}
