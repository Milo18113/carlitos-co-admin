# Contrato del API que espera el front

22 nov 2026 · Para quien implementa `api/` (Andrés).

Esto es lo que el API tiene que cumplir para que el front funcione **sin cambios** al poner `VITE_USE_MOCKS=false`. Sale de `web/src/types/` y `web/src/services/`; los mocks (`web/src/services/mocks/`) ya se comportan así, así que sirven de ejemplo ejecutable. Si algo de aquí cambia, se cambia primero en `web/src/types/`.

## Reglas generales

| Tema | Regla |
| --- | --- |
| Base | Todas las rutas cuelgan de `/api` (en desarrollo, el proxy de Vite las manda a `localhost:3000`) |
| Formato | JSON en el request (`Content-Type: application/json`) y en la respuesta |
| Sesión | Cookie de `express-session`. El front manda `credentials: 'include'`. Todo menos `POST /api/auth/login` exige sesión |
| `200` | Éxito. En una escritura el cuerpo es `{ "mensaje": "..." }` |
| `401` | Sin sesión, sesión vencida o credenciales incorrectas. Cuerpo `{ "mensaje": "..." }`. **El front cierra la sesión y manda al login ante cualquier 401** si había una sesión activa |
| `422` | Regla de negocio. Cuerpo `{ "mensaje": "..." }` con el texto del procedure **sin** el prefijo `COMMIT: ` ni `ROLLBACK: `. El front lo muestra tal cual en un toast |
| `500` y cualquier otro error | El front ignora el texto y muestra un mensaje genérico: no hace falta cuidar el mensaje, pero **no filtren detalles de la base**. El detalle va al log del API. Un `403` no está contemplado: se trata como error del servidor |
| Nombres de campo | Exactamente los de SQL: los alias de las vistas y las columnas de las tablas, sin renombrar ni pasar a camelCase |
| Montos y conteos | `number` en el JSON. `mysql2` devuelve `DECIMAL` como string por defecto: crear el pool con `decimalNumbers: true`. Ojo con `Bodegas_Disponibles.Cantidad`, que es un `SUM` de enteros y también sale como `DECIMAL` |
| Fechas | `'YYYY-MM-DD'` como string |
| `activo` | `0` o `1` (número) |
| Opcionales | El front manda `null`, nunca omite el campo ni manda `undefined`. El API tiene que aceptar `null` en cada opcional |
| Contraseña | Llega en **texto plano** en `POST /auth/login` y `POST /empleados`. El API la hashea con `bcryptjs` (60 caracteres) y **nunca** devuelve `hash_contrasena` |

## Endpoints

### Sesión

| Ruta | Body | Respuesta `200` | Errores |
| --- | --- | --- | --- |
| `POST /api/auth/login` | `{ usuario, contrasena }` | `Sesion` | `401` si el usuario no existe, está inactivo (`activo = 0`) o la contraseña no coincide. Conviene el mismo mensaje en los tres casos |
| `POST /api/auth/logout` | `{}` | Cualquier JSON (el front lo ignora) | — |
| `GET /api/auth/me` | — | `Sesion` | `401` si no hay sesión |

`Sesion` = `{ codigo_empleado, nombres, apellidos, usuario, codigo_rol, rol }`. `codigo_rol` es número.

### Reportes (solo lectura)

`GET /api/reportes/:vista` devuelve un arreglo con una fila por registro de la vista, con estos campos:

| `:vista` | Vista SQL | Campos de cada fila |
| --- | --- | --- |
| `repuestos-disponibles` | `repuestos_disponibles` | `Bodega`, `Codigo_oe`, `cantidad`, `ubicacion` (puede ser `null`), `descripcion`, `Marca` |
| `cuentas-por-cobrar` | `Cuentas_por_cobrar` | `Nombre_Cliente`, `seriefactura`, `fechafactura`, `Total`, `Saldo`, `pagado`, `devolucion` |
| `empleados` | `Empleados` | `cedula`, `nombres`, `apellidos`, `activo`, `Rol`, `Facturas_emitidas` |
| `bodegas` | `Bodegas_Disponibles` | `codigo_bodega`, `nombre`, `direccion`, `Cantidad`, `Productos_Bodega`, `Valor_Bodega` |
| `desempeno-marca` | `Desempeno_marca` | `Marca_codigo`, `Nombre_Marca`, `Categoria`, `Venta_Marca` |

Cualquier otro `:vista` es `404` (el front solo pide estos cinco).

### Catálogos (para los `<select>`)

`GET /api/catalogos/:nombre` devuelve `[{ codigo, nombre }]`. Lista blanca de nombres, sin armar SQL con el parámetro:

| `:nombre` | Tabla | `codigo` | `nombre` |
| --- | --- | --- | --- |
| `marcas` | `tMarca` | `codigo_marca` | `nombre` |
| `categorias` | `tCategoria` | `codigo_categoria` | `nombre` |
| `bodegas` | `tBodega` | `codigo_bodega` | `nombre` |
| `ciudades` | `tCiudad` | `codigo_ciudad` | `nombre` |
| `tipos-identificacion` | `tTipoIdentificacion` | `codigo_tipo_identificacion` | `descripcion` |
| `formas-pago` | `tFormaPago` | `codigo_forma_pago` | `descripcion` |
| `roles` | `tRol` | `codigo_rol` (**número**) | `nombre` |

### Listados de tablas

