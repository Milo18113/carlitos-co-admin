import type { CatalogosService } from '@/services/contratos/catalogosService'
import type { NombreCatalogo } from '@/types/catalogo'

import { CATALOGOS_BASE } from './datos/catalogos'
import { esperar } from './simulador'
import { exigirSesion } from './sesionMock'

export const catalogosMock: CatalogosService = {
  async obtener<N extends NombreCatalogo>(nombre: N, signal?: AbortSignal) {
    await esperar(signal)
    exigirSesion()
    // Copia: un componente que mute el arreglo no debe alterar la fixture.
    return structuredClone(CATALOGOS_BASE[nombre])
  },
}
