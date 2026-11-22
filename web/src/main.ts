import './assets/styles/main.scss'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { alRecibirNoAutorizado } from './services/avisoNoAutorizado'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Un 401 en cualquier request (API real o mock) limpia la sesión y manda al login.
// Se conecta aquí, en el composition root, para que ni los services ni los stores importen el router.
const auth = useAuthStore(pinia)
alRecibirNoAutorizado(() => {
  // Antes de entrar, un 401 es lo esperado (login fallido o "no hay sesión"): no hay nada que expirar.
  if (!auth.empleado) return
  auth.expirarSesion()
  void router.replace({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
})

app.mount('#app')
