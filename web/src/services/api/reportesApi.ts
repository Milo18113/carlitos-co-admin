import type { ReportesService } from '@/services/contratos/reportesService'
import { obtener } from '@/services/http'
import { REPORTES } from '@/types/reportes'
import type { FilasPorVista, VistaReporte } from '@/types/reportes'

export const reportesApi: ReportesService = {
  obtener: <V extends VistaReporte>(vista: V, signal?: AbortSignal) =>
    obtener<FilasPorVista[V][]>(REPORTES[vista].endpoint, { signal }),
}
