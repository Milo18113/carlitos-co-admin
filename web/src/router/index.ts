import { createRouter, createWebHistory } from 'vue-router'
import type { RouterHistory } from 'vue-router'

import { ROL_ADMINISTRADOR } from '@/config/roles'
import { useAuthStore } from '@/stores/auth'
import { esVistaReporte } from '@/types/reportes'

declare module 'vue-router' {
  interface RouteMeta {
    /** Título del topbar. La ruta de reportes lo reemplaza con el del `:vista`. */
    titulo: string
    /** Se puede abrir sin sesión. */
    publica?: boolean
    /** Se muestra sin sidebar ni topbar (el login). */
    sinLayout?: boolean
    /** Si está, solo ese rol puede abrirla; los demás van al dashboard. */
    rolRequerido?: number
  }
}

/** Se crea con una fábrica para que los tests usen `createMemoryHistory()`. */
export function crearRouter(historial: RouterHistory) {
  const router = createRouter({
    history: historial,
    routes: [
      {
        path: '/login',
        name: 'login',
        component: () => import('@/views/LoginView.vue'),
        meta: { titulo: 'Iniciar sesión', publica: true, sinLayout: true },
      },
      {
        path: '/',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { titulo: 'Dashboard' },
      },
      {
        path: '/clientes',
        name: 'clientes',
        component: () => import('@/views/ClientesView.vue'),
        meta: { titulo: 'Clientes' },
      },
      {
        path: '/repuestos',
        name: 'repuestos',
        component: () => import('@/views/RepuestosView.vue'),
        meta: { titulo: 'Repuestos' },
      },
      {
        path: '/facturas/nueva',
        name: 'factura-nueva',
        component: () => import('@/views/FacturaNuevaView.vue'),
        meta: { titulo: 'Nueva factura' },
      },
      {
        path: '/pagos',
        name: 'pagos',
        component: () => import('@/views/PagosView.vue'),
        meta: { titulo: 'Pagos' },
      },
      {
        path: '/administracion-empleados',
        name: 'administracion-empleados',
        component: () => import('@/views/AdministracionEmpleadosView.vue'),
        meta: { titulo: 'Administrar empleados', rolRequerido: ROL_ADMINISTRADOR },
      },
      {
        // TEMPORAL (Pausa 4): se borra en el bloque G2. No está en el menú.
        path: '/componentes-prueba',
        name: 'componentes-prueba',
        component: () => import('@/views/ComponentesPruebaView.vue'),
        meta: { titulo: 'Componentes (temporal)' },
      },
      {
        path: '/reportes/:vista',
        name: 'reporte',
        component: () => import('@/views/ReporteView.vue'),
        meta: { titulo: 'Reportes' },
        // Un `:vista` que no es una de las 5 vistas es una ruta que no existe.
        beforeEnter: (to) =>
          esVistaReporte(to.params.vista)
            ? true
            : {
                name: 'no-encontrado',
                params: { pathMatch: to.path.slice(1).split('/') },
                query: to.query,
                hash: to.hash,
              },
      },
      {
        path: '/:pathMatch(.*)*',
        name: 'no-encontrado',
        component: () => import('@/views/NotFoundView.vue'),
        meta: { titulo: 'Página no encontrada', publica: true },
      },
    ],
  })

  router.beforeEach(async (to) => {
    const auth = useAuthStore()
    // Carga compartida: pregunta por la sesión una sola vez, aunque lleguen varias navegaciones.
    await auth.cargarSesion()

    if (!to.meta.publica && !auth.estaAutenticado) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }
    // Quien ya entró no tiene nada que hacer en el login.
    if (to.name === 'login' && auth.estaAutenticado) return { name: 'dashboard' }

    if (to.meta.rolRequerido !== undefined && auth.empleado?.codigo_rol !== to.meta.rolRequerido) {
      return { name: 'dashboard' }
    }
    return true
  })

  return router
}

export default crearRouter(createWebHistory(import.meta.env.BASE_URL))
