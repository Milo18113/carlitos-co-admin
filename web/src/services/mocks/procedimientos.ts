import type { RespuestaEscritura } from '@/types/api'
import { TIPO_IDENTIFICACION } from '@/types/cliente'
import type { ClienteNuevo } from '@/types/cliente'
import type { EmpleadoNuevo } from '@/types/empleado'
import type { PagoNuevo } from '@/types/pago'
import type { RepuestoNuevo, TrasladoNuevo } from '@/types/repuesto'
import { hoyISO } from '@/utils/fecha'

import { CATALOGOS_BASE } from './datos/catalogos'
import { baseMock } from './estado'
import { dinero, exito, reglaDeNegocio } from './simulador'
import { saldoDeFactura } from './vistas'

/**
 * Cada función replica un procedure de `database/procedures.sql`: mismas validaciones, en el
 * mismo orden, y el mismo texto de mensaje (sin el prefijo `COMMIT: ` / `ROLLBACK: `, que el
 * API quita antes de responder). Si cambia un procedure, cambia aquí.
 */

const CONSUMIDOR_FINAL_ID = '9999999999999'

function existeEn(catalogo: { codigo: string | number }[], codigo: string | number): boolean {
  return catalogo.some((item) => item.codigo === codigo)
}

// -----------------------------------------------------
// registrar_pago
// -----------------------------------------------------
export function registrarPago(pago: PagoNuevo): RespuestaEscritura {
  const factura = baseMock.facturas.find((f) => f.numero_factura === pago.numero_factura)
  if (!factura) reglaDeNegocio(`la factura ${pago.numero_factura} no existe`)

  if (!(pago.monto > 0)) reglaDeNegocio('el monto debe ser mayor que 0')

  if (!existeEn(CATALOGOS_BASE['formas-pago'], pago.forma_pago)) {
    reglaDeNegocio(`la forma de pago ${pago.forma_pago} no existe`)
  }

  const saldo = saldoDeFactura(factura)
  if (pago.monto > saldo) {
    reglaDeNegocio(`el pago de ${dinero(pago.monto)} supera el saldo pendiente de ${dinero(saldo)}`)
  }

  // En SQL esto lo atrapa el handler de SQLEXCEPTION al violar la PK de tPago.
  if (baseMock.pagos.some((p) => p.codigo_pago === pago.codigo_pago)) {
    reglaDeNegocio('error de SQL, no se registro el pago (codigo de pago repetido o dato invalido)')
  }

  baseMock.pagos.push({
    codigo_pago: pago.codigo_pago,
    fecha: hoyISO(),
    monto: pago.monto,
    referencia: pago.referencia,
    tFactura_numero_factura: pago.numero_factura,
    tFormaPago_codigo_forma_pago: pago.forma_pago,
  })

  return exito(
    `pago ${pago.codigo_pago} de ${dinero(pago.monto)} registrado. ` +
      `Saldo pendiente: ${dinero(saldo - pago.monto)}`,
  )
}

// -----------------------------------------------------
// eliminar_pago
// -----------------------------------------------------
export function eliminarPago(codigoPago: string): RespuestaEscritura {
  const indice = baseMock.pagos.findIndex((p) => p.codigo_pago === codigoPago)
  const pago = baseMock.pagos[indice]
  if (!pago) reglaDeNegocio(`el pago ${codigoPago} no existe`)

  if (pago.fecha !== hoyISO()) {
    reglaDeNegocio(
      `el pago ${codigoPago} es del ${pago.fecha}; solo se eliminan pagos registrados hoy`,
    )
  }

  baseMock.pagos.splice(indice, 1)

  return exito(
    `se elimino el pago ${codigoPago} de ${dinero(pago.monto)}; ` +
      `la factura ${pago.tFactura_numero_factura} vuelve a deber ese monto`,
  )
}

