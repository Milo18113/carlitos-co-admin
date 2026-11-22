import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { clientesService } from '@/services'
import type { Cliente, ClienteNuevo } from '@/types/cliente'

import { crearCargadorPorClave } from './cargadorPorClave'
import { ejecutarEscritura } from './ejecutarEscritura'

export const useClientesStore = defineStore('clientes', () => {
  // Una sola lista: la fábrica con la clave `lista`.
  const cargador = crearCargadorPorClave<{ lista: Cliente[] }>(() => clientesService.listar())

  const clientes = computed(() => cargador.valorDe('lista') ?? [])
  const isLoading = computed(() => cargador.estaCargando('lista'))
  const error = computed(() => cargador.errorDe('lista'))
  const isSaving = ref(false)

  function cargar({ force = false } = {}): Promise<void> {
    return cargador.cargar('lista', { force })
  }

  /**
   * CU-06. `registrar_cliente` crea el cliente o, si ya existe, actualiza sus datos: el mismo
   * método sirve para "Nuevo cliente" y para editar. Devuelve `true` si salió bien.
   */
  function registrar(datos: ClienteNuevo): Promise<boolean> {
    return ejecutarEscritura(isSaving, () => clientesService.registrar(datos), {
      tituloExito: 'Cliente guardado',
      tituloError: 'No se pudo guardar el cliente',
      alExito: () => cargar({ force: true }),
    })
  }

  return { clientes, isLoading, isSaving, error, cargar, registrar }
})
