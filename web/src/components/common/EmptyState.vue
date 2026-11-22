<script setup lang="ts">
import AppIcon from './AppIcon.vue'

withDefaults(
  defineProps<{
    /** Título del estado vacío. */
    titulo: string
    /** Texto de apoyo debajo del título. */
    texto?: string
    /** Ícono de Bootstrap Icons, sin el prefijo `bi-`. */
    icono?: string
  }>(),
  { icono: 'inbox' },
)
</script>

<template>
  <div class="cc-empty">
    <AppIcon :nombre="icono" grande />
    <h2 class="cc-empty__title">{{ titulo }}</h2>
    <p v-if="texto" class="cc-empty__text">{{ texto }}</p>
    <!-- Acción opcional (por ejemplo un botón primario) -->
    <slot />
  </div>
</template>
