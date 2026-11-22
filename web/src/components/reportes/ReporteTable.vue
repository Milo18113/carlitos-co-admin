<script setup lang="ts">
import DataTable from '@/components/common/DataTable.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorDeCarga from '@/components/common/ErrorDeCarga.vue'
import type { FilaReporte } from '@/types/reportes'
import type { ColumnaTabla } from '@/types/tabla'

defineProps<{
  /** Nombre accesible de la tabla (el título del reporte). */
  titulo: string
  columnas: ColumnaTabla<FilaReporte>[]
  filas: FilaReporte[]
  cargando?: boolean
  /** Mensaje de error de la carga; si está, se muestra en lugar de la tabla. */
  error?: string | null
}>()

/** `v-model:filtro`: la `ReporteView` lo guarda en la URL (`?q=`). */
const filtro = defineModel<string>('filtro', { default: '' })

const emit = defineEmits<{
  /** El botón "Reintentar" del estado de error. */
  reintentar: []
}>()
</script>

<template>
  <ErrorDeCarga
    v-if="error"
    titulo="No se pudo cargar el reporte"
    :mensaje="error"
    @reintentar="emit('reintentar')"
  />

  <DataTable
    v-else
    v-model:filtro="filtro"
    :titulo="titulo"
    :columnas="columnas"
    :filas="filas"
    :cargando="cargando"
  >
    <template #vacio>
      <EmptyState
        icono="inbox"
        titulo="Este reporte no tiene filas"
        texto="Cuando haya datos para mostrar van a aparecer aquí."
      />
    </template>
  </DataTable>
</template>
