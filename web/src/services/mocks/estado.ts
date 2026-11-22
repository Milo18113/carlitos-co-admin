import type { Cliente } from '@/types/cliente'
import type { Pago } from '@/types/pago'
import type { Repuesto } from '@/types/repuesto'
import type { DesempenoMarca } from '@/types/reportes'

import { crearClientesBase } from './datos/clientes'
import { crearDesempenoMarcaBase } from './datos/desempenoMarca'
import { EMPLEADOS_BASE } from './datos/empleados'
import { crearFacturasYPagosBase } from './datos/facturas'
import { crearInventarioBase, crearProductosBase } from './datos/productos'
import type { EmpleadoMock, FacturaMock, InventarioMock } from './tiposMock'

/** La "base de datos" de los mocks: una lista por tabla. Los cambios viven solo en memoria. */
export interface BaseMock {
  empleados: EmpleadoMock[]
  clientes: Cliente[]
  productos: Repuesto[]
  inventario: InventarioMock[]
  facturas: FacturaMock[]
  pagos: Pago[]
  desempenoMarca: DesempenoMarca[]
}

function crearBase(): BaseMock {
  const { facturas, pagos } = crearFacturasYPagosBase()
  return {
    empleados: EMPLEADOS_BASE.map((empleado) => ({ ...empleado })),
    clientes: crearClientesBase(),
    productos: crearProductosBase(),
    inventario: crearInventarioBase(),
    facturas,
    pagos,
    desempenoMarca: crearDesempenoMarcaBase(),
  }
}

export const baseMock: BaseMock = crearBase()

/** Vuelve a las fixtures originales. Lo usan los tests; en la app basta con recargar la página. */
export function reiniciarBaseMock(): void {
  Object.assign(baseMock, crearBase())
}
