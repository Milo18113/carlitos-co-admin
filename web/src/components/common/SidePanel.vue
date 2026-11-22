<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId } from 'vue'

import AppIcon from './AppIcon.vue'

defineProps<{
  /** Título del panel ("Nuevo cliente"); también es su nombre accesible. */
  titulo: string
}>()

const emit = defineEmits<{
  /** La X o la tecla Esc. El padre decide si cierra (por ejemplo, no si hay una petición en curso). */
  cerrar: []
}>()

defineSlots<{
  /** El contenido del panel, normalmente un formulario. */
  default?: () => unknown
}>()

const raiz = ref<HTMLElement | null>(null)
const idTitulo = useId()
// Quién tenía el foco cuando se abrió el panel (el botón "Nuevo…"): se le devuelve al cerrarlo,
// para que quien navega con teclado no pierda el lugar.
const elementoPrevio = document.activeElement instanceof HTMLElement ? document.activeElement : null

onMounted(() => {
  // Al abrir, el foco va al primer campo: se puede empezar a escribir sin tocar el mouse.
  raiz.value
    ?.querySelector<HTMLElement>(
      'input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
    )
    ?.focus()
})

onBeforeUnmount(() => {
  elementoPrevio?.focus()
})
</script>

<template>
  <!--
    El panel mide 360px y va al lado del contenido (DESIGN.md › Layout), que es un hermano suyo en
    `.cc-shell__body`: por eso no se dibuja donde se escribe, sino en el destino de App.vue.
  -->
  <Teleport to="#panel-lateral">
    <aside
      ref="raiz"
      class="cc-sidepanel"
      :aria-labelledby="idTitulo"
      @keydown.esc="emit('cerrar')"
    >
      <div class="cc-sidepanel__head">
        <h2 :id="idTitulo" class="cc-sidepanel__title">{{ titulo }}</h2>
        <button
          type="button"
          class="btn btn-neutral btn-icon btn-sm"
          aria-label="Cerrar panel"
          @click="emit('cerrar')"
        >
          <AppIcon nombre="x-lg" />
        </button>
      </div>
      <slot />
    </aside>
  </Teleport>
</template>
