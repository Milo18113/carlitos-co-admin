import type { AuthService } from '@/services/contratos/authService'
import { enviar, obtener } from '@/services/http'
import type { Sesion } from '@/types/empleado'

export const authApi: AuthService = {
  iniciarSesion: (credenciales) => enviar<Sesion>('/auth/login', credenciales),
  cerrarSesion: async () => {
    await enviar('/auth/logout', {})
  },
  obtenerSesion: (signal) => obtener<Sesion>('/auth/me', { signal }),
}
