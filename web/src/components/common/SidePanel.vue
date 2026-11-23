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

const ENFOCABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function enfocables(): HTMLElement[] {
  return raiz.value ? Array.from(raiz.value.querySelectorAll<HTMLElement>(ENFOCABLES)) : []
}

// El panel tapa la página con un fondo: el foco no puede irse detrás de él. Tab y Shift+Tab dan la
// vuelta dentro del panel, y si el foco ya quedó afuera (por ejemplo, tras un clic en el fondo) vuelve
// al primer campo.
function mantenerFocoAdentro(evento: KeyboardEvent): void {
  const items = enfocables()
  const primero = items[0]
  const ultimo = items[items.length - 1]
  if (!primero || !ultimo) return

  const actual = document.activeElement
  const adentro = actual instanceof Node && raiz.value?.contains(actual)
  if (!adentro) {
    evento.preventDefault()
    primero.focus()
  } else if (evento.shiftKey && actual === primero) {
    evento.preventDefault()
    ultimo.focus()
  } else if (!evento.shiftKey && actual === ultimo) {
    evento.preventDefault()
    primero.focus()
  }
}

// Esc y Tab se escuchan en todo el documento y no solo en el panel: tras un clic en el fondo el foco
// queda en el `body`, y Esc tiene que seguir cerrando.
function alPulsarTecla(evento: KeyboardEvent): void {
  if (evento.key === 'Escape') emit('cerrar')
  else if (evento.key === 'Tab') mantenerFocoAdentro(evento)
}

// Un clic o un foco programático que cae fuera del panel (por ejemplo el botón de cerrar de un
// toast) devuelve el foco adentro.
function recuperarFoco(evento: FocusEvent): void {
  const destino = evento.target
  if (destino instanceof Node && raiz.value && !raiz.value.contains(destino)) {
    enfocables()[0]?.focus()
  }
}

onMounted(() => {
  // Al abrir, el foco va al primer campo: se puede empezar a escribir sin tocar el mouse.
  // `preventScroll`: el panel todavía está entrando desde la derecha y no debe mover la página.
  raiz.value
    ?.querySelector<HTMLElement>(
      'input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
    )
    ?.focus({ preventScroll: true })
  document.addEventListener('keydown', alPulsarTecla)
  document.addEventListener('focusin', recuperarFoco)
})

onBeforeUnmount(() => {
  // Primero se sueltan los oyentes: si no, devolver el foco al botón de origen lo "recuperaría" de vuelta.
  document.removeEventListener('keydown', alPulsarTecla)
  document.removeEventListener('focusin', recuperarFoco)
  elementoPrevio?.focus()
})
</script>

<template>
  <!--
    El panel flota sobre la página (`.cc-sidepanel--overlay`, 360px a la derecha) en vez de ir al lado
    del contenido, así la tabla no se angosta al abrirlo. Se sigue dibujando en el destino de App.vue y
    no donde se escribe. El fondo NO cierra el panel: un clic fuera por error no debe perder lo que el
    usuario escribió; se cierra con la X, "Cancelar" o Esc.
    La entrada se anima con CSS (`@keyframes`). La salida es instantánea a propósito: las vistas lo
    montan con `v-if`, y Vue no corre la animación de salida de un componente que se desmonta de golpe
    (`<Transition>` la saltea). Animarla pediría mantenerlo montado y congelar el formulario mientras sale.
  -->
  <Teleport to="#panel-lateral">
    <div class="cc-sidepanel-backdrop" aria-hidden="true"></div>
    <aside
      ref="raiz"
      class="cc-sidepanel cc-sidepanel--overlay"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="idTitulo"
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
