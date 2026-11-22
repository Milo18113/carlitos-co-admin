<script setup lang="ts">
import AppIcon from '@/components/common/AppIcon.vue'

defineProps<{
  /** Se está armando el PDF: muestra el spinner y deshabilita el botón. */
  generando?: boolean
  /** No hay nada que exportar (cargando, error o sin filas). */
  deshabilitado?: boolean
}>()

const emit = defineEmits<{
  exportar: []
}>()
</script>

<template>
  <!-- `.btn-accent` es de uso excepcional: máximo uno por pantalla (DESIGN.md › Componentes) -->
  <button
    type="button"
    class="btn btn-accent"
    :disabled="generando || deshabilitado"
    @click="emit('exportar')"
  >
    <span v-if="generando" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
    <AppIcon v-else nombre="file-earmark-pdf" />
    {{ generando ? 'Generando…' : 'Generar reporte PDF' }}
  </button>
</template>
