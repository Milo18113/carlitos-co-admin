import type {
  BodegaDisponible,
  CuentaPorCobrar,
  DesempenoMarca,
  EmpleadoResumen,
  RepuestoDisponible,
} from '@/types/reportes'

import { CATALOGOS_BASE, DIRECCIONES_BODEGA } from './datos/catalogos'
import { baseMock } from './estado'
import { redondear } from './simulador'
import type { FacturaMock } from './tiposMock'

/**
 * Las vistas de `database/views.sql` calculadas sobre `baseMock`. Así un pago, un traslado
 * o un empleado nuevo se reflejan en los reportes igual que en la base real.
 */

export function pagadoDe(numeroFactura: string): number {
  return redondear(
    baseMock.pagos
      .filter((pago) => pago.tFactura_numero_factura === numeroFactura)
      .reduce((suma, pago) => suma + pago.monto, 0),
  )
}

/** Saldo = total − pagado − devolución, igual que `registrar_pago` y la vista `Cuentas_por_cobrar`. */
export function saldoDeFactura(factura: FacturaMock): number {
  return redondear(factura.total - pagadoDe(factura.numero_factura) - factura.devolucion)
}

export function repuestosDisponibles(): RepuestoDisponible[] {
  return baseMock.inventario
    .filter((fila) => fila.cantidad > 0)
    .map((fila) => {
      const producto = baseMock.productos.find((p) => p.codigo_oe === fila.tProducto_codigo_oe)
      const marca = CATALOGOS_BASE.marcas.find((m) => m.codigo === producto?.tMarca_codigo_marca)
      return {
        Bodega: fila.tBodega_codigo_bodega,
        Codigo_oe: fila.tProducto_codigo_oe,
        cantidad: fila.cantidad,
        ubicacion: fila.ubicacion,
        descripcion: producto?.descripcion ?? '',
        Marca: marca?.nombre ?? '',
      }
    })
}

export function cuentasPorCobrar(): CuentaPorCobrar[] {
  const filas: CuentaPorCobrar[] = []
  for (const factura of baseMock.facturas) {
    const saldo = saldoDeFactura(factura)
    // La vista filtra con HAVING Saldo >= 0.01.
    if (saldo < 0.01) continue
    const cliente = baseMock.clientes.find(
      (c) => c.numero_identificacion === factura.tCliente_numero_identificacion,
    )
    filas.push({
      Nombre_Cliente: cliente?.razon_social ?? '',
      seriefactura: factura.numero_factura,
      fechafactura: factura.fecha_emision,
      Total: factura.total,
      Saldo: saldo,
      pagado: pagadoDe(factura.numero_factura),
      devolucion: factura.devolucion,
    })
  }
  return filas
}

export function empleadosResumen(): EmpleadoResumen[] {
  return baseMock.empleados.map((empleado) => ({
    cedula: empleado.cedula,
    nombres: empleado.nombres,
    apellidos: empleado.apellidos,
    activo: empleado.activo,
    Rol: CATALOGOS_BASE.roles.find((r) => r.codigo === empleado.tRol_codigo_rol)?.nombre ?? '',
    Facturas_emitidas: baseMock.facturas.filter(
      (f) => f.tEmpleado_codigo_empleado === empleado.codigo_empleado,
    ).length,
  }))
}

export function bodegasDisponibles(): BodegaDisponible[] {
  return CATALOGOS_BASE.bodegas.map((bodega) => {
    // LEFT JOIN con `I.cantidad > 0`: una bodega vacía sigue apareciendo, con ceros.
    const filas = baseMock.inventario.filter(
      (fila) => fila.tBodega_codigo_bodega === bodega.codigo && fila.cantidad > 0,
    )
    const valor = filas.reduce((suma, fila) => {
      const precio =
        baseMock.productos.find((p) => p.codigo_oe === fila.tProducto_codigo_oe)?.precio_venta ?? 0
      return suma + precio * fila.cantidad
    }, 0)
    return {
      codigo_bodega: bodega.codigo,
      nombre: bodega.nombre,
      direccion: DIRECCIONES_BODEGA[bodega.codigo] ?? '',
      Cantidad: filas.reduce((suma, fila) => suma + fila.cantidad, 0),
      Productos_Bodega: new Set(filas.map((fila) => fila.tProducto_codigo_oe)).size,
      Valor_Bodega: redondear(valor),
    }
  })
}

export function desempenoMarca(): DesempenoMarca[] {
  return baseMock.desempenoMarca.map((fila) => ({ ...fila }))
}
