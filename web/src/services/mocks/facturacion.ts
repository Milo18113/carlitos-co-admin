import type { RespuestaEscritura } from '@/types/api'
import type { FacturaNueva } from '@/types/factura'
import { hoyISO } from '@/utils/fecha'
import { calcularTotales } from '@/utils/factura'

import { CATALOGOS_BASE } from './datos/catalogos'
import { baseMock } from './estado'
import { dinero, exito, reglaDeNegocio } from './simulador'
import { exigirSesion } from './sesionMock'

/**
 * ⚠ PROPUESTA (CU-09). Simula lo que haría `POST /api/facturas`: no hay procedure, así que estos
 * mensajes y estas reglas son los que propone el front, no los de `procedures.sql`. Todo o nada:
 * si cualquier línea falla, no queda ni la cabecera.
 *
 * No toca el stock: `tDetalleFactura` no dice de qué bodega sale lo vendido, así que el modelo no
 * permite descontarlo. Es una pregunta abierta para el API.
 */

function siguienteNumeroDeFactura(): string {
  const secuenciales = baseMock.facturas.map((f) => Number(f.numero_factura.split('-')[2] ?? 0))
  const siguiente = Math.max(0, ...secuenciales) + 1
  return `001-001-${String(siguiente).padStart(9, '0')}`
}

export function emitirFactura(factura: FacturaNueva): RespuestaEscritura {
  const empleado = exigirSesion()

  if (!baseMock.clientes.some((c) => c.numero_identificacion === factura.numero_identificacion)) {
    reglaDeNegocio(`el cliente ${factura.numero_identificacion} no existe`)
  }
  if (factura.porcentaje_iva < 0 || factura.porcentaje_iva > 100) {
    reglaDeNegocio('el IVA debe estar entre 0 y 100')
  }
  if (
    factura.forma_pago !== null &&
    !CATALOGOS_BASE['formas-pago'].some((forma) => forma.codigo === factura.forma_pago)
  ) {
    reglaDeNegocio(`la forma de pago ${factura.forma_pago} no existe`)
  }
  if (factura.lineas.length === 0) reglaDeNegocio('la factura necesita al menos una linea')

  const vistos = new Set<string>()
  const lineasCalculables = factura.lineas.map((linea) => {
    const producto = baseMock.productos.find((p) => p.codigo_oe === linea.codigo_oe)
    if (!producto) reglaDeNegocio(`el repuesto ${linea.codigo_oe} no existe`)
    // La clave de tDetalleFactura es (repuesto, factura).
    if (vistos.has(linea.codigo_oe)) {
      reglaDeNegocio(`el repuesto ${linea.codigo_oe} esta repetido en la factura`)
    }
    vistos.add(linea.codigo_oe)
    if (!(linea.cantidad > 0)) {
      reglaDeNegocio(`la cantidad de ${linea.codigo_oe} debe ser mayor que 0`)
    }
    if (linea.porcentaje_descuento < 0 || linea.porcentaje_descuento > 100) {
      reglaDeNegocio(`el descuento de ${linea.codigo_oe} debe estar entre 0 y 100`)
    }
    return {
      precioUnitario: producto.precio_venta,
      cantidad: linea.cantidad,
      porcentajeDescuento: linea.porcentaje_descuento,
    }
  })

  const { total } = calcularTotales(lineasCalculables, factura.porcentaje_iva)
  const numero = siguienteNumeroDeFactura()

  baseMock.facturas.push({
    numero_factura: numero,
    fecha_emision: hoyISO(),
    estado: 'EMITIDA',
    tCliente_numero_identificacion: factura.numero_identificacion,
    tEmpleado_codigo_empleado: empleado.codigo_empleado,
    total,
    devolucion: 0,
  })

  // Venta al contado: un pago por el total, con la forma elegida.
  if (factura.forma_pago !== null) {
    baseMock.pagos.push({
      codigo_pago: `PAG-${numero.slice(-9)}`,
      fecha: hoyISO(),
      monto: total,
      referencia: null,
      tFactura_numero_factura: numero,
      tFormaPago_codigo_forma_pago: factura.forma_pago,
    })
  }

  return exito(
    `factura ${numero} emitida. Total: ${dinero(total)}` +
      (factura.forma_pago !== null ? '. Pagada al contado' : '. Queda con saldo por cobrar'),
  )
}
