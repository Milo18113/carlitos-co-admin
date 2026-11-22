import type { RespuestaEscritura } from '@/types/api'
import type { Pago, PagoNuevo } from '@/types/pago'

export interface PagosService {
  /** `GET /api/pagos?factura=`. Sin `numeroFactura` devuelve todos los pagos. */
  listar(numeroFactura?: string, signal?: AbortSignal): Promise<Pago[]>
  /** `POST /api/pagos` → `registrar_pago`. */
  registrar(pago: PagoNuevo): Promise<RespuestaEscritura>
  /** `DELETE /api/pagos/:codigo` → `eliminar_pago`. */
  eliminar(codigoPago: string): Promise<RespuestaEscritura>
}
