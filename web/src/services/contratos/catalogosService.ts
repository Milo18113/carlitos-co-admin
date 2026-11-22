import type { CatalogosPorNombre, NombreCatalogo } from '@/types/catalogo'

export interface CatalogosService {
  /** `GET /api/catalogos/:nombre` (lista blanca de nombres). */
  obtener<N extends NombreCatalogo>(nombre: N, signal?: AbortSignal): Promise<CatalogosPorNombre[N]>
}
