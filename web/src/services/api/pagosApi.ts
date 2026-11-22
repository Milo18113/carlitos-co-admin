import type { PagosService } from '@/services/contratos/pagosService'
import { eliminar, enviar, obtener } from '@/services/http'
import type { RespuestaEscritura } from '@/types/api'
import type { Pago } from '@/types/pago'

export const pagosApi: PagosService = {
  listar: (numeroFactura, signal) =>
    obtener<Pago[]>('/pagos', { signal, parametros: { factura: numeroFactura } }),
  registrar: (pago) => enviar<RespuestaEscritura>('/pagos', pago),
  eliminar: (codigoPago) =>
    eliminar<RespuestaEscritura>(`/pagos/${encodeURIComponent(codigoPago)}`),
}
