import { ROL_ADMINISTRADOR } from '@/config/roles'
import type { GrupoNavegacion } from '@/types/navegacion'
import { REPORTES, VISTAS_REPORTE } from '@/types/reportes'
import type { VistaReporte } from '@/types/reportes'

const ICONOS_REPORTE: Record<VistaReporte, string> = {
  'repuestos-disponibles': 'box-seam',
  'cuentas-por-cobrar': 'cash-coin',
  empleados: 'person-lines-fill',
  bodegas: 'building',
  'desempeno-marca': 'graph-up',
}

/** Menú del sidebar, completo. `gruposVisibles` lo recorta según el rol. */
const GRUPOS_NAVEGACION: readonly GrupoNavegacion[] = [
  {
    items: [
      { etiqueta: 'Dashboard', icono: 'speedometer2', ruta: '/' },
      { etiqueta: 'Clientes', icono: 'people', ruta: '/clientes' },
      { etiqueta: 'Repuestos', icono: 'box-seam', ruta: '/repuestos' },
      { etiqueta: 'Nueva factura', icono: 'receipt', ruta: '/facturas/nueva' },
      { etiqueta: 'Pagos', icono: 'credit-card', ruta: '/pagos' },
      {
        etiqueta: 'Administrar empleados',
        icono: 'person-badge',
        ruta: '/administracion-empleados',
        rolRequerido: ROL_ADMINISTRADOR,
      },
    ],
  },
  {
    titulo: 'Reportes',
    items: VISTAS_REPORTE.map((vista) => ({
      etiqueta: REPORTES[vista].titulo,
      icono: ICONOS_REPORTE[vista],
      ruta: `/reportes/${vista}`,
    })),
  },
]

/** Quita los ítems que el rol no puede abrir, y los grupos que se quedan vacíos. */
export function gruposVisibles(codigoRol: number): GrupoNavegacion[] {
  return GRUPOS_NAVEGACION.map((grupo) => ({
    ...grupo,
    items: grupo.items.filter(
      (item) => item.rolRequerido === undefined || item.rolRequerido === codigoRol,
    ),
  })).filter((grupo) => grupo.items.length > 0)
}
