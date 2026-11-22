<script setup lang="ts">
import { RouterLink } from 'vue-router'

import EmptyState from '@/components/common/EmptyState.vue'
</script>

<template>
  <EmptyState
    icono="question-circle"
    titulo="Página no encontrada"
    texto="La dirección que abriste no existe o ya no está disponible."
  >
    <RouterLink :to="{ name: 'dashboard' }" class="btn btn-primary">Ir al dashboard</RouterLink>
  </EmptyState>
</template>
