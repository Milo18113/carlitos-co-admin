<script setup lang="ts">
import AppIcon from '@/components/common/AppIcon.vue'

defineProps<{
  /** Título de la página actual. */
  titulo: string
  /** Deshabilita el botón mientras se cierra la sesión. */
  cerrandoSesion?: boolean
}>()

const emit = defineEmits<{
  /** Solo se ve debajo de `lg`: abre el sidebar como offcanvas. */
  abrirMenu: []
  /** CU-02. */
  cerrarSesion: []
}>()
</script>

<template>
  <header class="cc-topbar">
    <div class="d-flex align-items-center gap-2">
      <button
        type="button"
        class="btn btn-neutral btn-icon d-lg-none"
        aria-label="Abrir menú"
        @click="emit('abrirMenu')"
      >
        <AppIcon nombre="list" />
      </button>
      <h1 class="cc-page-title">{{ titulo }}</h1>
    </div>

    <div class="cc-topbar__actions">
      <button
        type="button"
        class="btn btn-neutral"
        aria-label="Cerrar sesión"
        :disabled="cerrandoSesion"
        @click="emit('cerrarSesion')"
      >
        <AppIcon nombre="box-arrow-right" />
        <span class="d-none d-sm-inline">Cerrar sesión</span>
      </button>
    </div>
  </header>
</template>
