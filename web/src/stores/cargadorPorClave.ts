import { reactive, shallowRef } from 'vue'

import { mensajeDeError } from '@/utils/errores'

/**
 * Fábrica de la lógica de carga que comparten varios stores: caché, carga compartida y las reglas
 * contra carreras de las plantillas 3.1 y 3.2 del skill `vue-ts`. Un store que carga cosas por
 * clave (las 5 vistas de reportes, los 7 catálogos) o una sola lista (clave `lista`) la reutiliza
 * en vez de reescribirla.
 *
 * `M` mapea cada clave al tipo de lo que se carga: `{ marcas: Item[]; roles: Item<number>[] }`.
 */
export function crearCargadorPorClave<M extends object>(
  pedir: <K extends keyof M & string>(clave: K) => Promise<M[K]>,
) {
  // `shallowRef`: son listados de solo lectura y no hace falta volverlos reactivos fila por fila.
  const valores = shallowRef<Partial<M>>({})
  const cargando = reactive<Record<string, boolean>>({})
  const errores = reactive<Record<string, string | null>>({})

  // Privado: la UI no reacciona a las promesas en vuelo.
  const enVuelo = new Map<string, Promise<void>>()
  // Qué petición es la vigente de cada clave: las demás ya no pueden tocar el estado.
  const ultimaPeticion = new Map<string, number>()
  let contadorPeticiones = 0
  // Sube con cada `invalidar()`: una respuesta que salió antes de una escritura ya es vieja.
  let version = 0

  function valorDe<K extends keyof M & string>(clave: K): M[K] | undefined {
    return valores.value[clave]
  }

  function estaCargando(clave: string): boolean {
    return cargando[clave] ?? false
  }

  function errorDe(clave: string): string | null {
    return errores[clave] ?? null
  }

  /**
   * Carga una clave si no está en la caché. Carga compartida (plantilla 3.2): si ya hay una
   * petición en vuelo, la segunda llamada espera a la primera en vez de salir con los datos
   * todavía vacíos. `force` salta la caché y pide de nuevo (el botón "Reintentar", o recargar
   * después de una escritura); esa petición reemplaza a la que estaba en vuelo.
   */
  function cargar<K extends keyof M & string>(clave: K, { force = false } = {}): Promise<void> {
    if (!force && valores.value[clave] !== undefined) return Promise.resolve()

    const existente = enVuelo.get(clave)
    if (existente && !force) return existente

    const versionAlPedir = version
    const idPeticion = ++contadorPeticiones
    ultimaPeticion.set(clave, idPeticion)
    // Solo la última petición de esta clave guarda el resultado, apaga el loading y registra el
    // error (plantilla 3.1): una que `invalidar()` o un `force` dejaron vieja no debe pisar a la nueva.
    const esLaVigente = (): boolean => ultimaPeticion.get(clave) === idPeticion

    const pendiente = (async () => {
      cargando[clave] = true
      errores[clave] = null
      try {
        const resultado = await pedir(clave)
        // Si hubo una escritura mientras llegaba, se descarta: el próximo `cargar` la pide de nuevo.
        if (versionAlPedir === version && esLaVigente()) {
          valores.value = { ...valores.value, [clave]: resultado } as Partial<M>
        }
      } catch (causa) {
        if (esLaVigente()) errores[clave] = mensajeDeError(causa)
      } finally {
        if (esLaVigente()) {
          cargando[clave] = false
          enVuelo.delete(clave)
        }
      }
    })()
    enVuelo.set(clave, pendiente)
    return pendiente
  }

  /**
   * Vacía la caché. Se llama después de cada escritura que sale bien: los datos cambiaron, y lo
   * que estaba en vuelo ya es viejo (la próxima llamada tiene que pedir de nuevo, no unirse a eso).
   */
  function invalidar(): void {
    version++
    valores.value = {}
    enVuelo.clear()
    ultimaPeticion.clear()
    for (const clave of Object.keys(cargando)) cargando[clave] = false
    for (const clave of Object.keys(errores)) errores[clave] = null
  }

  return { valorDe, estaCargando, errorDe, cargar, invalidar }
}
