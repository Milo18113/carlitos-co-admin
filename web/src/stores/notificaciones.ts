import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { Notificacion, TipoNotificacion } from '@/types/notificacion'

/** Un error se queda más tiempo: hay que alcanzar a leerlo. */
const DURACION_MS: Record<TipoNotificacion, number> = {
  exito: 5000,
  info: 5000,
  error: 8000,
}

/** Con más de estos en pantalla se descartan los más viejos, para que no tapen la página. */
const MAXIMO_VISIBLES = 4

export const useNotificacionesStore = defineStore('notificaciones', () => {
  const items = ref<Notificacion[]>([])
  // Privado: los temporizadores no son estado que la UI deba ver.
  const temporizadores = new Map<number, ReturnType<typeof setTimeout>>()
  let siguienteId = 1

  function descartar(id: number): void {
    clearTimeout(temporizadores.get(id))
    temporizadores.delete(id)
    items.value = items.value.filter((notificacion) => notificacion.id !== id)
  }

  function notificar(tipo: TipoNotificacion, titulo: string, texto?: string): number {
    const id = siguienteId++
    items.value.push({ id, tipo, titulo, texto })
    temporizadores.set(
      id,
      setTimeout(() => descartar(id), DURACION_MS[tipo]),
    )

    while (items.value.length > MAXIMO_VISIBLES) {
      const masVieja = items.value[0]
      if (masVieja) descartar(masVieja.id)
    }
    return id
  }

  function exito(titulo: string, texto?: string): number {
    return notificar('exito', titulo, texto)
  }

  function error(titulo: string, texto?: string): number {
    return notificar('error', titulo, texto)
  }

  function info(titulo: string, texto?: string): number {
    return notificar('info', titulo, texto)
  }

  return { items, exito, error, info, descartar }
})
