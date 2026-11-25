-- Cada procedure guarda el sql_mode activo al crearse y siempre corre con ese,
-- por eso se fija el modo estricto aquí y no se depende del default del servidor.
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- procedure registrar_pago
-- -----------------------------------------------------

DELIMITER $$
USE `repuestos_bdd`$$
DROP PROCEDURE IF EXISTS `registrar_pago`$$
CREATE PROCEDURE registrar_pago(IN p_codigo_pago VARCHAR(45),
IN p_numero_factura VARCHAR(45), 
IN p_monto DECIMAL(10,2),
IN p_forma_pago VARCHAR(45),
IN p_referencia VARCHAR(45))

proc: BEGIN
DECLARE v_estado VARCHAR(45);  
DECLARE v_iva DECIMAL(5,2);
DECLARE v_total DECIMAL(14,4);
DECLARE v_devuelto DECIMAL(14,4);
DECLARE v_pagado DECIMAL(14,2);
DECLARE v_saldo    DECIMAL(14,2);
DECLARE EXIT HANDLER FOR SQLEXCEPTION
BEGIN
ROLLBACK;

SELECT 'ROLLBACK: error de SQL, no se registro el pago (codigo de pago repetido o dato invalido)' AS mensaje;
END;

START TRANSACTION;
IF NOT EXISTS (SELECT * FROM tFactura WHERE numero_factura = p_numero_factura) THEN
ROLLBACK;

SELECT CONCAT('ROLLBACK: la factura ', IFNULL(p_numero_factura, 'NULL'), ' no existe') AS mensaje;  
LEAVE proc;
END IF;

SELECT estado, porcentaje_iva INTO v_estado, v_iva
FROM tFactura
WHERE numero_factura = p_numero_factura
FOR UPDATE;

IF v_estado <> 'EMITIDA' THEN
ROLLBACK;

SELECT CONCAT('ROLLBACK: la factura ', p_numero_factura, ' esta ', v_estado) AS mensaje;
LEAVE proc;
END IF;

IF p_monto IS NULL OR p_monto <= 0 THEN
ROLLBACK;

SELECT 'ROLLBACK: el monto debe ser mayor que 0' AS mensaje;
LEAVE proc;
END IF;

IF NOT EXISTS (SELECT * FROM tFormaPago WHERE codigo_forma_pago = p_forma_pago) THEN
ROLLBACK;

SELECT CONCAT('ROLLBACK: la forma de pago ', IFNULL(p_forma_pago, 'NULL'), ' no existe') AS mensaje;  -- CAMBIO: IFNULL
LEAVE proc;
END IF;

SET v_total = (SELECT COALESCE(SUM(cantidad * precio_unitario * (1 - porcentaje_descuento/100)), 0)
FROM tDetalleFactura
WHERE tFactura_numero_factura = p_numero_factura) * (1 + v_iva/100);

SET v_devuelto = (SELECT COALESCE(SUM(DNC.cantidad * DF.precio_unitario * (1 - DF.porcentaje_descuento/100)), 0)
FROM tNotaCredito AS NC, tDetalleNotaCredito AS DNC, tDetalleFactura AS DF
WHERE NC.tFactura_numero_factura = p_numero_factura
AND DNC.tNotaCredito_numero_nota = NC.numero_nota
AND DF.tFactura_numero_factura = NC.tFactura_numero_factura
AND DF.tProducto_codigo_oe = DNC.tProducto_codigo_oe) * (1 + v_iva/100);

SET v_pagado = (SELECT COALESCE(SUM(monto), 0) FROM tPago
WHERE tFactura_numero_factura = p_numero_factura);

SET v_saldo = ROUND(v_total - v_devuelto - v_pagado, 2);

IF p_monto > v_saldo THEN
ROLLBACK;

SELECT CONCAT('ROLLBACK: el pago de ', p_monto, ' supera el saldo pendiente de ', v_saldo) AS mensaje;
LEAVE proc;
END IF;

INSERT INTO tPago (codigo_pago, fecha, monto, referencia,
tFactura_numero_factura, tFormaPago_codigo_forma_pago)
VALUES (p_codigo_pago, CURDATE(), p_monto, p_referencia,
p_numero_factura, p_forma_pago);
COMMIT;

SELECT CONCAT('COMMIT: pago ', p_codigo_pago, ' de ', p_monto, ' registrado. Saldo pendiente: ',
v_saldo - p_monto) AS mensaje;
END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure ingresar_repuesto
-- -----------------------------------------------------