// -----------------------------------------------------
// ingresar_repuesto
// -----------------------------------------------------
export function ingresarRepuesto(repuesto: RepuestoNuevo): RespuestaEscritura {
  if (!(repuesto.cantidad > 0)) reglaDeNegocio('la cantidad a ingresar debe ser mayor que 0')

  if (!existeEn(CATALOGOS_BASE.bodegas, repuesto.codigo_bodega)) {
    reglaDeNegocio(`la bodega ${repuesto.codigo_bodega} no existe`)
  }

  let esNuevo = false
  if (!baseMock.productos.some((p) => p.codigo_oe === repuesto.codigo_oe)) {
    if (
      !existeEn(CATALOGOS_BASE.marcas, repuesto.codigo_marca) ||
      !existeEn(CATALOGOS_BASE.categorias, repuesto.codigo_categoria)
    ) {
      reglaDeNegocio('la marca o la categoria no existe')
    }

    if (
      !(repuesto.precio_venta > 0) ||
      repuesto.descripcion.trim() === '' ||
      repuesto.stock_minimo < 0
    ) {
      reglaDeNegocio(
        'un repuesto nuevo necesita descripcion, precio mayor que 0 y stock minimo no negativo',
      )
    }

    baseMock.productos.push({
      codigo_oe: repuesto.codigo_oe,
      descripcion: repuesto.descripcion,
      precio_venta: repuesto.precio_venta,
      stock_minimo: repuesto.stock_minimo,
      tCategoria_codigo_categoria: repuesto.codigo_categoria,
      tMarca_codigo_marca: repuesto.codigo_marca,
    })
    esNuevo = true
  }

  let fila = baseMock.inventario.find(
    (i) =>
      i.tBodega_codigo_bodega === repuesto.codigo_bodega &&
      i.tProducto_codigo_oe === repuesto.codigo_oe,
  )
  if (fila) {
    fila.cantidad += repuesto.cantidad
    // COALESCE(p_ubicacion, ubicacion): una ubicación nueva reemplaza, `null` conserva la anterior.
    fila.ubicacion = repuesto.ubicacion ?? fila.ubicacion
  } else {
    fila = {
      tBodega_codigo_bodega: repuesto.codigo_bodega,
      tProducto_codigo_oe: repuesto.codigo_oe,
      cantidad: repuesto.cantidad,
      ubicacion: repuesto.ubicacion,
    }
    baseMock.inventario.push(fila)
  }

  const situacion = esNuevo
    ? 'repuesto nuevo creado. '
    : 'el repuesto ya existia (solo se sumo stock). '
  return exito(
    `${situacion}Stock de ${repuesto.codigo_oe} en ${repuesto.codigo_bodega}: ${fila.cantidad}`,
  )
}

// -----------------------------------------------------
// trasladar_repuesto
// -----------------------------------------------------
export function trasladarRepuesto(traslado: TrasladoNuevo): RespuestaEscritura {
  const { codigo_oe, bodega_origen, bodega_destino, cantidad, ubicacion_destino } = traslado

  if (!(cantidad > 0)) reglaDeNegocio('la cantidad a trasladar debe ser mayor que 0')

  if (bodega_origen === bodega_destino) {
    reglaDeNegocio('la bodega de origen y la de destino son la misma')
  }

  if (!existeEn(CATALOGOS_BASE.bodegas, bodega_destino)) {
    reglaDeNegocio(`la bodega ${bodega_destino} no existe`)
  }

  const indiceOrigen = baseMock.inventario.findIndex(
    (i) => i.tBodega_codigo_bodega === bodega_origen && i.tProducto_codigo_oe === codigo_oe,
  )
  const origen = baseMock.inventario[indiceOrigen]
  if (!origen) reglaDeNegocio(`la bodega ${bodega_origen} no tiene el repuesto ${codigo_oe}`)

  if (origen.cantidad < cantidad) {
    reglaDeNegocio(
      `la bodega ${bodega_origen} solo tiene ${origen.cantidad} unidad(es) de ${codigo_oe}`,
    )
  }

  const stockOrigen = origen.cantidad
  if (stockOrigen === cantidad) {
    // Sin stock no se deja la fila en cero: se elimina, igual que el procedure.
    baseMock.inventario.splice(indiceOrigen, 1)
  } else {
    origen.cantidad -= cantidad
  }

  let destino = baseMock.inventario.find(
    (i) => i.tBodega_codigo_bodega === bodega_destino && i.tProducto_codigo_oe === codigo_oe,
  )
  if (destino) {
    destino.cantidad += cantidad
    destino.ubicacion = ubicacion_destino ?? destino.ubicacion
  } else {
    destino = {
      tBodega_codigo_bodega: bodega_destino,
      tProducto_codigo_oe: codigo_oe,
      cantidad,
      ubicacion: ubicacion_destino,
    }
    baseMock.inventario.push(destino)
  }

  const filaEliminada = stockOrigen === cantidad ? ' (fila eliminada)' : ''
  return exito(
    `${cantidad} unidad(es) de ${codigo_oe} de ${bodega_origen} a ${bodega_destino}. ` +
      `Quedan ${stockOrigen - cantidad} en ${bodega_origen}${filaEliminada} ` +
      `y ${destino.cantidad} en ${bodega_destino}`,
  )
}

