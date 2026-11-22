<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** `id` del control: lo usa el `for` del label y los `aria-describedby`. */
  id: string
  /** Texto del label. */
  etiqueta: string
  /** Mensaje de error; si está, el control se marca como inválido. */
  error?: string | null
  /** Ayuda debajo del control (se oculta mientras hay un error). */
  ayuda?: string
}>()

const idMensaje = computed(() => {
  if (props.error) return `${props.id}-error`
  return props.ayuda ? `${props.id}-ayuda` : undefined
})
</script>

<template>
  <div class="mb-3">
    <label :for="id" class="form-label">{{ etiqueta }}</label>
    <!-- El control lo pone quien usa el componente; recibe lo que necesita para ser accesible -->
    <slot :invalido="Boolean(error)" :describedby="idMensaje" />
    <div v-if="error" :id="`${id}-error`" class="invalid-feedback d-block">{{ error }}</div>
    <div v-else-if="ayuda" :id="`${id}-ayuda`" class="form-text">{{ ayuda }}</div>
  </div>
</template>
