import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { ROL_ADMINISTRADOR } from '@/config/roles'
import { authService } from '@/services'
import { NoAutorizadoError } from '@/services/errores'
import type { Credenciales, Sesion } from '@/types/empleado'

const MENSAJE_LOGIN_INCORRECTO = 'Usuario o contraseña incorrectos'
const MENSAJE_SESION_EXPIRADA = 'Tu sesión expiró. Inicia sesión de nuevo.'

function mensajeDe(causa: unknown): string {
  return causa instanceof Error ? causa.message : 'Error desconocido'
}

export const useAuthStore = defineStore('auth', () => {
  const empleado = ref<Sesion | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  // Distingue "todavía no le pregunté al API" de "le pregunté y no hay sesión".
  const sesionCargada = ref(false)
  let inflight: Promise<void> | undefined

  const estaAutenticado = computed(() => empleado.value !== null)
  const esAdministrador = computed(() => empleado.value?.codigo_rol === ROL_ADMINISTRADOR)

  /**
   * Pregunta una sola vez quién es el empleado de la sesión (`GET /auth/me`). Es una carga
   * compartida (plantilla 3.2 del skill): si el guard y otra llamada coinciden, la segunda
   * espera a la primera en vez de salir con la sesión todavía vacía.
   */
  function cargarSesion({ force = false } = {}): Promise<void> {
    if (sesionCargada.value && !force) return Promise.resolve()
    inflight ??= (async () => {
      isLoading.value = true
      error.value = null
      try {
        empleado.value = await authService.obtenerSesion()
      } catch (causa) {
        empleado.value = null
        // No tener sesión es lo normal antes de entrar: no es un error que mostrar.
        if (!(causa instanceof NoAutorizadoError)) error.value = mensajeDe(causa)
      } finally {
        sesionCargada.value = true
        isLoading.value = false
      }
    })().finally(() => {
      inflight = undefined
    })
    return inflight
  }

  /** Devuelve `true` si entró; si no, deja el motivo en `error`. */
  async function login(credenciales: Credenciales): Promise<boolean> {
    isLoading.value = true
    error.value = null
    try {
      empleado.value = await authService.iniciarSesion(credenciales)
      sesionCargada.value = true
      return true
    } catch (causa) {
      // Un 401 en el login es "credenciales incorrectas", no "sesión vencida".
      error.value = causa instanceof NoAutorizadoError ? MENSAJE_LOGIN_INCORRECTO : mensajeDe(causa)
      return false
    } finally {
      isLoading.value = false
    }
  }

  /** Devuelve `true` si la sesión se cerró. Si el API falla, la sesión local se conserva. */
  async function logout(): Promise<boolean> {
    isLoading.value = true
    error.value = null
    try {
      await authService.cerrarSesion()
      limpiarSesion()
      return true
    } catch (causa) {
      error.value = mensajeDe(causa)
      return false
    } finally {
      isLoading.value = false
    }
  }

  /** Olvida al empleado sin llamar al API. `sesionCargada` queda en `true`: ya sabemos que no hay sesión. */
  function limpiarSesion(): void {
    empleado.value = null
    sesionCargada.value = true
  }

  /** Un 401 en medio de una sesión activa: se limpia y el login muestra el motivo. */
  function expirarSesion(): void {
    limpiarSesion()
    error.value = MENSAJE_SESION_EXPIRADA
  }

  return {
    empleado,
    isLoading,
    error,
    estaAutenticado,
    esAdministrador,
    cargarSesion,
    login,
    logout,
    limpiarSesion,
    expirarSesion,
  }
})
