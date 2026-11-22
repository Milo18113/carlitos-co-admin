<script setup lang="ts">
import { Modal } from 'bootstrap'
import { onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'

import AppIcon from './AppIcon.vue'

const props = withDefaults(
  defineProps<{
    /** Muestra u oculta el diálogo. El padre lo controla. */
    abierto: boolean
    /** Pregunta: "¿Eliminar este pago?". */
    titulo: string
    /** Consecuencia de la acción, escrita para quien la va a confirmar. */
    mensaje: string
    /** Texto del botón que confirma. */
    textoConfirmar?: string
    /** Texto del botón que descarta. */
    textoCancelar?: string
    /** Ícono de Bootstrap Icons, sin el prefijo `bi-`. */
    icono?: string
    /** Hay una petición en curso: se deshabilitan los botones. */
    procesando?: boolean
  }>(),
  { textoConfirmar: 'Eliminar', textoCancelar: 'Cancelar', icono: 'trash' },
)

const emit = defineEmits<{
  confirmar: []
  /** Botón Cancelar, tecla Esc o clic fuera del diálogo. El padre debe poner `abierto` en `false`. */
  cancelar: []
}>()

const raiz = ref<HTMLElement | null>(null)
const idTitulo = useId()
let modal: Modal | undefined

// En qué punto va Bootstrap. Mientras anima, `show()` y `hide()` se ignoran: hay que saberlo para
// no quedar abiertos cuando el padre ya pidió cerrar (y al revés), y para desmontar (ver `liberar`).
type EstadoModal = 'cerrado' | 'abriendo' | 'abierto' | 'cerrando'
let estado: EstadoModal = 'cerrado'
// El padre pidió abrir mientras el modal se estaba cerrando: se vuelve a abrir al terminar.
let reabrir = false

/** Bootstrap terminó de ocultar el modal: por el padre, o por Esc / clic fuera. */
function alOcultarse(): void {
  estado = 'cerrado'
  if (reabrir) {
    reabrir = false
    modal?.show()
    return
  }
  // Esc y el clic en el fondo cierran el modal por su cuenta: se avisa para que el padre se entere.
  if (props.abierto) emit('cancelar')
}

/** Terminó de abrirse; si mientras tanto el padre pidió cerrar, se cierra ahora. */
function alMostrarse(): void {
  estado = 'abierto'
  if (!props.abierto) modal?.hide()
}

onMounted(() => {
  if (!raiz.value) return
  const elemento = raiz.value
  modal = new Modal(elemento)
  elemento.addEventListener('show.bs.modal', () => (estado = 'abriendo'))
  elemento.addEventListener('shown.bs.modal', alMostrarse)
  elemento.addEventListener('hide.bs.modal', () => (estado = 'cerrando'))
  elemento.addEventListener('hidden.bs.modal', alOcultarse)
  if (props.abierto) modal.show()
})

watch(
  () => props.abierto,
  (abierto) => {
    if (!modal) return
    if (abierto) {
      if (estado === 'cerrado') modal.show()
      else if (estado === 'cerrando') reabrir = true
    } else {
      reabrir = false
      // Si todavía se está abriendo, `alMostrarse` lo cierra apenas termine.
      if (estado === 'abierto') modal.hide()
    }
  },
)

/**
 * Se desmonta con el modal abierto o a medio animar (el usuario vuelve atrás, o un 401 redirige
 * al login). Si solo se hiciera `dispose()`, los temporizadores pendientes de Bootstrap fallarían
 * y el fondo oscuro y el scroll bloqueado del body quedarían para siempre. Se cierra sin animación
 * y la instancia se libera recién cuando Bootstrap terminó de ocultar el modal.
 */
function liberar(instancia: Modal, elemento: HTMLElement): void {
  elemento.classList.remove('fade')
  if (estado === 'cerrado') {
    instancia.dispose()
    return
  }
  elemento.addEventListener(
    'hidden.bs.modal',
    () => {
      instancia.dispose()
      // Si Bootstrap lo había reubicado en el body a mitad de la animación, no queda huérfano.
      elemento.remove()
    },
    { once: true },
  )
  if (estado === 'abierto') instancia.hide()
  // 'abriendo': `hide()` se ignora hasta que termine de abrirse, así que se cierra apenas abra.
  else if (estado === 'abriendo') {
    elemento.addEventListener('shown.bs.modal', () => instancia.hide(), { once: true })
  }
  // 'cerrando': ya va camino a 'hidden'; solo hay que esperarlo.
}

onBeforeUnmount(() => {
  if (!modal || !raiz.value) return
  // Al desmontar no se le avisa al padre (él es quien nos quitó) ni se reabre nada.
  raiz.value.removeEventListener('shown.bs.modal', alMostrarse)
  raiz.value.removeEventListener('hidden.bs.modal', alOcultarse)
  reabrir = false
  liberar(modal, raiz.value)
})
</script>

<template>
  <!-- Teleport: el modal y su fondo cuelgan del body, fuera del contenedor con scroll del layout -->
  <Teleport to="body">
    <div ref="raiz" class="modal fade" tabindex="-1" :aria-labelledby="idTitulo" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-body p-4">
            <div class="d-flex gap-3">
              <div class="cc-confirm__icon cc-confirm__icon--danger">
                <AppIcon :nombre="icono" />
              </div>
              <div>
                <h2 :id="idTitulo" class="h3 mb-1">{{ titulo }}</h2>
                <p class="text-body-secondary mb-0">{{ mensaje }}</p>
              </div>
            </div>
          </div>
          <div class="modal-footer px-4 pb-4 pt-0">
            <button
              type="button"
              class="btn btn-neutral"
              :disabled="procesando"
              @click="emit('cancelar')"
            >
              {{ textoCancelar }}
            </button>
            <button
              type="button"
              class="btn btn-danger"
              :disabled="procesando"
              @click="emit('confirmar')"
            >
              <span
                v-if="procesando"
                class="spinner-border spinner-border-sm"
                aria-hidden="true"
              ></span>
              {{ textoConfirmar }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