DELIMITER $$
USE `repuestos_bdd`$$
DROP PROCEDURE IF EXISTS `ingresar_repuesto`$$
CREATE PROCEDURE ingresar_repuesto(IN p_codigo_oe VARCHAR(45),
IN p_descripcion VARCHAR(150),
IN p_precio_venta DECIMAL(10,2),
IN p_stock_minimo INT,
IN p_codigo_marca VARCHAR(45),
IN p_codigo_categoria VARCHAR(45),
IN p_codigo_bodega VARCHAR(45),
IN p_cantidad INT,
IN p_ubicacion VARCHAR(45))   

proc: BEGIN
DECLARE v_nuevo TINYINT DEFAULT 0;
DECLARE v_stock INT;
DECLARE EXIT HANDLER FOR SQLEXCEPTION
BEGIN
ROLLBACK;

SELECT 'ROLLBACK: error de SQL, no se ingreso el repuesto ni el stock (precio o dato invalido)' AS mensaje;
END;

START TRANSACTION;
IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
ROLLBACK;

SELECT 'ROLLBACK: la cantidad a ingresar debe ser mayor que 0' AS mensaje;
LEAVE proc;
END IF;

IF NOT EXISTS (SELECT * FROM tBodega WHERE codigo_bodega = p_codigo_bodega) THEN
ROLLBACK;

SELECT CONCAT('ROLLBACK: la bodega ', IFNULL(p_codigo_bodega, 'NULL'), ' no existe') AS mensaje;  -- CAMBIO: IFNULL
LEAVE proc;
END IF;

IF NOT EXISTS (SELECT * FROM tProducto WHERE codigo_oe = p_codigo_oe) THEN
IF NOT EXISTS (SELECT * FROM tMarca WHERE codigo_marca = p_codigo_marca)
OR NOT EXISTS (SELECT * FROM tCategoria WHERE codigo_categoria = p_codigo_categoria) THEN
ROLLBACK;

SELECT 'ROLLBACK: la marca o la categoria no existe' AS mensaje;
LEAVE proc;
END IF;

IF p_precio_venta IS NULL OR p_precio_venta <= 0
OR p_descripcion IS NULL OR TRIM(p_descripcion) = ''
OR p_stock_minimo < 0 THEN
ROLLBACK;

SELECT 'ROLLBACK: un repuesto nuevo necesita descripcion, precio mayor que 0 y stock minimo no negativo' AS mensaje;
LEAVE proc;
END IF;

INSERT INTO tProducto (codigo_oe, descripcion, precio_venta, stock_minimo,
tMarca_codigo_marca, tCategoria_codigo_categoria)
VALUES (p_codigo_oe, p_descripcion, p_precio_venta, COALESCE(p_stock_minimo, 0),
p_codigo_marca, p_codigo_categoria);
SET v_nuevo = 1;
END IF;

IF EXISTS (SELECT * FROM tInventario
WHERE tBodega_codigo_bodega = p_codigo_bodega
AND tProducto_codigo_oe = p_codigo_oe) THEN
UPDATE tInventario
SET cantidad  = cantidad + p_cantidad,
ubicacion = COALESCE(p_ubicacion, ubicacion)
WHERE tBodega_codigo_bodega = p_codigo_bodega
AND tProducto_codigo_oe = p_codigo_oe;
ELSE
INSERT INTO tInventario (tBodega_codigo_bodega, tProducto_codigo_oe, cantidad, ubicacion)
VALUES (p_codigo_bodega, p_codigo_oe, p_cantidad, p_ubicacion);
END IF;

SET v_stock = (SELECT cantidad FROM tInventario
WHERE tBodega_codigo_bodega = p_codigo_bodega
AND tProducto_codigo_oe = p_codigo_oe);
COMMIT;

SELECT CONCAT('COMMIT: ',
IF(v_nuevo = 1, 'repuesto nuevo creado. ', 'el repuesto ya existia (solo se sumo stock). '),
'Stock de ', p_codigo_oe, ' en ', p_codigo_bodega, ': ', v_stock) AS mensaje;
END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure contratar_empleado
-- -----------------------------------------------------

DELIMITER $$
USE `repuestos_bdd`$$
DROP PROCEDURE IF EXISTS `contratar_empleado`$$
CREATE PROCEDURE contratar_empleado(IN p_codigo_empleado VARCHAR(45),
IN p_cedula VARCHAR(45),   
IN p_nombres VARCHAR(45),
IN p_apellidos VARCHAR(45),
IN p_codigo_rol INT,           
IN p_usuario VARCHAR(45),
IN p_hash_contrasena CHAR(60))

