import type { CatalogosService } from '@/services/contratos/catalogosService'
import { obtener } from '@/services/http'
import type { CatalogosPorNombre, NombreCatalogo } from '@/types/catalogo'

export const catalogosApi: CatalogosService = {
  obtener: <N extends NombreCatalogo>(nombre: N, signal?: AbortSignal) =>
    obtener<CatalogosPorNombre[N]>(`/catalogos/${nombre}`, { signal }),
}
