import { NoAutorizadoError } from '@/services/errores'
import type { AuthService } from '@/services/contratos/authService'
import type { Sesion } from '@/types/empleado'

import { CATALOGOS_BASE } from './datos/catalogos'
import { baseMock } from './estado'
import { esperar } from './simulador'
import { exigirSesion, guardarSesionMock, limpiarSesionMock } from './sesionMock'

export const authMock: AuthService = {
  async iniciarSesion({ usuario, contrasena }) {
    await esperar()

    const empleado = baseMock.empleados.find((e) => e.usuario === usuario)
    // Mismo mensaje para usuario inexistente, inactivo o contraseña incorrecta: no revela cuál falló.
    if (!empleado || empleado.activo === 0 || empleado.contrasena !== contrasena) {
      throw new NoAutorizadoError('Usuario o contraseña incorrectos')
    }

    const sesion: Sesion = {
      codigo_empleado: empleado.codigo_empleado,
      nombres: empleado.nombres,
      apellidos: empleado.apellidos,
      usuario: empleado.usuario,
      codigo_rol: empleado.tRol_codigo_rol,
      rol: CATALOGOS_BASE.roles.find((r) => r.codigo === empleado.tRol_codigo_rol)?.nombre ?? '',
    }
    guardarSesionMock(sesion)
    return sesion
  },

  async cerrarSesion() {
    await esperar()
    limpiarSesionMock()
  },

  async obtenerSesion(signal) {
    await esperar(signal)
    return exigirSesion()
  },
}
