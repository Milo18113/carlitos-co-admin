<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'

import AppIcon from '@/components/common/AppIcon.vue'
import ChartCard from '@/components/common/ChartCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import KpiCard from '@/components/common/KpiCard.vue'
import GraficoBarras from '@/components/dashboard/GraficoBarras.vue'
import { useReportesStore } from '@/stores/reportes'
import type { ItemLeyenda, SerieGrafico } from '@/types/grafico'
import type { VistaReporte } from '@/types/reportes'
import { colorDeSerie } from '@/utils/colores'
import { agruparVentasPorMarca, valorPorBodega } from '@/utils/graficos'
import { formatearEntero, formatearMoneda, redondearMoneda } from '@/utils/moneda'

// Las 4 vistas que alimentan el dashboard (plan 5.4). Comparten la caché con `/reportes/:vista`.
const VISTAS_DEL_DASHBOARD: VistaReporte[] = [
  'cuentas-por-cobrar',
  'bodegas',
  'repuestos-disponibles',
  'desempeno-marca',
]

const reportes = useReportesStore()

onMounted(() => {
  void Promise.all(VISTAS_DEL_DASHBOARD.map((vista) => reportes.cargar(vista)))
})

const cuentas = computed(() => reportes.filasDe('cuentas-por-cobrar'))
const bodegas = computed(() => reportes.filasDe('bodegas'))
const repuestos = computed(() => reportes.filasDe('repuestos-disponibles'))
const desempeno = computed(() => reportes.filasDe('desempeno-marca'))

/** Cargando = todavía no hay datos y la petición sigue en curso (con error ya no se espera nada). */
function cargandoVista(vista: VistaReporte): boolean {
  return reportes.estaCargando(vista)
}

function plural(cantidad: number, singular: string, plural: string): string {
  return `${formatearEntero(cantidad)} ${cantidad === 1 ? singular : plural}`
}

// --- KPIs ---
const saldoPorCobrar = computed(() => {
  const filas = cuentas.value
  if (!filas) return null
  return {
    valor: formatearMoneda(redondearMoneda(filas.reduce((suma, f) => suma + f.Saldo, 0))),
    detalle: `${plural(filas.length, 'factura', 'facturas')} con saldo`,
  }
})

const valorEnBodegas = computed(() => {
  const filas = bodegas.value
  if (!filas) return null
  return {
    valor: formatearMoneda(redondearMoneda(filas.reduce((suma, f) => suma + f.Valor_Bodega, 0))),
    detalle: `${plural(filas.length, 'bodega', 'bodegas')}`,
  }
})

const repuestosConStock = computed(() => {
  const filas = repuestos.value
  if (!filas) return null
  const unidades = filas.reduce((suma, f) => suma + f.cantidad, 0)
  return {
    // Un mismo repuesto puede estar en varias bodegas: se cuenta una vez.
    valor: formatearEntero(new Set(filas.map((f) => f.Codigo_oe)).size),
    detalle: `${plural(unidades, 'unidad', 'unidades')} en total`,
  }
})

// --- Gráfico: venta por marca y categoría ---
const ventas = computed(() => (desempeno.value ? agruparVentasPorMarca(desempeno.value) : null))

const seriesVentas = computed<SerieGrafico[]>(() =>
  (ventas.value?.series ?? []).map((serie, indice) => ({
    etiqueta: serie.categoria,
    datos: serie.valores,
    color: colorDeSerie(indice, serie.esOtros),
  })),
)

const leyendaVentas = computed<ItemLeyenda[]>(() =>
  seriesVentas.value.map((serie) => ({ etiqueta: serie.etiqueta, color: serie.color })),
)

// --- Gráfico: valor por bodega (una sola serie: sin leyenda, el título la nombra) ---
const valorBodegas = computed(() => (bodegas.value ? valorPorBodega(bodegas.value) : null))

const seriesBodegas = computed<SerieGrafico[]>(() => [
  { etiqueta: 'Valor', datos: valorBodegas.value?.valores ?? [], color: colorDeSerie(0) },
])

