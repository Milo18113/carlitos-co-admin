import type { RepuestosService } from '@/services/contratos/repuestosService'
import { enviar, obtener } from '@/services/http'
import type { RespuestaEscritura } from '@/types/api'
import type { Repuesto } from '@/types/repuesto'

export const repuestosApi: RepuestosService = {
  listar: (signal) => obtener<Repuesto[]>('/repuestos', { signal }),
  ingresar: (repuesto) => enviar<RespuestaEscritura>('/repuestos', repuesto),
  trasladar: (traslado) => enviar<RespuestaEscritura>('/repuestos/traslados', traslado),
}
