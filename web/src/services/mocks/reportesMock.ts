import type { ReportesService } from '@/services/contratos/reportesService'
import type { FilasPorVista, VistaReporte } from '@/types/reportes'

import { esperar } from './simulador'
import { exigirSesion } from './sesionMock'
import {
  bodegasDisponibles,
  cuentasPorCobrar,
  desempenoMarca,
  empleadosResumen,
  repuestosDisponibles,
} from './vistas'

/** Una función por vista; el tipo mapeado obliga a que la fila coincida con `FilasPorVista`. */
const FUENTES: { [V in VistaReporte]: () => FilasPorVista[V][] } = {
  'repuestos-disponibles': repuestosDisponibles,
  'cuentas-por-cobrar': cuentasPorCobrar,
  empleados: empleadosResumen,
  bodegas: bodegasDisponibles,
  'desempeno-marca': desempenoMarca,
}

export const reportesMock: ReportesService = {
  async obtener<V extends VistaReporte>(vista: V, signal?: AbortSignal) {
    await esperar(signal)
    exigirSesion()
    return FUENTES[vista]()
  },
}
