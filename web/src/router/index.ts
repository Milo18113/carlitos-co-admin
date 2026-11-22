import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // TEMPORAL (Pausa 1): se borra en el cierre, bloque G2.
      path: '/',
      name: 'prueba-estilos',
      component: () => import('../views/PruebaEstilosView.vue'),
    },
  ],
})

export default router
