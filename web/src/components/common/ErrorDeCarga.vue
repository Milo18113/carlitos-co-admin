<script setup lang="ts">
import EmptyState from './EmptyState.vue'

withDefaults(
  defineProps<{
    /** El motivo, tal como lo dejó el store (`error`). */
    mensaje: string
    /** Qué no se pudo cargar. */
    titulo?: string
  }>(),
  { titulo: 'No se pudieron cargar los datos' },
)

const emit = defineEmits<{
  /** El botón "Reintentar". */
  reintentar: []
}>()
</script>

<template>
  <div class="cc-table-wrap" role="alert">
    <EmptyState icono="exclamation-triangle" :titulo="titulo" :texto="mensaje">
      <button type="button" class="btn btn-primary" @click="emit('reintentar')">Reintentar</button>
    </EmptyState>
  </div>
</template>
