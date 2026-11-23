<script setup lang="ts">
import type { Notificacion, TipoNotificacion } from '@/types/notificacion'

import AppIcon from './AppIcon.vue'

defineProps<{
  /** Notificaciones a mostrar, de la más vieja a la más nueva. */
  notificaciones: Notificacion[]
}>()

const emit = defineEmits<{
  /** El usuario cerró una notificación con la X. */
  descartar: [id: number]
}>()

// El color nunca va solo: cada tipo lleva además su ícono (DESIGN.md › Estados y feedback).
const ESTILOS: Record<TipoNotificacion, { clase: string; icono: string }> = {
  exito: { clase: 'cc-toast--success', icono: 'check-circle' },
  error: { clase: 'cc-toast--danger', icono: 'x-circle' },
  info: { clase: 'cc-toast--info', icono: 'info-circle' },
}
</script>

<template>
  <div
    class="toast-container position-fixed bottom-0 start-50 translate-middle-x p-3"
    aria-live="polite"
  >
    <div
      v-for="notificacion in notificaciones"
      :key="notificacion.id"
      :class="['toast', 'show', 'cc-toast', ESTILOS[notificacion.tipo].clase]"
      :role="notificacion.tipo === 'error' ? 'alert' : 'status'"
    >
      <AppIcon :nombre="ESTILOS[notificacion.tipo].icono" />
      <div class="flex-grow-1">
        <div class="cc-toast__title">{{ notificacion.titulo }}</div>
        <div v-if="notificacion.texto" class="cc-toast__text">{{ notificacion.texto }}</div>
      </div>
      <button
        type="button"
        class="btn-close"
        aria-label="Cerrar"
        @click="emit('descartar', notificacion.id)"
      ></button>
    </div>
  </div>
</template>
