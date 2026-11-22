<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'

import AppIcon from '@/components/common/AppIcon.vue'
import type { Sesion } from '@/types/empleado'
import type { GrupoNavegacion } from '@/types/navegacion'

const props = withDefaults(
  defineProps<{
    /** Grupos del menú, ya filtrados por el rol del usuario. */
    grupos: GrupoNavegacion[]
    /** Empleado con sesión; se muestra al fondo del menú. */
    usuario: Sesion
    /** El sidebar de escritorio se puede colapsar a solo íconos; el del offcanvas móvil no. */
    colapsable?: boolean
  }>(),
  { colapsable: true },
)

const emit = defineEmits<{
  /** Se hizo clic en un ítem: el offcanvas móvil se cierra al navegar. */
  navegar: []
}>()

const colapsado = ref(false)

const iniciales = computed(() =>
  `${props.usuario.nombres.charAt(0)}${props.usuario.apellidos.charAt(0)}`.toUpperCase(),
)
</script>

<template>
  <aside :class="['cc-sidebar', { 'is-collapsed': colapsado }]" aria-label="Navegación principal">
    <div class="cc-brand">
      <div class="cc-brand__mark" role="img" aria-label="Logo Carlitosco"></div>
      <div class="cc-hide-collapsed">
        <div class="cc-brand__name">Carlitosco</div>
        <div class="cc-brand__sub">Panel de administración</div>
      </div>
      <button
        v-if="colapsable"
        type="button"
        class="btn btn-neutral btn-icon btn-sm cc-sidebar__toggle cc-hide-collapsed"
        aria-label="Colapsar menú"
        :aria-expanded="!colapsado"
        @click="colapsado = true"
      >
        <AppIcon nombre="layout-sidebar" />
      </button>
    </div>
    <!-- Con el menú colapsado el logo ocupa todo el ancho: el botón para volver a abrirlo va debajo -->
    <button
      v-if="colapsable && colapsado"
      type="button"
      class="btn btn-neutral btn-icon btn-sm align-self-center"
      aria-label="Expandir menú"
      :aria-expanded="!colapsado"
      @click="colapsado = false"
    >
      <AppIcon nombre="layout-sidebar-inset" />
    </button>

    <!-- Varios grupos pueden no tener título: la posición es lo único que los distingue -->
    <template v-for="(grupo, indice) in grupos" :key="`grupo-${indice}`">
      <div class="cc-sidebar__divider"></div>
      <div v-if="grupo.titulo" class="cc-nav-label cc-hide-collapsed">
        <span>{{ grupo.titulo }}</span>
      </div>
      <RouterLink
        v-for="item in grupo.items"
        :key="item.ruta"
        :to="item.ruta"
        class="cc-nav-item"
        exact-active-class="active"
        :title="item.etiqueta"
        @click="emit('navegar')"
      >
        <AppIcon :nombre="item.icono" />
        <!-- text-truncate: una etiqueta larga se corta con "…" en vez de salirse del botón de 40px -->
        <span class="cc-hide-collapsed text-truncate">{{ item.etiqueta }}</span>
      </RouterLink>
    </template>

    <div class="cc-sidebar__spacer"></div>
    <div class="cc-sidebar__divider"></div>
    <div class="cc-user">
      <div class="cc-user__avatar" aria-hidden="true">{{ iniciales }}</div>
      <div class="cc-hide-collapsed">
        <div class="cc-user__name">{{ usuario.nombres }} {{ usuario.apellidos }}</div>
        <div class="cc-user__mail">{{ usuario.rol }}</div>
      </div>
    </div>
  </aside>
</template>
