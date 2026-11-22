import type { FilasPorVista, VistaReporte } from '@/types/reportes'

export interface ReportesService {
  /** `GET /api/reportes/:vista`. Cada fila conserva los alias de la vista SQL. */
  obtener<V extends VistaReporte>(vista: V, signal?: AbortSignal): Promise<FilasPorVista[V][]>
}
