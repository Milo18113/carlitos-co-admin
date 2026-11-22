import { computed } from 'vue'
import type { WritableComputedRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/**
 * El texto del buscador de una tabla, guardado en la URL como `?q=`. La URL es la fuente de
 * verdad de los filtros: se puede compartir el link y la búsqueda sobrevive a recargar la página.
 * Se reemplaza la entrada del historial (no se agrega una por tecla), y vaciar el buscador quita `?q=`.
 */
export function useFiltroUrl(): WritableComputedRef<string> {
  const route = useRoute()
  const router = useRouter()

  return computed({
    get: () => (typeof route.query.q === 'string' ? route.query.q : ''),
    set: (valor: string) => {
      void router.replace({ query: valor.trim() === '' ? {} : { q: valor } })
    },
  })
}
