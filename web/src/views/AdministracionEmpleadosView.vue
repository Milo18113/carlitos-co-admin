<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import AppIcon from '@/components/common/AppIcon.vue'
import DataTable from '@/components/common/DataTable.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorDeCarga from '@/components/common/ErrorDeCarga.vue'
import SidePanel from '@/components/common/SidePanel.vue'
import EmpleadoForm from '@/components/empleados/EmpleadoForm.vue'
import { useFiltroUrl } from '@/composables/useFiltroUrl'
import { useCatalogosStore } from '@/stores/catalogos'
import { useEmpleadosStore } from '@/stores/empleados'
import { useReportesStore } from '@/stores/reportes'
import type { EmpleadoNuevo } from '@/types/empleado'
import { REPORTES } from '@/types/reportes'
import type { EmpleadoResumen } from '@/types/reportes'
import type { ColumnaTabla } from '@/types/tabla'

/** Lo que muestra la tabla: una fila del reporte `empleados` más la columna de botones. */
type FilaEmpleado = EmpleadoResumen & { acciones: null }

const empleados = useEmpleadosStore()
const reportes = useReportesStore()
const catalogos = useCatalogosStore()

const filtro = useFiltroUrl()

onMounted(() => {
  // La lista es el reporte `empleados` (la vista `Empleados`): la misma caché que `/reportes/empleados`.
  void reportes.cargar('empleados')
  void catalogos.cargar('roles')
})

// Las mismas columnas del reporte, más la de botones.
const columnas: ColumnaTabla<FilaEmpleado>[] = [
  ...REPORTES.empleados.columnas,
  { clave: 'acciones', etiqueta: 'Acciones', acciones: true },
]

const filas = computed<FilaEmpleado[]>(() =>
  (reportes.filasDe('empleados') ?? []).map((empleado) => ({ ...empleado, acciones: null })),
)

const cargandoTabla = computed(
  () => reportes.estaCargando('empleados') && reportes.filasDe('empleados') === undefined,
)
const falloLaCarga = computed(
  () => reportes.errorDe('empleados') !== null && reportes.filasDe('empleados') === undefined,
)

// --- Contratar (CU-12): panel lateral ---
const panelAbierto = ref(false)

function abrirPanel(): void {
  panelAbierto.value = true
}

function cerrarPanel(): void {
  // Con una petición en curso no se cierra: el usuario perdería lo que escribió sin saber si se guardó.
  if (empleados.isSaving) return
  panelAbierto.value = false
}

async function contratar(datos: EmpleadoNuevo): Promise<void> {
  // Si falló, el panel sigue abierto con lo que el usuario escribió; el toast dice por qué.
  if (await empleados.contratar(datos)) panelAbierto.value = false
}
</script>

<template>
  <div class="d-grid gap-3">
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
      <p class="text-body-secondary mb-0">
        Empleados con acceso al sistema y las facturas que emitió cada uno.
      </p>
      <button type="button" class="btn btn-primary" @click="abrirPanel">
        <AppIcon nombre="person-plus" />Contratar empleado
      </button>
    </div>

    <ErrorDeCarga
      v-if="falloLaCarga && reportes.errorDe('empleados')"
      titulo="No se pudieron cargar los empleados"
      :mensaje="reportes.errorDe('empleados') ?? ''"
      @reintentar="reportes.cargar('empleados', { force: true })"
    />

    <DataTable
      v-else
      v-model:filtro="filtro"
      titulo="Empleados"
      :columnas="columnas"
      :filas="filas"
      :cargando="cargandoTabla"
      :clave-fila="(fila) => fila.cedula"
    >
      <template #celda-acciones="{ fila }">
        <!-- CU-13 (dar de baja) está pendiente: el botón existe pero no hace nada todavía -->
        <span class="d-inline-block" title="Pendiente">
          <button
            type="button"
            class="btn btn-neutral btn-icon btn-sm"
            :aria-label="`Dar de baja a ${fila.nombres} ${fila.apellidos} (pendiente)`"
            disabled
          >
            <AppIcon nombre="person-dash" />
          </button>
        </span>
      </template>

      <template #vacio>
        <EmptyState
          icono="person-badge"
          titulo="Todavía no hay empleados"
          texto="Los empleados que contrates van a aparecer aquí."
        />
      </template>
    </DataTable>
  </div>

  <SidePanel v-if="panelAbierto" titulo="Contratar empleado" @cerrar="cerrarPanel">
    <EmpleadoForm
      :roles="catalogos.itemsDe('roles') ?? []"
      :enviando="empleados.isSaving"
      @enviar="contratar"
      @cancelar="cerrarPanel"
    />
  </SidePanel>
</template>
