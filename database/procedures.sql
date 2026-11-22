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


SET SQL_MODE=@OLD_SQL_MODE;
