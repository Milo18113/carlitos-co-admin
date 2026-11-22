import type { RespuestaEscritura } from '@/types/api'
import type { Cliente, ClienteNuevo } from '@/types/cliente'

export interface ClientesService {
  /** `GET /api/clientes`. */
  listar(signal?: AbortSignal): Promise<Cliente[]>
  /** `POST /api/clientes` → `registrar_cliente` (crea, o actualiza si el cliente ya existe). */
  registrar(cliente: ClienteNuevo): Promise<RespuestaEscritura>
}
