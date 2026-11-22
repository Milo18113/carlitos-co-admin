<script setup lang="ts">
import { Offcanvas } from 'bootstrap'
import { computed, ref, watchEffect } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'

import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import { gruposVisibles } from '@/router/navegacion'
import { useAuthStore } from '@/stores/auth'
import { REPORTES, esVistaReporte } from '@/types/reportes'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const menuMovil = ref<HTMLElement | null>(null)

// El login (y cualquier ruta sin sesión) se muestra sin sidebar ni topbar.
const mostrarLayout = computed(() => auth.estaAutenticado && !route.meta.sinLayout)

const grupos = computed(() => (auth.empleado ? gruposVisibles(auth.empleado.codigo_rol) : []))

const titulo = computed(() => {
  const vista = route.params.vista
  return route.name === 'reporte' && esVistaReporte(vista)
    ? REPORTES[vista].titulo
    : (route.meta.titulo ?? '')
})

watchEffect(() => {
  document.title = titulo.value ? `${titulo.value} · Carlitosco` : 'Carlitosco'
})

function abrirMenuMovil(): void {
  if (menuMovil.value) Offcanvas.getOrCreateInstance(menuMovil.value).show()
}

function cerrarMenuMovil(): void {
  if (menuMovil.value) Offcanvas.getInstance(menuMovil.value)?.hide()
}

/** CU-02: cierra la sesión y vuelve al login. */
async function cerrarSesion(): Promise<void> {
  if (await auth.logout()) await router.replace({ name: 'login' })
}
</script>

<template>
  <div v-if="mostrarLayout && auth.empleado" class="cc-shell vh-100">
    <AppSidebar class="d-none d-lg-flex" :grupos="grupos" :usuario="auth.empleado" />

    <!-- Debajo de lg el mismo sidebar se abre como offcanvas -->
    <div
      id="menu-movil"
      ref="menuMovil"
      class="offcanvas offcanvas-start cc-offcanvas-menu"
      tabindex="-1"
      aria-label="Menú de navegación"
    >
      <AppSidebar
        class="flex-grow-1"
        :grupos="grupos"
        :usuario="auth.empleado"
        :colapsable="false"
        @navegar="cerrarMenuMovil"
      />
    </div>

    <div class="cc-shell__main">
      <AppTopbar
        :titulo="titulo"
        :cerrando-sesion="auth.isLoading"
        @abrir-menu="abrirMenuMovil"
        @cerrar-sesion="cerrarSesion"
      />
      <div class="cc-shell__body">
        <main class="cc-shell__content">
          <RouterView />
        </main>
      </div>
    </div>
  </div>

  <RouterView v-else />
</template>
