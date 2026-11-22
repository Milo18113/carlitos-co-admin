<script setup lang="ts">
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
} from 'chart.js'
import type { ChartData, ChartOptions } from 'chart.js'
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'

import type { SerieGrafico } from '@/types/grafico'
import { leerVariableCss } from '@/utils/colores'
import { formatearEntero, formatearMoneda } from '@/utils/moneda'

const props = defineProps<{
  /** Una etiqueta por barra (marcas, bodegas…). */
  etiquetas: string[]
  /** Una serie por color; con `apilado` se suman en cada barra. */
  series: SerieGrafico[]
  /** Texto que lee un lector de pantalla en lugar del gráfico. */
  descripcion: string
  /** Barras apiladas (por defecto, agrupadas una al lado de otra). */
  apilado?: boolean
  /** Barras horizontales (por defecto, verticales). */
  horizontal?: boolean
}>()

// Solo lo que se usa: así Chart.js no mete en el bundle los tipos de gráfico que la app no dibuja.
ChartJS.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip)
ChartJS.defaults.font.family = getComputedStyle(document.body).fontFamily
ChartJS.defaults.font.size = 12 // text-xs de DESIGN.md

// Quien prefiere menos movimiento no ve la animación de entrada.
const reducirMovimiento = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

const datos = computed<ChartData<'bar'>>(() => ({
  labels: props.etiquetas,
  datasets: props.series.map((serie) => ({
    label: serie.etiqueta,
    data: serie.datos,
    backgroundColor: serie.color,
    borderRadius: 4,
    maxBarThickness: 24,
    // Separación de 2px entre segmentos apilados, del color de la superficie.
    borderWidth: props.apilado ? 2 : 0,
    borderColor: leerVariableCss('--bs-white'),
  })),
}))

const opciones = computed<ChartOptions<'bar'>>(() => {
  const colorGrilla = leerVariableCss('--cc-chart-grid')
  const colorTexto = leerVariableCss('--cc-chart-tick')

  // El eje de las cifras lleva la grilla; el de las categorías, solo la línea base (sin grilla vertical).
  const ejeValores = {
    stacked: props.apilado,
    beginAtZero: true,
    grid: { color: colorGrilla },
    border: { display: false },
    ticks: {
      color: colorTexto,
      callback: (valor: string | number) => formatearEntero(Number(valor)),
    },
  }
  const ejeCategorias = {
    stacked: props.apilado,
    grid: { display: false },
    border: { color: colorGrilla },
    ticks: { color: colorTexto },
  }

  return {
    indexAxis: props.horizontal ? 'y' : 'x',
    responsive: true,
    maintainAspectRatio: false,
    animation: reducirMovimiento ? false : undefined,
    interaction: { mode: 'index', intersect: false },
    scales: props.horizontal
      ? { x: ejeValores, y: ejeCategorias }
      : { x: ejeCategorias, y: ejeValores },
    plugins: {
      // La leyenda es HTML y la pone `ChartCard`.
      legend: { display: false },
      tooltip: {
        backgroundColor: leerVariableCss('--bs-gray-900'),
        titleColor: leerVariableCss('--bs-white'),
        bodyColor: leerVariableCss('--bs-white'),
        cornerRadius: 8,
        padding: 10,
        // Las series en cero no aportan nada al detalle de una barra apilada.
        filter: (elemento) => elemento.raw !== 0,
        callbacks: {
          label: (elemento) => {
            const valor = props.horizontal ? elemento.parsed.x : elemento.parsed.y
            return ` ${elemento.dataset.label ?? ''}: ${formatearMoneda(valor ?? 0)}`
          },
        },
      },
    },
  }
})
</script>

<template>
  <Bar :data="datos" :options="opciones" role="img" :aria-label="descripcion" />
</template>
