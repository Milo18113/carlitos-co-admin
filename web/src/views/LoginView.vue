<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import logoCompleto from '@/assets/logo_full.png'
import AppIcon from '@/components/common/AppIcon.vue'
import FormField from '@/components/common/FormField.vue'
import { env } from '@/config/env'
import { useAuthStore } from '@/stores/auth'
import { rutaInternaSegura } from '@/utils/redireccion'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const formulario = reactive({ usuario: '', contrasena: '' })
// Los errores de campo solo aparecen después del primer intento de enviar.
const intentoEnvio = ref(false)

const errores = computed(() => ({
  usuario: intentoEnvio.value && formulario.usuario.trim() === '' ? 'Escribe tu usuario' : null,
  contrasena: intentoEnvio.value && formulario.contrasena === '' ? 'Escribe tu contraseña' : null,
}))

async function enviar(): Promise<void> {
  intentoEnvio.value = true
  if (errores.value.usuario || errores.value.contrasena) return

  const entro = await auth.login({
    usuario: formulario.usuario.trim(),
    contrasena: formulario.contrasena,
  })
  if (entro) await router.replace(rutaInternaSegura(route.query.redirect))
}
</script>

<template>
  <main class="cc-surface-subtle min-vh-100 d-flex align-items-center justify-content-center p-3">
    <div class="card cc-login">
      <div class="card-body p-4">
        <!-- El logo completo ya trae el nombre ("Carlitosco Importaciones"), no hace falta texto aparte -->
        <div class="text-center mb-3">
          <img :src="logoCompleto" alt="Carlitosco Importaciones" class="cc-login__logo" />
        </div>

        <h1 class="h2 mb-1 text-center">Iniciar sesión</h1>
        <p class="text-body-secondary mb-4 text-center">Ingresa con tu usuario de empleado.</p>

        <div v-if="auth.error" class="alert alert-danger" role="alert">
          <AppIcon nombre="x-circle" />
          <div>{{ auth.error }}</div>
        </div>

        <form novalidate @submit.prevent="enviar">
          <FormField
            id="login-usuario"
            etiqueta="Usuario"
            :error="errores.usuario"
            v-slot="{ invalido, describedby }"
          >
            <input
              id="login-usuario"
              v-model="formulario.usuario"
              type="text"
              class="form-control form-control-lg"
              :class="{ 'is-invalid': invalido }"
              :aria-describedby="describedby"
              autocomplete="username"
            />
          </FormField>

          <FormField
            id="login-contrasena"
            etiqueta="Contraseña"
            :error="errores.contrasena"
            v-slot="{ invalido, describedby }"
          >
            <input
              id="login-contrasena"
              v-model="formulario.contrasena"
              type="password"
              class="form-control form-control-lg"
              :class="{ 'is-invalid': invalido }"
              :aria-describedby="describedby"
              autocomplete="current-password"
            />
          </FormField>

          <button type="submit" class="btn btn-primary btn-lg w-100" :disabled="auth.isLoading">
            <span
              v-if="auth.isLoading"
              class="spinner-border spinner-border-sm"
              aria-hidden="true"
            ></span>
            {{ auth.isLoading ? 'Entrando…' : 'Entrar' }}
          </button>
        </form>

        <!-- Solo con mocks: el API real no tiene usuarios de demostración -->
        <div v-if="env.usarMocks" class="alert alert-info mt-4 mb-0" role="note">
          <AppIcon nombre="info-circle" />
          <div>
            <span class="alert__title">Datos de demostración</span>
            <code>admin</code> / <code>admin123</code> · <code>vendedor</code> /
            <code>vendedor123</code>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