proc: BEGIN
DECLARE v_codigo_existente VARCHAR(45);
DECLARE v_activo TINYINT;
DECLARE EXIT HANDLER FOR SQLEXCEPTION
BEGIN
ROLLBACK;

SELECT 'ROLLBACK: error de SQL, no se contrato al empleado (codigo repetido o dato invalido)' AS mensaje;
END;

START TRANSACTION;
IF p_cedula IS NULL OR p_cedula NOT REGEXP '^[0-9]{10}$' THEN
ROLLBACK;

SELECT 'ROLLBACK: la cedula debe tener exactamente 10 digitos' AS mensaje;
LEAVE proc;
END IF;

IF p_nombres IS NULL OR TRIM(p_nombres) = ''
OR p_apellidos IS NULL OR TRIM(p_apellidos) = ''
OR p_usuario IS NULL OR TRIM(p_usuario) = '' THEN
ROLLBACK;

SELECT 'ROLLBACK: nombres, apellidos y usuario son obligatorios' AS mensaje;
LEAVE proc;
END IF;

IF p_hash_contrasena IS NULL OR CHAR_LENGTH(p_hash_contrasena) <> 60 THEN
ROLLBACK;

SELECT 'ROLLBACK: la contrasena debe llegar como hash bcrypt de 60 caracteres' AS mensaje;
LEAVE proc;
END IF;

IF NOT EXISTS (SELECT * FROM tRol WHERE codigo_rol = p_codigo_rol) THEN
ROLLBACK;

SELECT CONCAT('ROLLBACK: el rol ', IFNULL(p_codigo_rol, 'NULL'), ' no existe') AS mensaje;  -- CAMBIO: IFNULL
LEAVE proc;
END IF;

SET v_codigo_existente = (SELECT codigo_empleado FROM tEmpleado WHERE cedula = p_cedula);

IF EXISTS (SELECT * FROM tEmpleado
WHERE usuario = p_usuario
AND (v_codigo_existente IS NULL OR codigo_empleado <> v_codigo_existente)) THEN
ROLLBACK;

SELECT CONCAT('ROLLBACK: el usuario ', p_usuario, ' ya lo usa otro empleado') AS mensaje;
LEAVE proc;
END IF;

IF v_codigo_existente IS NULL THEN
INSERT INTO tEmpleado (codigo_empleado, cedula, nombres, apellidos,
usuario, hash_contrasena, activo, tRol_codigo_rol)
VALUES (p_codigo_empleado, p_cedula, p_nombres, p_apellidos,
p_usuario, p_hash_contrasena, 1, p_codigo_rol);
COMMIT;

SELECT CONCAT('COMMIT: ', p_nombres, ' ', p_apellidos, ' contratado con el codigo ',
p_codigo_empleado) AS mensaje;
ELSE
SET v_activo = (SELECT activo FROM tEmpleado WHERE codigo_empleado = v_codigo_existente);
IF v_activo = 1 THEN
ROLLBACK;

SELECT CONCAT('ROLLBACK: la cedula ', p_cedula, ' ya pertenece a un empleado activo (',
v_codigo_existente, ')') AS mensaje;
LEAVE proc;
END IF;

UPDATE tEmpleado
SET activo = 1,
nombres = p_nombres,
apellidos = p_apellidos,
usuario = p_usuario,
hash_contrasena = p_hash_contrasena,
tRol_codigo_rol = p_codigo_rol
WHERE codigo_empleado = v_codigo_existente;
COMMIT;

SELECT CONCAT('COMMIT: ', p_nombres, ' ', p_apellidos, ' recontratado, conserva el codigo ',
v_codigo_existente) AS mensaje;
END IF;
END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure registrar_cliente
-- -----------------------------------------------------

DELIMITER $$
USE `repuestos_bdd`$$
DROP PROCEDURE IF EXISTS `registrar_cliente`$$
CREATE PROCEDURE registrar_cliente(IN p_numero_identificacion VARCHAR(45),   
IN p_codigo_tipo VARCHAR(45),
IN p_razon_social VARCHAR(150),
IN p_telefono VARCHAR(45),
IN p_email VARCHAR(100),
IN p_direccion VARCHAR(200),
IN p_codigo_ciudad VARCHAR(45))

proc: BEGIN
DECLARE EXIT HANDLER FOR SQLEXCEPTION
BEGIN
ROLLBACK;

SELECT 'ROLLBACK: error de SQL, no se registro el cliente (dato invalido o demasiado largo)' AS mensaje;
END;

