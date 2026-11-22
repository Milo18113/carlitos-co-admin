<script setup lang="ts">
defineProps<{
  /** Nombre en Bootstrap Icons, sin el prefijo `bi-` (por ejemplo `box-seam`). */
  nombre: string
  /** Tamaño grande (32px), para estados vacíos. */
  grande?: boolean
}>()
</script>

<template>
  <i :class="['bi', `bi-${nombre}`, 'cc-icon', { 'cc-icon--lg': grande }]" aria-hidden="true"></i>
</template>
