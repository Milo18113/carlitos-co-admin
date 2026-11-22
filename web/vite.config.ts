import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      // El API (Express) corre en :3000; con el proxy el front usa rutas relativas y no hay CORS.
      '/api': 'http://localhost:3000',
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Bootstrap 5.3 todavía usa @import: los warnings de Dart Sass son suyos, no del proyecto.
        // 'if-function' también lo dispara Bootstrap (ver design/system/system.scss).
        silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
        quietDeps: true,
      },
    },
  },
})