// --- Errores ---
const vistasConError = computed(() =>
  VISTAS_DEL_DASHBOARD.filter((vista) => reportes.errorDe(vista) !== null),
)
const mensajeDeError = computed(() => {
  const primera = vistasConError.value[0]
  return primera ? reportes.errorDe(primera) : null
})

function reintentar(): void {
  void Promise.all(vistasConError.value.map((vista) => reportes.cargar(vista, { force: true })))
}
</script>

<template>
  <div class="d-grid gap-3">
    <div v-if="vistasConError.length > 0" class="alert alert-danger mb-0" role="alert">
      <AppIcon nombre="x-circle" />
      <div class="flex-grow-1">
        <span class="alert__title">No se pudieron cargar algunos datos</span>
        {{ mensajeDeError }}
      </div>
      <button type="button" class="btn btn-neutral btn-sm" @click="reintentar">Reintentar</button>
    </div>

    <div class="row g-3">
      <div class="col-md-4">
        <KpiCard
          titulo="Saldo por cobrar"
          :valor="saldoPorCobrar?.valor ?? null"
          :detalle="saldoPorCobrar?.detalle"
          :cargando="cargandoVista('cuentas-por-cobrar')"
        />
      </div>
      <div class="col-md-4">
        <KpiCard
          titulo="Valor en bodegas"
          :valor="valorEnBodegas?.valor ?? null"
          :detalle="valorEnBodegas?.detalle"
          :cargando="cargandoVista('bodegas')"
        />
      </div>
      <div class="col-md-4">
        <KpiCard
          titulo="Repuestos con stock"
          :valor="repuestosConStock?.valor ?? null"
          :detalle="repuestosConStock?.detalle"
          :cargando="cargandoVista('repuestos-disponibles')"
        />
      </div>
    </div>

    <div class="row g-3">
      <div class="col-lg-7">
        <ChartCard
          titulo="Venta por marca y categoría"
          subtitulo="USD con IVA · barras apiladas"
          :leyenda="leyendaVentas"
        >
          <template #acciones>
            <RouterLink
              :to="{ name: 'reporte', params: { vista: 'desempeno-marca' } }"
              class="btn btn-neutral btn-sm"
            >
              <AppIcon nombre="table" />Ver tabla
            </RouterLink>
          </template>
          <div v-if="cargandoVista('desempeno-marca')" class="placeholder-glow h-100">
            <span class="placeholder d-block w-100 h-100"></span>
          </div>
          <EmptyState
            v-else-if="!ventas || ventas.marcas.length === 0"
            icono="bar-chart"
            titulo="Sin ventas para mostrar"
            texto="Cuando haya facturas emitidas van a aparecer aquí."
          />
          <GraficoBarras
            v-else
            :etiquetas="ventas.marcas"
            :series="seriesVentas"
            descripcion="Venta por marca y categoría, en barras apiladas. Los mismos datos están en la tabla del reporte Desempeño por marca."
            apilado
          />
        </ChartCard>
      </div>

      <div class="col-lg-5">
        <ChartCard titulo="Valor por bodega" subtitulo="USD · una sola serie">
          <template #acciones>
            <RouterLink
              :to="{ name: 'reporte', params: { vista: 'bodegas' } }"
              class="btn btn-neutral btn-sm"
            >
              <AppIcon nombre="table" />Ver tabla
            </RouterLink>
          </template>
          <div v-if="cargandoVista('bodegas')" class="placeholder-glow h-100">
            <span class="placeholder d-block w-100 h-100"></span>
          </div>
          <EmptyState
            v-else-if="!valorBodegas || valorBodegas.etiquetas.length === 0"
            icono="bar-chart"
            titulo="Sin bodegas para mostrar"
          />
          <GraficoBarras
            v-else
            :etiquetas="valorBodegas.etiquetas"
            :series="seriesBodegas"
            descripcion="Valor del inventario por bodega, en barras horizontales. Los mismos datos están en la tabla del reporte Bodegas."
            horizontal
          />
        </ChartCard>
      </div>
    </div>
  </div>
</template>
