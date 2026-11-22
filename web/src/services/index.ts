/**
 * Único punto donde se decide si la app habla con el API real o con los mocks
 * (`VITE_USE_MOCKS`). Los stores importan de aquí y no saben cuál de los dos tienen.
 */
import { env } from '@/config/env'

import { authApi } from './api/authApi'
import { catalogosApi } from './api/catalogosApi'
import { clientesApi } from './api/clientesApi'
import { empleadosApi } from './api/empleadosApi'
import { pagosApi } from './api/pagosApi'
import { repuestosApi } from './api/repuestosApi'
import { reportesApi } from './api/reportesApi'
import type { AuthService } from './contratos/authService'
import type { CatalogosService } from './contratos/catalogosService'
import type { ClientesService } from './contratos/clientesService'
import type { EmpleadosService } from './contratos/empleadosService'
import type { PagosService } from './contratos/pagosService'
import type { ReportesService } from './contratos/reportesService'
import type { RepuestosService } from './contratos/repuestosService'
import { authMock } from './mocks/authMock'
import { catalogosMock } from './mocks/catalogosMock'
import { clientesMock } from './mocks/clientesMock'
import { empleadosMock } from './mocks/empleadosMock'
import { pagosMock } from './mocks/pagosMock'
import { reportesMock } from './mocks/reportesMock'
import { repuestosMock } from './mocks/repuestosMock'

export const authService: AuthService = env.usarMocks ? authMock : authApi
export const catalogosService: CatalogosService = env.usarMocks ? catalogosMock : catalogosApi
export const clientesService: ClientesService = env.usarMocks ? clientesMock : clientesApi
export const empleadosService: EmpleadosService = env.usarMocks ? empleadosMock : empleadosApi
export const pagosService: PagosService = env.usarMocks ? pagosMock : pagosApi
export const reportesService: ReportesService = env.usarMocks ? reportesMock : reportesApi
export const repuestosService: RepuestosService = env.usarMocks ? repuestosMock : repuestosApi

export { ErrorServidor, NoAutorizadoError, ReglaNegocioError } from './errores'
