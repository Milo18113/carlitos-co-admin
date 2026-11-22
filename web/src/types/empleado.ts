/** Body de `POST /api/auth/login`. */
export interface Credenciales {
  usuario: string
  contrasena: string
}

/** Respuesta de `POST /api/auth/login` y `GET /api/auth/me`. Nunca incluye el hash. */
export interface Sesion {
  codigo_empleado: string
  nombres: string
  apellidos: string
  usuario: string
  codigo_rol: number
  rol: string
}

/**
 * Body de `POST /api/empleados` → `contratar_empleado`.
 * `contrasena` viaja en texto plano: el hash (bcrypt, 60 caracteres) lo genera el API.
 */
export interface EmpleadoNuevo {
  codigo_empleado: string
  cedula: string
  nombres: string
  apellidos: string
  codigo_rol: number
  usuario: string
  contrasena: string
}
