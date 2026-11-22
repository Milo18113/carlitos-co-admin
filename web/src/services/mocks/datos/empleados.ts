import { ROL_ADMINISTRADOR, ROL_VENDEDOR } from '@/config/roles'

import type { EmpleadoMock } from '../tiposMock'

/**
 * Usuarios de demostración del login mock:
 *   admin / admin123        (Administrador)
 *   vendedor / vendedor123  (Vendedor)
 * `jperez` está inactivo a propósito: el login con él tiene que dar 401.
 * El resto usa la contraseña 'demo1234'.
 */
export const EMPLEADOS_BASE: readonly EmpleadoMock[] = [
  {
    codigo_empleado: 'E001',
    cedula: '1712340011',
    nombres: 'Carlos',
    apellidos: 'Andrade',
    usuario: 'admin',
    contrasena: 'admin123',
    activo: 1,
    tRol_codigo_rol: ROL_ADMINISTRADOR,
  },
  {
    codigo_empleado: 'E002',
    cedula: '1712340029',
    nombres: 'María Fernanda',
    apellidos: 'Salazar',
    usuario: 'vendedor',
    contrasena: 'vendedor123',
    activo: 1,
    tRol_codigo_rol: ROL_VENDEDOR,
  },
  {
    codigo_empleado: 'E003',
    cedula: '1712340037',
    nombres: 'Jorge Luis',
    apellidos: 'Cevallos',
    usuario: 'jcevallos',
    contrasena: 'demo1234',
    activo: 1,
    tRol_codigo_rol: ROL_VENDEDOR,
  },
  {
    codigo_empleado: 'E004',
    cedula: '1712340045',
    nombres: 'Ana Lucía',
    apellidos: 'Proaño',
    usuario: 'aproano',
    contrasena: 'demo1234',
    activo: 1,
    tRol_codigo_rol: ROL_VENDEDOR,
  },
  {
    codigo_empleado: 'E005',
    cedula: '1712340052',
    nombres: 'Eduardo',
    apellidos: 'Vinueza',
    usuario: 'evinueza',
    contrasena: 'demo1234',
    activo: 1,
    tRol_codigo_rol: ROL_VENDEDOR,
  },
  {
    codigo_empleado: 'E006',
    cedula: '1712340060',
    nombres: 'Andrés',
    apellidos: 'Mena',
    usuario: 'amena',
    contrasena: 'demo1234',
    activo: 1,
    tRol_codigo_rol: ROL_ADMINISTRADOR,
  },
  {
    codigo_empleado: 'E007',
    cedula: '1712340078',
    nombres: 'Paola',
    apellidos: 'Guerrero',
    usuario: 'pguerrero',
    contrasena: 'demo1234',
    activo: 1,
    tRol_codigo_rol: ROL_VENDEDOR,
  },
  {
    codigo_empleado: 'E008',
    cedula: '1712340086',
    nombres: 'Javier',
    apellidos: 'Pérez',
    usuario: 'jperez',
    contrasena: 'demo1234',
    activo: 0,
    tRol_codigo_rol: ROL_VENDEDOR,
  },
  {
    codigo_empleado: 'E009',
    cedula: '1712340094',
    nombres: 'Sofía',
    apellidos: 'Lasso',
    usuario: 'slasso',
    contrasena: 'demo1234',
    activo: 1,
    tRol_codigo_rol: ROL_VENDEDOR,
  },
  {
    codigo_empleado: 'E010',
    cedula: '1712340102',
    nombres: 'Mauricio',
    apellidos: 'Tapia',
    usuario: 'mtapia',
    contrasena: 'demo1234',
    activo: 1,
    tRol_codigo_rol: ROL_VENDEDOR,
  },
]