START TRANSACTION;
IF p_numero_identificacion = '9999999999999' THEN
ROLLBACK;

SELECT 'ROLLBACK: el consumidor final ya existe y no se modifica' AS mensaje;
LEAVE proc;
END IF;

IF p_codigo_tipo = '07' THEN
ROLLBACK;

SELECT 'ROLLBACK: solo existe un consumidor final (9999999999999); no se crean otros' AS mensaje;
LEAVE proc;
END IF;

IF NOT EXISTS (SELECT * FROM tTipoIdentificacion
WHERE codigo_tipo_identificacion = p_codigo_tipo) THEN
ROLLBACK;

SELECT CONCAT('ROLLBACK: el tipo de identificacion ', IFNULL(p_codigo_tipo, 'NULL'), ' no existe') AS mensaje;  -- CAMBIO: IFNULL
LEAVE proc;
END IF;

IF (p_codigo_tipo = '04' AND p_numero_identificacion NOT REGEXP '^[0-9]{13}$')
OR (p_codigo_tipo = '05' AND p_numero_identificacion NOT REGEXP '^[0-9]{10}$') THEN
ROLLBACK;

SELECT 'ROLLBACK: un RUC tiene 13 digitos y una cedula 10' AS mensaje;
LEAVE proc;
END IF;

IF p_codigo_ciudad IS NOT NULL
AND NOT EXISTS (SELECT * FROM tCiudad WHERE codigo_ciudad = p_codigo_ciudad) THEN
ROLLBACK;

SELECT CONCAT('ROLLBACK: la ciudad ', p_codigo_ciudad, ' no existe') AS mensaje;
LEAVE proc;
END IF;

IF p_email IS NOT NULL AND p_email NOT LIKE '%_@_%._%' THEN
ROLLBACK;

SELECT CONCAT('ROLLBACK: el email ', p_email, ' no es valido') AS mensaje;
LEAVE proc;
END IF;

IF NOT EXISTS (SELECT * FROM tCliente WHERE numero_identificacion = p_numero_identificacion) THEN
INSERT INTO tCliente (numero_identificacion, razon_social, telefono, email, direccion,
fecha_registro, fecha_modificacion,
tTipoIdentificacion_codigo_tipo_identificacion, tCiudad_codigo_ciudad)
VALUES (p_numero_identificacion, UPPER(p_razon_social), p_telefono, p_email, p_direccion,
CURDATE(), NULL, p_codigo_tipo, p_codigo_ciudad);
COMMIT;

SELECT CONCAT('COMMIT: cliente ', UPPER(p_razon_social), ' registrado') AS mensaje;
ELSE
UPDATE tCliente
SET razon_social = COALESCE(UPPER(p_razon_social), razon_social),
telefono = COALESCE(p_telefono, telefono),
email = COALESCE(p_email, email),
direccion = COALESCE(p_direccion, direccion),
tCiudad_codigo_ciudad = COALESCE(p_codigo_ciudad, tCiudad_codigo_ciudad),
fecha_modificacion = CURDATE()
WHERE numero_identificacion = p_numero_identificacion;
COMMIT;

SELECT CONCAT('COMMIT: el cliente ', p_numero_identificacion,
' ya existia, se actualizaron sus datos') AS mensaje;
END IF;
END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure eliminar_pago
-- -----------------------------------------------------

DELIMITER $$
USE `repuestos_bdd`$$
DROP PROCEDURE IF EXISTS `eliminar_pago`$$
CREATE PROCEDURE eliminar_pago(IN p_codigo_pago VARCHAR(45))
proc: BEGIN
DECLARE v_fecha DATE;
DECLARE v_monto DECIMAL(10,2);
DECLARE v_factura VARCHAR(45);   
DECLARE v_estado VARCHAR(45);   
DECLARE EXIT HANDLER FOR SQLEXCEPTION
BEGIN
ROLLBACK;

SELECT 'ROLLBACK: error de SQL, no se elimino el pago' AS mensaje;
END;

START TRANSACTION;
IF NOT EXISTS (SELECT * FROM tPago WHERE codigo_pago = p_codigo_pago) THEN
ROLLBACK;

SELECT CONCAT('ROLLBACK: el pago ', IFNULL(p_codigo_pago, 'NULL'), ' no existe') AS mensaje;  
LEAVE proc;
END IF;

SELECT fecha, monto, tFactura_numero_factura INTO v_fecha, v_monto, v_factura
FROM tPago
WHERE codigo_pago = p_codigo_pago
FOR UPDATE;

IF v_fecha <> CURDATE() THEN
ROLLBACK;

