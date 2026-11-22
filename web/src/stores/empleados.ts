import { defineStore } from 'pinia'
import { ref } from 'vue'

import { empleadosService } from '@/services'
import type { EmpleadoNuevo } from '@/types/empleado'

import { ejecutarEscritura } from './ejecutarEscritura'
import { useReportesStore } from './reportes'

/**
 * Los empleados que se listan son los del reporte `empleados` (la vista `Empleados`), que vive en
 * el store de reportes: este store solo agrega la escritura.
 */
export const useEmpleadosStore = defineStore('empleados', () => {
  const reportes = useReportesStore()
  const isSaving = ref(false)

  /**
   * CU-12. La contraseña viaja en texto plano: el API es quien la hashea con bcrypt antes de llamar a
   * `contratar_empleado`. Con una cédula de un empleado dado de baja, el procedure lo recontrata.
   */
  function contratar(datos: EmpleadoNuevo): Promise<boolean> {
    return ejecutarEscritura(isSaving, () => empleadosService.contratar(datos), {
      tituloExito: 'Empleado contratado',
      tituloError: 'No se pudo contratar al empleado',
      // `ejecutarEscritura` ya invalidó los reportes: se vuelve a pedir el de empleados.
      alExito: () => reportes.cargar('empleados'),
    })
  }

  return { isSaving, contratar }
})