// -----------------------------------------------------
// registrar_cliente
// -----------------------------------------------------
export function registrarCliente(cliente: ClienteNuevo): RespuestaEscritura {
  const { RUC, CEDULA, CONSUMIDOR_FINAL } = TIPO_IDENTIFICACION

  if (cliente.numero_identificacion === CONSUMIDOR_FINAL_ID) {
    reglaDeNegocio('el consumidor final ya existe y no se modifica')
  }

  if (cliente.codigo_tipo === CONSUMIDOR_FINAL) {
    reglaDeNegocio('solo existe un consumidor final (9999999999999); no se crean otros')
  }

  if (!existeEn(CATALOGOS_BASE['tipos-identificacion'], cliente.codigo_tipo)) {
    reglaDeNegocio(`el tipo de identificacion ${cliente.codigo_tipo} no existe`)
  }

  if (
    (cliente.codigo_tipo === RUC && !/^[0-9]{13}$/.test(cliente.numero_identificacion)) ||
    (cliente.codigo_tipo === CEDULA && !/^[0-9]{10}$/.test(cliente.numero_identificacion))
  ) {
    reglaDeNegocio('un RUC tiene 13 digitos y una cedula 10')
  }

  if (cliente.codigo_ciudad !== null && !existeEn(CATALOGOS_BASE.ciudades, cliente.codigo_ciudad)) {
    reglaDeNegocio(`la ciudad ${cliente.codigo_ciudad} no existe`)
  }

  // Equivale al LIKE '%_@_%._%' del procedure.
  if (cliente.email !== null && !/^.+@.+\..+$/.test(cliente.email)) {
    reglaDeNegocio(`el email ${cliente.email} no es valido`)
  }

  const razonSocial = cliente.razon_social.toUpperCase()
  const existente = baseMock.clientes.find(
    (c) => c.numero_identificacion === cliente.numero_identificacion,
  )

  if (!existente) {
    baseMock.clientes.push({
      numero_identificacion: cliente.numero_identificacion,
      razon_social: razonSocial,
      telefono: cliente.telefono,
      email: cliente.email,
      direccion: cliente.direccion,
      fecha_registro: hoyISO(),
      fecha_modificacion: null,
      tTipoIdentificacion_codigo_tipo_identificacion: cliente.codigo_tipo,
      tCiudad_codigo_ciudad: cliente.codigo_ciudad,
    })
    return exito(`cliente ${razonSocial} registrado`)
  }

  // COALESCE(p_x, x): un campo en `null` conserva el valor que ya tenía.
  existente.razon_social = razonSocial
  existente.telefono = cliente.telefono ?? existente.telefono
  existente.email = cliente.email ?? existente.email
  existente.direccion = cliente.direccion ?? existente.direccion
  existente.tCiudad_codigo_ciudad = cliente.codigo_ciudad ?? existente.tCiudad_codigo_ciudad
  existente.fecha_modificacion = hoyISO()
  return exito(`el cliente ${cliente.numero_identificacion} ya existia, se actualizaron sus datos`)
}

// -----------------------------------------------------
// contratar_empleado
// -----------------------------------------------------
export function contratarEmpleado(empleado: EmpleadoNuevo): RespuestaEscritura {
  if (!/^[0-9]{10}$/.test(empleado.cedula)) {
    reglaDeNegocio('la cedula debe tener exactamente 10 digitos')
  }

  if (
    empleado.nombres.trim() === '' ||
    empleado.apellidos.trim() === '' ||
    empleado.usuario.trim() === ''
  ) {
    reglaDeNegocio('nombres, apellidos y usuario son obligatorios')
  }

  // No viene de SQL: en el API real lo valida zod antes de hashear. Se deja para que el
  // formulario pruebe este camino.
  if (empleado.contrasena === '') reglaDeNegocio('la contrasena es obligatoria')

  if (!existeEn(CATALOGOS_BASE.roles, empleado.codigo_rol)) {
    reglaDeNegocio(`el rol ${empleado.codigo_rol} no existe`)
  }

  const existente = baseMock.empleados.find((e) => e.cedula === empleado.cedula)

  if (
    baseMock.empleados.some(
      (e) =>
        e.usuario === empleado.usuario &&
        (existente === undefined || e.codigo_empleado !== existente.codigo_empleado),
    )
  ) {
    reglaDeNegocio(`el usuario ${empleado.usuario} ya lo usa otro empleado`)
  }

  if (!existente) {
    // En SQL esto lo atrapa el handler de SQLEXCEPTION al violar la PK de tEmpleado.
    if (baseMock.empleados.some((e) => e.codigo_empleado === empleado.codigo_empleado)) {
      reglaDeNegocio('error de SQL, no se contrato al empleado (codigo repetido o dato invalido)')
    }
    baseMock.empleados.push({
      codigo_empleado: empleado.codigo_empleado,
      cedula: empleado.cedula,
      nombres: empleado.nombres,
      apellidos: empleado.apellidos,
      usuario: empleado.usuario,
      contrasena: empleado.contrasena,
      activo: 1,
      tRol_codigo_rol: empleado.codigo_rol,
    })
    return exito(
      `${empleado.nombres} ${empleado.apellidos} contratado con el codigo ${empleado.codigo_empleado}`,
    )
  }

  if (existente.activo === 1) {
    reglaDeNegocio(
      `la cedula ${empleado.cedula} ya pertenece a un empleado activo (${existente.codigo_empleado})`,
    )
  }

  // Cédula de un empleado dado de baja: se recontrata y conserva su código.
  existente.activo = 1
  existente.nombres = empleado.nombres
  existente.apellidos = empleado.apellidos
  existente.usuario = empleado.usuario
  existente.contrasena = empleado.contrasena
  existente.tRol_codigo_rol = empleado.codigo_rol
  return exito(
    `${empleado.nombres} ${empleado.apellidos} recontratado, conserva el codigo ${existente.codigo_empleado}`,
  )
}