SELECT CONCAT('ROLLBACK: el pago ', p_codigo_pago, ' es del ', v_fecha,
'; solo se eliminan pagos registrados hoy') AS mensaje;
LEAVE proc;
END IF;

SET v_estado = (SELECT estado FROM tFactura WHERE numero_factura = v_factura);
IF v_estado <> 'EMITIDA' THEN
ROLLBACK;

SELECT CONCAT('ROLLBACK: la factura ', v_factura, ' esta ', v_estado) AS mensaje;
LEAVE proc;
END IF;

DELETE FROM tPago
WHERE codigo_pago = p_codigo_pago;
COMMIT;

SELECT CONCAT('COMMIT: se elimino el pago ', p_codigo_pago, ' de ', v_monto,
'; la factura ', v_factura, ' vuelve a deber ese monto') AS mensaje;
END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure trasladar_repuesto
-- -----------------------------------------------------

DELIMITER $$
USE `repuestos_bdd`$$
DROP PROCEDURE IF EXISTS `trasladar_repuesto`$$
CREATE PROCEDURE trasladar_repuesto(IN p_codigo_oe VARCHAR(45),   
IN p_bodega_origen VARCHAR(45),
IN p_bodega_destino VARCHAR(45),
IN p_cantidad INT,
IN p_ubicacion_destino VARCHAR(45)) 

proc: BEGIN
DECLARE v_stock_origen  INT;
DECLARE v_stock_destino INT;
DECLARE EXIT HANDLER FOR SQLEXCEPTION
BEGIN
ROLLBACK;

SELECT 'ROLLBACK: error de SQL, no se movio ninguna unidad' AS mensaje;
END;

START TRANSACTION;
IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
ROLLBACK;

SELECT 'ROLLBACK: la cantidad a trasladar debe ser mayor que 0' AS mensaje;
LEAVE proc;
END IF;

IF p_bodega_origen = p_bodega_destino THEN
ROLLBACK;

SELECT 'ROLLBACK: la bodega de origen y la de destino son la misma' AS mensaje;
LEAVE proc;
END IF;

IF NOT EXISTS (SELECT * FROM tBodega WHERE codigo_bodega = p_bodega_destino) THEN
ROLLBACK;

SELECT CONCAT('ROLLBACK: la bodega ', IFNULL(p_bodega_destino, 'NULL'), ' no existe') AS mensaje;  
LEAVE proc;
END IF;

IF NOT EXISTS (SELECT * FROM tInventario
WHERE tBodega_codigo_bodega = p_bodega_origen
AND tProducto_codigo_oe = p_codigo_oe) THEN
ROLLBACK;

SELECT CONCAT('ROLLBACK: la bodega ', IFNULL(p_bodega_origen, 'NULL'), ' no tiene el repuesto ',
IFNULL(p_codigo_oe, 'NULL')) AS mensaje;  
LEAVE proc;
END IF;

SELECT cantidad INTO v_stock_origen
FROM tInventario
WHERE tBodega_codigo_bodega = p_bodega_origen
AND tProducto_codigo_oe = p_codigo_oe
FOR UPDATE;

IF v_stock_origen < p_cantidad THEN
ROLLBACK;

SELECT CONCAT('ROLLBACK: la bodega ', p_bodega_origen, ' solo tiene ', v_stock_origen,
' unidad(es) de ', p_codigo_oe) AS mensaje;
LEAVE proc;
END IF;

IF v_stock_origen = p_cantidad THEN
DELETE FROM tInventario
WHERE tBodega_codigo_bodega = p_bodega_origen
AND tProducto_codigo_oe = p_codigo_oe;
ELSE
UPDATE tInventario
SET cantidad = cantidad - p_cantidad
WHERE tBodega_codigo_bodega = p_bodega_origen
AND tProducto_codigo_oe = p_codigo_oe;
END IF;

IF EXISTS (SELECT * FROM tInventario
WHERE tBodega_codigo_bodega = p_bodega_destino
AND tProducto_codigo_oe = p_codigo_oe) THEN
UPDATE tInventario
SET cantidad  = cantidad + p_cantidad,
ubicacion = COALESCE(p_ubicacion_destino, ubicacion)
WHERE tBodega_codigo_bodega = p_bodega_destino
AND tProducto_codigo_oe = p_codigo_oe;
ELSE
INSERT INTO tInventario (tBodega_codigo_bodega, tProducto_codigo_oe, cantidad, ubicacion)
VALUES (p_bodega_destino, p_codigo_oe, p_cantidad, p_ubicacion_destino);
END IF;

