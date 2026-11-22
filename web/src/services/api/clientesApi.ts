import type { ClientesService } from '@/services/contratos/clientesService'
import { enviar, obtener } from '@/services/http'
import type { RespuestaEscritura } from '@/types/api'
import type { Cliente } from '@/types/cliente'

export const clientesApi: ClientesService = {
  listar: (signal) => obtener<Cliente[]>('/clientes', { signal }),
  registrar: (cliente) => enviar<RespuestaEscritura>('/clientes', cliente),
}