| Ruta | Respuesta `200` |
| --- | --- |
| `GET /api/clientes` | Filas de `tCliente`: `numero_identificacion`, `razon_social`, `telefono`, `email`, `direccion`, `fecha_registro`, `fecha_modificacion`, `tTipoIdentificacion_codigo_tipo_identificacion`, `tCiudad_codigo_ciudad` |
| `GET /api/repuestos` | Filas de `tProducto`: `codigo_oe`, `descripcion`, `precio_venta`, `stock_minimo`, `tCategoria_codigo_categoria`, `tMarca_codigo_marca` |
| `GET /api/pagos` | Filas de `tPago`: `codigo_pago`, `fecha`, `monto`, `referencia`, `tFactura_numero_factura`, `tFormaPago_codigo_forma_pago`. Acepta `?factura=` para filtrar; hoy el front no lo manda |

Las columnas largas (como `tTipoIdentificacion_codigo_tipo_identificacion`) se dejan tal cual: el front las tiene escritas así.

### Escrituras

Todas responden `200 { mensaje }` si el procedure termina en `COMMIT:` y `422 { mensaje }` si termina en `ROLLBACK:`.

| Ruta | Procedure | Body |
| --- | --- | --- |
| `POST /api/clientes` | `registrar_cliente` | `numero_identificacion`, `codigo_tipo`, `razon_social`, `telefono`, `email`, `direccion`, `codigo_ciudad` (los 4 últimos pueden ser `null`) |
| `POST /api/repuestos` | `ingresar_repuesto` | `codigo_oe`, `descripcion`, `precio_venta`, `stock_minimo`, `codigo_marca`, `codigo_categoria`, `codigo_bodega`, `cantidad`, `ubicacion` (puede ser `null`) |
| `POST /api/repuestos/traslados` | `trasladar_repuesto` | `codigo_oe`, `bodega_origen`, `bodega_destino`, `cantidad`, `ubicacion_destino` (puede ser `null`) |
| `POST /api/pagos` | `registrar_pago` | `codigo_pago`, `numero_factura`, `monto`, `forma_pago`, `referencia` (puede ser `null`) |
| `DELETE /api/pagos/:codigo` | `eliminar_pago` | — |
| `POST /api/empleados` | `contratar_empleado` | `codigo_empleado`, `cedula`, `nombres`, `apellidos`, `codigo_rol` (número), `usuario`, `contrasena` (texto plano: el API genera el hash) |

Detalles que el front da por hechos:

- `registrar_cliente` crea el cliente o, si ya existe, actualiza sus datos: el front usa el mismo endpoint para "Nuevo cliente" y para editar.
- `ingresar_repuesto` con un `codigo_oe` que ya existe solo suma stock. El front manda en ese caso los datos actuales del repuesto.
- `contratar_empleado` con la cédula de un empleado inactivo lo recontrata y conserva su código. Solo el administrador (`codigo_rol` 1, por confirmar) debería poder llamarlo; el front ya le oculta la pantalla al vendedor.
- Después de **cada** escritura exitosa, el front vuelve a pedir lo que cambió. Las vistas se calculan en la base, así que no hace falta que el API avise nada más.

## ⚠ Propuestas y pendientes

### `POST /api/facturas` (CU-09)

No hay procedure. El front ya está hecho con este body propuesto (`web/src/types/factura.ts`); sea con un procedure nuevo o con una transacción desde el API, el body no cambia.

```json
{
  "numero_identificacion": "1790012345001",
  "porcentaje_iva": 15,
  "forma_pago": null,
  "lineas": [{ "codigo_oe": "G7345", "cantidad": 2, "porcentaje_descuento": 10 }]
}
```

Lo que **no** manda el front, porque lo decide el servidor: el número de factura (el siguiente de la serie, devuelto en el `mensaje`), `fecha_emision`, `estado` (`'EMITIDA'`), el empleado (el de la sesión) y el `precio_unitario` de cada línea (el `precio_venta` del repuesto en ese momento). Debe ser todo o nada: si una línea falla, no queda ni la cabecera. Un repuesto no puede repetirse en la misma factura (la clave de `tDetalleFactura` es repuesto + factura).

Las 4 decisiones por cerrar están en *Decisiones pendientes* de [planificacion.md](planificacion.md): forma de pago de la factura, número de factura, IVA y stock.

### Otros

- **CU-13, dar de baja a un empleado:** no hay endpoint. En el front es un botón deshabilitado con el tooltip "Pendiente". **Decisión: los empleados nunca se borran, solo se desactivan.** La baja es un `UPDATE tEmpleado SET activo = 0` (ruta propuesta: `PATCH /api/empleados/:codigo/baja`) y nunca un `DELETE`, porque `tFactura` y `tCompra` apuntan al empleado con una FK obligatoria: borrarlo falla, o pierde el historial de quién emitió cada factura. El empleado inactivo sigue en el reporte `empleados` (columna `activo`), no puede iniciar sesión, y `contratar_empleado` lo reactiva con su misma cédula conservando su código.
- **Códigos que el front da por supuestos** y hay que confirmar contra los datos reales:
  - Tipos de identificación `04` (RUC, 13 dígitos), `05` (cédula, 10 dígitos) y `07` (consumidor final, `9999999999999`).
  - Roles `1` (Administrador) y `2` (Vendedor), en `web/src/config/roles.ts`.
  - Los mocks usan las formas de pago `01`, `16`, `19` y `20`, pero el front no las tiene escritas: las toma del catálogo.
- **Validaciones del front:** el formulario valida largo y formato antes de enviar (RUC, cédula, email, montos, cantidades), pero la base tiene la última palabra: si un procedure rechaza algo, el texto del `ROLLBACK` llega al usuario tal cual.