SET v_stock_destino = (SELECT cantidad FROM tInventario
WHERE tBodega_codigo_bodega = p_bodega_destino
AND tProducto_codigo_oe = p_codigo_oe);
COMMIT;

SELECT CONCAT('COMMIT: ', p_cantidad, ' unidad(es) de ', p_codigo_oe, ' de ', p_bodega_origen,
' a ', p_bodega_destino, '. Quedan ', v_stock_origen - p_cantidad, ' en ',
p_bodega_origen,
IF(v_stock_origen = p_cantidad, ' (fila eliminada)', ''),
' y ', v_stock_destino, ' en ', p_bodega_destino) AS mensaje;
END$$

DELIMITER ;


-- -----------------------------------------------------
-- procedure emitir_factura
-- -----------------------------------------------------

DELIMITER $$
USE `repuestos_bdd`$$
DROP PROCEDURE IF EXISTS `emitir_factura`$$
-- p_detalle: '[{"codigo_oe":"34116860016","cantidad":2,"porcentaje_descuento":10}]'
--   (porcentaje_descuento es opcional; mismo nombre que la columna y que el front)
-- p_forma_pago: NULL = venta a credito (queda en Cuentas_por_cobrar).
--   Con un codigo de tFormaPago = venta al contado: en la MISMA transaccion
--   se registra un pago por el total, con codigo 'PAG-' + secuencial.
CREATE PROCEDURE emitir_factura(IN p_numero_identificacion VARCHAR(45),
IN p_codigo_empleado VARCHAR(45),
IN p_codigo_bodega VARCHAR(45),
IN p_detalle TEXT,
IN p_forma_pago CHAR(2))

proc: BEGIN
DECLARE v_iva DECIMAL(5,2) DEFAULT 15.00;
DECLARE v_lineas INT;
DECLARE i INT DEFAULT 0;
DECLARE v_numero VARCHAR(45);
DECLARE v_siguiente INT;
DECLARE v_codigo_oe VARCHAR(45);
DECLARE v_tipo_cant VARCHAR(20);
DECLARE v_tipo_desc VARCHAR(20);
DECLARE v_cantidad INT;
DECLARE v_descuento DECIMAL(5,2);
DECLARE v_precio DECIMAL(10,2);
DECLARE v_stock INT;
DECLARE v_minimo INT;
DECLARE v_bajo_min VARCHAR(500) DEFAULT '';
DECLARE v_total DECIMAL(14,2);
DECLARE v_sqlstate CHAR(5);
DECLARE v_texto VARCHAR(255);

-- Si el error es un SIGNAL '45000' de un trigger (texto nuestro), se muestra
-- tal cual. Cualquier otro error de SQL sigue con el mensaje generico, para
-- no mostrarle detalles de la base al usuario. GET DIAGNOSTICS va antes del
-- ROLLBACK, porque el ROLLBACK limpia el error.
DECLARE EXIT HANDLER FOR SQLEXCEPTION
BEGIN
GET DIAGNOSTICS CONDITION 1 v_sqlstate = RETURNED_SQLSTATE, v_texto = MESSAGE_TEXT;
ROLLBACK;

SELECT CONCAT('ROLLBACK: ', IF(v_sqlstate = '45000', v_texto,
'error de SQL, no se emitio la factura ni se toco el stock')) AS mensaje;
END;

START TRANSACTION;
IF NOT EXISTS (SELECT * FROM tCliente WHERE numero_identificacion = p_numero_identificacion) THEN
ROLLBACK;
SELECT CONCAT('ROLLBACK: el cliente ', IFNULL(p_numero_identificacion, 'NULL'), ' no existe') AS mensaje;
LEAVE proc;
END IF;

IF NOT EXISTS (SELECT * FROM tEmpleado
WHERE codigo_empleado = p_codigo_empleado AND activo = 1) THEN
ROLLBACK;
SELECT CONCAT('ROLLBACK: el empleado ', IFNULL(p_codigo_empleado, 'NULL'),
' no existe o esta dado de baja') AS mensaje;
LEAVE proc;
END IF;

IF NOT EXISTS (SELECT * FROM tBodega WHERE codigo_bodega = p_codigo_bodega) THEN
ROLLBACK;
SELECT CONCAT('ROLLBACK: la bodega ', IFNULL(p_codigo_bodega, 'NULL'), ' no existe') AS mensaje;
LEAVE proc;
END IF;

