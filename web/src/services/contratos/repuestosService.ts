import type { RespuestaEscritura } from '@/types/api'
import type { Repuesto, RepuestoNuevo, TrasladoNuevo } from '@/types/repuesto'

export interface RepuestosService {
  /** `GET /api/repuestos`. */
  listar(signal?: AbortSignal): Promise<Repuesto[]>
  /** `POST /api/repuestos` → `ingresar_repuesto` (crea el repuesto si no existe y suma stock). */
  ingresar(repuesto: RepuestoNuevo): Promise<RespuestaEscritura>
  /** `POST /api/repuestos/traslados` → `trasladar_repuesto`. */
  trasladar(traslado: TrasladoNuevo): Promise<RespuestaEscritura>
}
