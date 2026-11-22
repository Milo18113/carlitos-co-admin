import type { Credenciales, Sesion } from '@/types/empleado'

export interface AuthService {
  /** `POST /api/auth/login`. 401 si el usuario no existe, está inactivo o la contraseña no coincide. */
  iniciarSesion(credenciales: Credenciales): Promise<Sesion>
  /** `POST /api/auth/logout`. */
  cerrarSesion(): Promise<void>
  /** `GET /api/auth/me`. 401 si no hay sesión. */
  obtenerSesion(signal?: AbortSignal): Promise<Sesion>
}