IF p_forma_pago IS NOT NULL
AND NOT EXISTS (SELECT * FROM tFormaPago WHERE codigo_forma_pago = p_forma_pago) THEN
ROLLBACK;
SELECT CONCAT('ROLLBACK: la forma de pago ', p_forma_pago, ' no existe') AS mensaje;
LEAVE proc;
END IF;

IF p_detalle IS NULL OR JSON_VALID(p_detalle) = 0
OR JSON_TYPE(p_detalle) <> 'ARRAY' OR JSON_LENGTH(p_detalle) = 0 THEN
ROLLBACK;

SELECT 'ROLLBACK: la factura necesita al menos una linea de detalle' AS mensaje;
LEAVE proc;
END IF;
SET v_lineas = JSON_LENGTH(p_detalle);

SELECT COALESCE(MAX(CAST(SUBSTRING(numero_factura, 9) AS UNSIGNED)), 0) + 1
INTO v_siguiente
FROM tFactura
WHERE numero_factura LIKE '001-001-%'
FOR UPDATE;
SET v_numero = CONCAT('001-001-', LPAD(v_siguiente, 9, '0'));

INSERT INTO tFactura (numero_factura, fecha_emision, porcentaje_iva, estado,
tCliente_numero_identificacion, tEmpleado_codigo_empleado)
VALUES (v_numero, CURDATE(), v_iva, 'EMITIDA', p_numero_identificacion, p_codigo_empleado);

lineas: WHILE i < v_lineas DO
SET v_codigo_oe = JSON_UNQUOTE(JSON_EXTRACT(p_detalle, CONCAT('$[', i, '].codigo_oe')));
SET v_tipo_cant = JSON_TYPE(JSON_EXTRACT(p_detalle, CONCAT('$[', i, '].cantidad')));
SET v_tipo_desc = JSON_TYPE(JSON_EXTRACT(p_detalle, CONCAT('$[', i, '].porcentaje_descuento')));

IF v_tipo_cant IS NULL OR v_tipo_cant NOT IN ('INTEGER', 'UNSIGNED INTEGER') THEN
ROLLBACK;

SELECT CONCAT('ROLLBACK: linea ', i + 1, ': la cantidad debe ser un numero entero') AS mensaje;
LEAVE proc;
END IF;
SET v_cantidad = JSON_EXTRACT(p_detalle, CONCAT('$[', i, '].cantidad'));

IF v_tipo_desc IS NULL OR v_tipo_desc = 'NULL' THEN
SET v_descuento = 0;
ELSEIF v_tipo_desc NOT IN ('INTEGER', 'UNSIGNED INTEGER', 'DOUBLE', 'DECIMAL') THEN
ROLLBACK;

SELECT CONCAT('ROLLBACK: linea ', i + 1, ': el descuento debe ser un numero') AS mensaje;
LEAVE proc;
ELSE
SET v_descuento = JSON_EXTRACT(p_detalle, CONCAT('$[', i, '].porcentaje_descuento'));
END IF;

IF v_cantidad <= 0 THEN
ROLLBACK;

SELECT CONCAT('ROLLBACK: linea ', i + 1, ': la cantidad debe ser mayor que 0') AS mensaje;
LEAVE proc;
END IF;
IF v_descuento < 0 OR v_descuento > 100 THEN
ROLLBACK;

SELECT CONCAT('ROLLBACK: linea ', i + 1, ': el descuento va de 0 a 100') AS mensaje;
LEAVE proc;
END IF;

SET v_precio = NULL;
SELECT precio_venta, stock_minimo INTO v_precio, v_minimo
FROM tProducto
WHERE codigo_oe = v_codigo_oe;
IF v_precio IS NULL THEN
ROLLBACK;

SELECT CONCAT('ROLLBACK: linea ', i + 1, ': el repuesto ', IFNULL(v_codigo_oe, 'NULL'),
' no existe') AS mensaje;
LEAVE proc;
END IF;

IF EXISTS (SELECT * FROM tDetalleFactura
WHERE tFactura_numero_factura = v_numero
AND tProducto_codigo_oe = v_codigo_oe) THEN
ROLLBACK;

SELECT CONCAT('ROLLBACK: el repuesto ', v_codigo_oe,
' esta repetido en el carrito; suma las cantidades en una sola linea') AS mensaje;
LEAVE proc;
END IF;

SET v_stock = NULL;
SELECT cantidad INTO v_stock
FROM tInventario
WHERE tBodega_codigo_bodega = p_codigo_bodega
AND tProducto_codigo_oe = v_codigo_oe
FOR UPDATE;

IF v_stock IS NULL OR v_stock < v_cantidad THEN
ROLLBACK;

