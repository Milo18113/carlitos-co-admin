<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import BotonPdf from '@/components/reportes/BotonPdf.vue'
import ReporteTable from '@/components/reportes/ReporteTable.vue'
import logoUrl from '@/assets/styles/logo.png'
import { useFiltroUrl } from '@/composables/useFiltroUrl'
import { useAuthStore } from '@/stores/auth'
import { useNotificacionesStore } from '@/stores/notificaciones'
import { useReportesStore } from '@/stores/reportes'
import { definicionDe } from '@/types/reportes'
import type { VistaReporte } from '@/types/reportes'
import { coloresDelTema } from '@/utils/colores'
import { mensajeDeError } from '@/utils/errores'
import { filtrarFilas } from '@/utils/filtrarFilas'
import { cargarImagen } from '@/utils/imagen'

const props = defineProps<{
  /** El `beforeEnter` de la ruta ya comprobó que es una de las 5 vistas. */
  vista: VistaReporte
}>()

const reportes = useReportesStore()
const auth = useAuthStore()
const notificaciones = useNotificacionesStore()

const generando = ref(false)

const definicion = computed(() => definicionDe(props.vista))
const filas = computed(() => reportes.filasGenericasDe(props.vista) ?? [])
const cargando = computed(() => reportes.estaCargando(props.vista))
const error = computed(() => reportes.errorDe(props.vista))

// Vue reutiliza esta misma view al pasar de un reporte a otro: por eso `watch` y no `onMounted`.
watch(
  () => props.vista,
  (vista) => {
    void reportes.cargar(vista)
  },
  { immediate: true },
)

const filtro = useFiltroUrl()

const filasVisibles = computed(() =>
  filtrarFilas(filas.value, definicion.value.columnas, filtro.value),
)
const hayDatos = computed(() => !cargando.value && !error.value && filas.value.length > 0)

/** CU-05: el PDF lleva lo que se ve en pantalla, con el filtro aplicado. */
async function exportar(): Promise<void> {
  const empleado = auth.empleado
  if (!empleado || generando.value) return

  generando.value = true
  try {
    // jsPDF pesa bastante: se descarga recién la primera vez que alguien exporta.
    const { descargarPdf } = await import('@/utils/exportarPdf')
    // El logo es un adorno: si no carga, el reporte se genera igual sin él.
    const logo = await cargarImagen(logoUrl).catch(() => null)

    const nombreArchivo = descargarPdf({
      nombreBase: props.vista,
      titulo: definicion.value.titulo,
      descripcion: definicion.value.descripcion,
      columnas: definicion.value.columnas,
      filas: filasVisibles.value,
      usuario: `${empleado.nombres} ${empleado.apellidos}`,
      generadoEn: new Date(),
      filtro: filtro.value,
      logo,
      colores: coloresDelTema(),
    })
    notificaciones.info('Reporte listo', `Se descargó ${nombreArchivo}.`)
  } catch (causa) {
    notificaciones.error('No se pudo generar el PDF', mensajeDeError(causa))
  } finally {
    generando.value = false
  }
}
</script>

<template>
  <div class="d-grid gap-3">
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
      <p class="text-body-secondary mb-0">{{ definicion.descripcion }}</p>
      <BotonPdf :generando="generando" :deshabilitado="!hayDatos" @exportar="exportar" />
    </div>

    <ReporteTable
      v-model:filtro="filtro"
      :titulo="definicion.titulo"
      :columnas="definicion.columnas"
      :filas="filas"
      :cargando="cargando"
      :error="error"
      @reintentar="reportes.cargar(vista, { force: true })"
    />
  </div>
</template>
