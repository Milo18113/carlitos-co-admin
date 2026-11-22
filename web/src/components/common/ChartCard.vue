<script setup lang="ts">
import type { ItemLeyenda } from '@/types/grafico'

defineProps<{
  /** Título de la tarjeta. */
  titulo: string
  /** Aclaración debajo del título ("Miles de USD · barras apiladas"). */
  subtitulo?: string
  /** Leyenda HTML propia (la de canvas de Chart.js no se usa). Una sola serie va sin leyenda. */
  leyenda?: ItemLeyenda[]
}>()

defineSlots<{
  /** El gráfico (un `<canvas>`). */
  default?: () => unknown
  /** Acciones a la derecha del título, por ejemplo "Descargar". */
  acciones?: () => unknown
}>()
</script>

<template>
  <div class="cc-chart-card">
    <div class="cc-chart-card__head">
      <div>
        <h2 class="cc-chart-card__title">{{ titulo }}</h2>
        <p v-if="subtitulo" class="cc-chart-card__sub">{{ subtitulo }}</p>
      </div>
      <slot name="acciones" />
    </div>

    <ul v-if="leyenda?.length" class="cc-legend" aria-label="Leyenda">
      <li v-for="item in leyenda" :key="item.etiqueta" class="cc-legend__item">
        <span class="cc-legend__dot" :style="{ '--dot': item.color }" aria-hidden="true"></span>
        {{ item.etiqueta }}
      </li>
    </ul>

    <div class="cc-chart-card__plot">
      <slot />
    </div>
  </div>
</template>