SELECT CONCAT('ROLLBACK: linea ', i + 1, ': la bodega ', p_codigo_bodega, ' solo tiene ',
IFNULL(v_stock, 0), ' unidad(es) de ', v_codigo_oe,
' y se piden ', v_cantidad) AS mensaje;
LEAVE proc;
END IF;

INSERT INTO tDetalleFactura (tProducto_codigo_oe, tFactura_numero_factura,
cantidad, precio_unitario, porcentaje_descuento)
VALUES (v_codigo_oe, v_numero, v_cantidad, v_precio, v_descuento);

UPDATE tInventario
SET cantidad = cantidad - v_cantidad
WHERE tBodega_codigo_bodega = p_codigo_bodega
AND tProducto_codigo_oe = v_codigo_oe;

IF v_stock - v_cantidad < v_minimo THEN
SET v_bajo_min = CONCAT(v_bajo_min, ' ', v_codigo_oe, ' (quedan ', v_stock - v_cantidad, ')');
END IF;

SET i = i + 1;
END WHILE lineas;

SET v_total = ROUND((SELECT SUM(cantidad * precio_unitario * (1 - porcentaje_descuento/100))
FROM tDetalleFactura
WHERE tFactura_numero_factura = v_numero) * (1 + v_iva/100), 2);

IF p_forma_pago IS NOT NULL THEN
INSERT INTO tPago (codigo_pago, fecha, monto, referencia,
tFactura_numero_factura, tFormaPago_codigo_forma_pago)
VALUES (CONCAT('PAG-', RIGHT(v_numero, 9)), CURDATE(), v_total, NULL,
v_numero, p_forma_pago);
END IF;
COMMIT;

SELECT CONCAT('COMMIT: factura ', v_numero, ' emitida por ', v_total, ' (', v_lineas, ' linea(s))',
IF(p_forma_pago IS NULL, '. Queda con saldo por cobrar', '. Pagada al contado'),
IF(v_bajo_min = '', '', CONCAT('. Aviso: bajo el stock minimo en ', p_codigo_bodega, ':', v_bajo_min)))
AS mensaje,
v_numero AS numero_factura,
v_total  AS total;
END$$
DELIMITER ;

-- -----------------------------------------------------
-- procedure dar_baja_empleado
-- -----------------------------------------------------

DELIMITER $$
USE `repuestos_bdd`$$
DROP PROCEDURE IF EXISTS `dar_baja_empleado`$$
CREATE PROCEDURE dar_baja_empleado(IN p_codigo_empleado VARCHAR(45))

proc: BEGIN
DECLARE v_rol_admin INT DEFAULT 1; 
DECLARE v_activo TINYINT;
DECLARE v_rol INT;
DECLARE v_admins INT;
DECLARE EXIT HANDLER FOR SQLEXCEPTION
BEGIN
ROLLBACK;

SELECT 'ROLLBACK: error de SQL, el empleado sigue activo' AS mensaje;
END;

START TRANSACTION;
SELECT COUNT(*) INTO v_admins
FROM tEmpleado
WHERE tRol_codigo_rol = v_rol_admin AND activo = 1
FOR UPDATE;

SET v_activo = NULL;
SELECT activo, tRol_codigo_rol INTO v_activo, v_rol
FROM tEmpleado
WHERE codigo_empleado = p_codigo_empleado
FOR UPDATE;

IF v_activo IS NULL THEN
ROLLBACK;

SELECT CONCAT('ROLLBACK: el empleado ', IFNULL(p_codigo_empleado, 'NULL'), ' no existe') AS mensaje;
LEAVE proc;
END IF;

IF v_activo = 0 THEN
ROLLBACK;

SELECT CONCAT('ROLLBACK: el empleado ', p_codigo_empleado, ' ya estaba dado de baja') AS mensaje;
LEAVE proc;
END IF;

IF v_rol = v_rol_admin AND v_admins <= 1 THEN
ROLLBACK;

SELECT CONCAT('ROLLBACK: ', p_codigo_empleado,
' es el unico administrador activo; activa otro antes de darlo de baja') AS mensaje;
LEAVE proc;
END IF;

UPDATE tEmpleado
SET activo = 0
WHERE codigo_empleado = p_codigo_empleado;
COMMIT;

SELECT CONCAT('COMMIT: el empleado ', p_codigo_empleado,
' quedo inactivo (activo = 0); ya no puede iniciar sesion ni facturar') AS mensaje;
END$$
DELIMITER ;

SET SQL_MODE=@OLD_SQL_MODE;
