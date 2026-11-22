<script setup lang="ts">
defineProps<{
  /** Nombre de la cifra ("Saldo por cobrar"). */
  titulo: string
  /** La cifra ya formateada ("$ 35.966,40"). `null` = sin dato todavía. */
  valor: string | null
  /** Línea de contexto debajo de la cifra ("12 facturas con saldo"). */
  detalle?: string
  /** Muestra un skeleton en lugar de la cifra. */
  cargando?: boolean
}>()
</script>

<template>
  <div class="cc-kpi" :aria-busy="cargando">
    <div class="cc-kpi__label">{{ titulo }}</div>
    <div class="cc-kpi__value">
      <span v-if="cargando" class="placeholder-glow d-block" aria-hidden="true">
        <span class="placeholder col-6"></span>
      </span>
      <template v-else>{{ valor ?? '—' }}</template>
    </div>
    <div v-if="detalle && !cargando" class="cc-kpi__hint ms-0">{{ detalle }}</div>
  </div>
</template>
