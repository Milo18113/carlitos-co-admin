-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `mydb` ;

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `mydb` DEFAULT CHARACTER SET utf8 ;
USE `mydb` ;

-- -----------------------------------------------------
-- Table `mydb`.`tTipoIdentificacion`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`tTipoIdentificacion` (
  `codigo_tipo_identificacion` CHAR(2) NOT NULL,
  `descripcion` VARCHAR(150) NOT NULL,
  PRIMARY KEY (`codigo_tipo_identificacion`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`tCiudad`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`tCiudad` (
  `codigo_ciudad` VARCHAR(45) NOT NULL,
  `nombre` VARCHAR(45) NOT NULL,
  `provincia` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`codigo_ciudad`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`tCliente`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`tCliente` (
  `numero_identificacion` VARCHAR(45) NOT NULL,
  `razon_social` VARCHAR(150) NOT NULL,
  `telefono` VARCHAR(45) NULL,
  `email` VARCHAR(100) NULL,
  `direccion` VARCHAR(200) NULL,
  `fecha_registro` DATE NOT NULL,
  `fecha_modificacion` DATE NULL,
  `tTipoIdentificacion_codigo_tipo_identificacion` CHAR(2) NOT NULL,
  `tCiudad_codigo_ciudad` VARCHAR(45) NULL,
  PRIMARY KEY (`numero_identificacion`),
  INDEX `fk_tCliente_tTipoIdentificacion1_idx` (`tTipoIdentificacion_codigo_tipo_identificacion` ASC) VISIBLE,
  INDEX `fk_tCliente_tCiudad1_idx` (`tCiudad_codigo_ciudad` ASC) VISIBLE,
  CONSTRAINT `fk_tCliente_tTipoIdentificacion1`
    FOREIGN KEY (`tTipoIdentificacion_codigo_tipo_identificacion`)
    REFERENCES `mydb`.`tTipoIdentificacion` (`codigo_tipo_identificacion`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_tCliente_tCiudad1`
    FOREIGN KEY (`tCiudad_codigo_ciudad`)
    REFERENCES `mydb`.`tCiudad` (`codigo_ciudad`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`tRol`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`tRol` (
  `codigo_rol` INT NOT NULL,
  `nombre` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`codigo_rol`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`tEmpleado`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`tEmpleado` (
  `codigo_empleado` VARCHAR(45) NOT NULL,
  `cedula` VARCHAR(45) NOT NULL,
  `nombres` VARCHAR(45) NOT NULL,
  `apellidos` VARCHAR(45) NOT NULL,
  `usuario` VARCHAR(45) NOT NULL,
  `hash_contrasena` CHAR(60) NOT NULL,
  `activo` TINYINT(1) NOT NULL,
  `tRol_codigo_rol` INT NOT NULL,
  PRIMARY KEY (`codigo_empleado`),
  UNIQUE INDEX `cedula_UNIQUE` (`cedula` ASC) VISIBLE,
  UNIQUE INDEX `usuario_UNIQUE` (`usuario` ASC) VISIBLE,
  INDEX `fk_tEmpleado_tRol1_idx` (`tRol_codigo_rol` ASC) VISIBLE,
  CONSTRAINT `fk_tEmpleado_tRol1`
    FOREIGN KEY (`tRol_codigo_rol`)
    REFERENCES `mydb`.`tRol` (`codigo_rol`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`tProveedor`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`tProveedor` (
  `id_proveedor` VARCHAR(45) NOT NULL,
  `nombre` VARCHAR(45) NOT NULL,
  `pais` VARCHAR(45) NULL,
  `telefono` VARCHAR(45) NULL,
  `email` VARCHAR(45) NULL,
  PRIMARY KEY (`id_proveedor`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`tCategoria`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`tCategoria` (
  `codigo_categoria` VARCHAR(45) NOT NULL,
  `nombre` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`codigo_categoria`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`tMarca`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`tMarca` (
  `codigo_marca` VARCHAR(45) NOT NULL,
  `nombre` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`codigo_marca`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`tProducto`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`tProducto` (
  `codigo_oe` VARCHAR(45) NOT NULL,
  `descripcion` VARCHAR(150) NOT NULL,
  `precio_venta` DECIMAL(10,2) NOT NULL,
  `stock_minimo` INT NOT NULL,
  `tCategoria_codigo_categoria` VARCHAR(45) NOT NULL,
  `tMarca_codigo_marca` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`codigo_oe`),
  INDEX `fk_tProducto_tCategoria1_idx` (`tCategoria_codigo_categoria` ASC) VISIBLE,
  INDEX `fk_tProducto_tMarca1_idx` (`tMarca_codigo_marca` ASC) VISIBLE,
  CONSTRAINT `fk_tProducto_tCategoria1`
    FOREIGN KEY (`tCategoria_codigo_categoria`)
    REFERENCES `mydb`.`tCategoria` (`codigo_categoria`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_tProducto_tMarca1`
    FOREIGN KEY (`tMarca_codigo_marca`)
    REFERENCES `mydb`.`tMarca` (`codigo_marca`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`tModelo`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`tModelo` (
  `id_modelo` VARCHAR(45) NOT NULL,
  `codigo` VARCHAR(45) NOT NULL,
  `tipo` VARCHAR(45) NOT NULL,
  `descripcion` VARCHAR(45) NULL,
  `anio_desde` INT NULL,
  `anio_hasta` INT NULL,
  `tMarca_codigo_marca` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id_modelo`),
  INDEX `fk_tModelo_tMarca1_idx` (`tMarca_codigo_marca` ASC) VISIBLE,
  CONSTRAINT `fk_tModelo_tMarca1`
    FOREIGN KEY (`tMarca_codigo_marca`)
    REFERENCES `mydb`.`tMarca` (`codigo_marca`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`tBodega`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`tBodega` (
  `codigo_bodega` VARCHAR(45) NOT NULL,
  `nombre` VARCHAR(45) NOT NULL,
  `direccion` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`codigo_bodega`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`tCompra`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`tCompra` (
  `codigo_compra` VARCHAR(45) NOT NULL,
  `fecha` DATE NOT NULL,
  `numero_documento_proveedor` VARCHAR(45) NULL,
  `factor_costo` DECIMAL(10,2) NOT NULL,
  `tEmpleado_codigo_empleado` VARCHAR(45) NOT NULL,
  `tProveedor_id_proveedor` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`codigo_compra`),
  INDEX `fk_tCompra_tEmpleado1_idx` (`tEmpleado_codigo_empleado` ASC) VISIBLE,
  INDEX `fk_tCompra_tProveedor1_idx` (`tProveedor_id_proveedor` ASC) VISIBLE,
  CONSTRAINT `fk_tCompra_tEmpleado1`
    FOREIGN KEY (`tEmpleado_codigo_empleado`)
    REFERENCES `mydb`.`tEmpleado` (`codigo_empleado`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_tCompra_tProveedor1`
    FOREIGN KEY (`tProveedor_id_proveedor`)
    REFERENCES `mydb`.`tProveedor` (`id_proveedor`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`tFactura`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`tFactura` (
  `numero_factura` VARCHAR(45) NOT NULL,
  `fecha_emision` DATE NOT NULL,
  `porcentaje_iva` DECIMAL(5,2) NOT NULL,
  `estado` VARCHAR(45) NOT NULL,
  `tCliente_numero_identificacion` VARCHAR(45) NOT NULL,
  `tEmpleado_codigo_empleado` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`numero_factura`),
  INDEX `fk_tFactura_tCliente1_idx` (`tCliente_numero_identificacion` ASC) VISIBLE,
  INDEX `fk_tFactura_tEmpleado1_idx` (`tEmpleado_codigo_empleado` ASC) VISIBLE,
  CONSTRAINT `fk_tFactura_tCliente1`
    FOREIGN KEY (`tCliente_numero_identificacion`)
    REFERENCES `mydb`.`tCliente` (`numero_identificacion`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_tFactura_tEmpleado1`
    FOREIGN KEY (`tEmpleado_codigo_empleado`)
    REFERENCES `mydb`.`tEmpleado` (`codigo_empleado`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`tFormaPago`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`tFormaPago` (
  `codigo_forma_pago` CHAR(2) NOT NULL,
  `descripcion` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`codigo_forma_pago`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`tPago`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`tPago` (
  `codigo_pago` VARCHAR(45) NOT NULL,
  `fecha` DATE NOT NULL,
  `monto` DECIMAL(10,2) NOT NULL,
  `referencia` VARCHAR(45) NULL,
  `tFactura_numero_factura` VARCHAR(45) NOT NULL,
  `tFormaPago_codigo_forma_pago` CHAR(2) NOT NULL,
  PRIMARY KEY (`codigo_pago`),
  INDEX `fk_tPago_tFactura1_idx` (`tFactura_numero_factura` ASC) VISIBLE,
  INDEX `fk_tPago_tFormaPago1_idx` (`tFormaPago_codigo_forma_pago` ASC) VISIBLE,
  CONSTRAINT `fk_tPago_tFactura1`
    FOREIGN KEY (`tFactura_numero_factura`)
    REFERENCES `mydb`.`tFactura` (`numero_factura`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_tPago_tFormaPago1`
    FOREIGN KEY (`tFormaPago_codigo_forma_pago`)
    REFERENCES `mydb`.`tFormaPago` (`codigo_forma_pago`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`tNotaCredito`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`tNotaCredito` (
  `numero_nota` INT NOT NULL,
  `fecha` DATE NOT NULL,
  `motivo` VARCHAR(45) NOT NULL,
  `tFactura_numero_factura` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`numero_nota`),
  INDEX `fk_tNotaCredito_tFactura1_idx` (`tFactura_numero_factura` ASC) VISIBLE,
  CONSTRAINT `fk_tNotaCredito_tFactura1`
    FOREIGN KEY (`tFactura_numero_factura`)
    REFERENCES `mydb`.`tFactura` (`numero_factura`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`tDetalleFactura`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`tDetalleFactura` (
  `tProducto_codigo_oe` VARCHAR(45) NOT NULL,
  `tFactura_numero_factura` VARCHAR(45) NOT NULL,
  `cantidad` INT NOT NULL,
  `precio_unitario` DECIMAL(10,2) NOT NULL,
  `porcentaje_descuento` DECIMAL(5,2) NOT NULL,
  PRIMARY KEY (`tProducto_codigo_oe`, `tFactura_numero_factura`),
  INDEX `fk_tProducto_has_tFactura_tFactura1_idx` (`tFactura_numero_factura` ASC) VISIBLE,
  INDEX `fk_tProducto_has_tFactura_tProducto_idx` (`tProducto_codigo_oe` ASC) VISIBLE,
  CONSTRAINT `fk_tProducto_has_tFactura_tProducto`
    FOREIGN KEY (`tProducto_codigo_oe`)
    REFERENCES `mydb`.`tProducto` (`codigo_oe`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_tProducto_has_tFactura_tFactura1`
    FOREIGN KEY (`tFactura_numero_factura`)
    REFERENCES `mydb`.`tFactura` (`numero_factura`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`tDetalleCompra`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`tDetalleCompra` (
  `tProducto_codigo_oe` VARCHAR(45) NOT NULL,
  `tCompra_codigo_compra` VARCHAR(45) NOT NULL,
  `cantidad` INT NOT NULL,
  `costo_unitario` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`tProducto_codigo_oe`, `tCompra_codigo_compra`),
  INDEX `fk_tProducto_has_tCompra_tCompra1_idx` (`tCompra_codigo_compra` ASC) VISIBLE,
  INDEX `fk_tProducto_has_tCompra_tProducto1_idx` (`tProducto_codigo_oe` ASC) VISIBLE,
  CONSTRAINT `fk_tProducto_has_tCompra_tProducto1`
    FOREIGN KEY (`tProducto_codigo_oe`)
    REFERENCES `mydb`.`tProducto` (`codigo_oe`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_tProducto_has_tCompra_tCompra1`
    FOREIGN KEY (`tCompra_codigo_compra`)
    REFERENCES `mydb`.`tCompra` (`codigo_compra`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`tInventario`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`tInventario` (
  `tBodega_codigo_bodega` VARCHAR(45) NOT NULL,
  `tProducto_codigo_oe` VARCHAR(45) NOT NULL,
  `cantidad` INT NOT NULL,
  `ubicacion` VARCHAR(45) NULL,
  PRIMARY KEY (`tBodega_codigo_bodega`, `tProducto_codigo_oe`),
  INDEX `fk_tBodega_has_tProducto_tProducto1_idx` (`tProducto_codigo_oe` ASC) VISIBLE,
  INDEX `fk_tBodega_has_tProducto_tBodega1_idx` (`tBodega_codigo_bodega` ASC) VISIBLE,
  CONSTRAINT `fk_tBodega_has_tProducto_tBodega1`
    FOREIGN KEY (`tBodega_codigo_bodega`)
    REFERENCES `mydb`.`tBodega` (`codigo_bodega`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_tBodega_has_tProducto_tProducto1`
    FOREIGN KEY (`tProducto_codigo_oe`)
    REFERENCES `mydb`.`tProducto` (`codigo_oe`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`tCompatibilidad`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`tCompatibilidad` (
  `tModelo_id_modelo` VARCHAR(45) NOT NULL,
  `tProducto_codigo_oe` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`tModelo_id_modelo`, `tProducto_codigo_oe`),
  INDEX `fk_tModelo_has_tProducto_tProducto1_idx` (`tProducto_codigo_oe` ASC) VISIBLE,
  INDEX `fk_tModelo_has_tProducto_tModelo1_idx` (`tModelo_id_modelo` ASC) VISIBLE,
  CONSTRAINT `fk_tModelo_has_tProducto_tModelo1`
    FOREIGN KEY (`tModelo_id_modelo`)
    REFERENCES `mydb`.`tModelo` (`id_modelo`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_tModelo_has_tProducto_tProducto1`
    FOREIGN KEY (`tProducto_codigo_oe`)
    REFERENCES `mydb`.`tProducto` (`codigo_oe`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`tProductoProveedor`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`tProductoProveedor` (
  `tProducto_codigo_oe` VARCHAR(45) NOT NULL,
  `tProveedor_id_proveedor` VARCHAR(45) NOT NULL,
  `codigo_proveedor` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`tProducto_codigo_oe`, `tProveedor_id_proveedor`),
  INDEX `fk_tProducto_has_tProveedor_tProveedor1_idx` (`tProveedor_id_proveedor` ASC) VISIBLE,
  INDEX `fk_tProducto_has_tProveedor_tProducto1_idx` (`tProducto_codigo_oe` ASC) VISIBLE,
  CONSTRAINT `fk_tProducto_has_tProveedor_tProducto1`
    FOREIGN KEY (`tProducto_codigo_oe`)
    REFERENCES `mydb`.`tProducto` (`codigo_oe`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_tProducto_has_tProveedor_tProveedor1`
    FOREIGN KEY (`tProveedor_id_proveedor`)
    REFERENCES `mydb`.`tProveedor` (`id_proveedor`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`tDetalleNotaCredito`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`tDetalleNotaCredito` (
  `tProducto_codigo_oe` VARCHAR(45) NOT NULL,
  `tNotaCredito_numero_nota` INT NOT NULL,
  `cantidad` INT NOT NULL,
  PRIMARY KEY (`tProducto_codigo_oe`, `tNotaCredito_numero_nota`),
  INDEX `fk_tProducto_has_tNotaCredito_tNotaCredito1_idx` (`tNotaCredito_numero_nota` ASC) VISIBLE,
  INDEX `fk_tProducto_has_tNotaCredito_tProducto1_idx` (`tProducto_codigo_oe` ASC) VISIBLE,
  CONSTRAINT `fk_tProducto_has_tNotaCredito_tProducto1`
    FOREIGN KEY (`tProducto_codigo_oe`)
    REFERENCES `mydb`.`tProducto` (`codigo_oe`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_tProducto_has_tNotaCredito_tNotaCredito1`
    FOREIGN KEY (`tNotaCredito_numero_nota`)
    REFERENCES `mydb`.`tNotaCredito` (`numero_nota`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

USE `mydb` ;

-- -----------------------------------------------------
-- Placeholder table for view `mydb`.`repuestos_disponibles`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`repuestos_disponibles` (`Bodega` INT, `Codigo_oe` INT, `cantidad` INT, `ubicacion` INT, `descripcion` INT, `Marca` INT);

-- -----------------------------------------------------
-- Placeholder table for view `mydb`.`Cuentas_por_cobrar`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Cuentas_por_cobrar` (`id` INT);

-- -----------------------------------------------------
-- Placeholder table for view `mydb`.`Empleados`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Empleados` (`cedula` INT, `nombres` INT, `apellidos` INT, `activo` INT, `Rol` INT, `Facturas_emitidas` INT);

-- -----------------------------------------------------
-- Placeholder table for view `mydb`.`Bodegas_Disponibles`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Bodegas_Disponibles` (`codigo_bodega` INT, `nombre` INT, `direccion` INT, `Cantidad` INT, `Productos_Bodega` INT, `Valor_Bodega` INT);

-- -----------------------------------------------------
-- Placeholder table for view `mydb`.`Desempeno_marca`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Desempeno_marca` (`Marca_codigo` INT, `Nombre_Marca` INT, `Categoria` INT, `Venta_Marca` INT);

-- -----------------------------------------------------
-- procedure registrar_pago
-- -----------------------------------------------------

DELIMITER $$
USE `mydb`$$
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
USE `mydb`$$
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
USE `mydb`$$
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
USE `mydb`$$
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
USE `mydb`$$
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
USE `mydb`$$
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
-- View `mydb`.`repuestos_disponibles`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `mydb`.`repuestos_disponibles`;
USE `mydb`;
CREATE  OR REPLACE VIEW `repuestos_disponibles` AS
SELECT I.tBodega_codigo_bodega AS Bodega,
I.tProducto_codigo_oe AS Codigo_oe,
I.cantidad,
I.ubicacion,
P.descripcion,
M.nombre AS Marca
FROM tInventario AS I
INNER JOIN tProducto AS P ON I.tProducto_codigo_oe = codigo_oe
INNER JOIN tMarca AS M ON P.tMarca_codigo_marca = codigo_marca
INNER JOIN tBodega AS B ON codigo_bodega = tBodega_codigo_bodega
WHERE cantidad > 0;

-- -----------------------------------------------------
-- View `mydb`.`Cuentas_por_cobrar`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `mydb`.`Cuentas_por_cobrar`;
USE `mydb`;
CREATE  OR REPLACE VIEW `Cuentas_por_cobrar` AS
WITH P AS(
SELECT tFactura_numero_factura,
SUM(monto) AS pagado
FROM tPago
GROUP BY
tFactura_numero_factura
),

NC AS(
SELECT NC.tFactura_numero_factura,
SUM(((DNC.cantidad * DF.precio_unitario) - (DF.porcentaje_descuento*(DNC.cantidad * DF.precio_unitario)/100))*F.porcentaje_iva/100
+ ((DNC.cantidad * DF.precio_unitario) - (DF.porcentaje_descuento*(DNC.cantidad * DF.precio_unitario)/100))) AS devolucion
FROM tNotaCredito AS NC
INNER JOIN tDetalleNotaCredito AS DNC ON DNC.tNotaCredito_numero_nota = NC.numero_nota
INNER JOIN tFactura AS F ON F.numero_factura= NC.tFactura_numero_factura
INNER JOIN tDetalleFactura AS DF ON DF.tFactura_numero_factura = NC.tFactura_numero_factura
AND DF.tProducto_codigo_oe = DNC.tProducto_codigo_oe
GROUP BY NC.tFactura_numero_factura
)

SELECT C.razon_social AS Nombre_Cliente,
F.numero_factura AS seriefactura,
F.fecha_emision AS fechafactura,
ROUND(SUM(((DF.cantidad * DF.precio_unitario) - (DF.porcentaje_descuento*(DF.cantidad * DF.precio_unitario)/100))*F.porcentaje_iva/100
+ ((DF.cantidad * DF.precio_unitario) - (DF.porcentaje_descuento*(DF.cantidad * DF.precio_unitario)/100))),4) AS Total,
ROUND(SUM(((DF.cantidad * DF.precio_unitario) - (DF.porcentaje_descuento*(DF.cantidad * DF.precio_unitario)/100))*F.porcentaje_iva/100
+ ((DF.cantidad * DF.precio_unitario) - (DF.porcentaje_descuento*(DF.cantidad * DF.precio_unitario)/100))) - COALESCE(P.pagado,0) 
- COALESCE(NC.devolucion,0),4) AS Saldo,
COALESCE(P.pagado,0) AS pagado,
COALESCE(NC.devolucion,0) AS devolucion
FROM tCliente AS C
INNER JOIN tFactura AS F ON F.tCliente_numero_identificacion = C.numero_identificacion
INNER JOIN tDetalleFactura AS DF ON DF.tFactura_numero_factura = F.numero_factura
LEFT JOIN NC ON NC.tFactura_numero_factura = F.numero_factura
LEFT JOIN P ON P.tFactura_numero_factura = F.numero_factura
WHERE F.estado = 'EMITIDA'
GROUP BY
C.razon_social,
F.numero_factura,
F.fecha_emision,
P.pagado,
NC.devolucion
HAVING 
Saldo >= 0.01;

-- -----------------------------------------------------
-- View `mydb`.`Empleados`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `mydb`.`Empleados`;
USE `mydb`;
CREATE  OR REPLACE VIEW `Empleados` AS
SELECT E.cedula,
E.nombres,
E.apellidos,
E.activo,
R.nombre AS Rol,
COUNT(DISTINCT(F.numero_factura)) AS Facturas_emitidas
FROM tEmpleado AS E
INNER JOIN tRol AS R ON E.tRol_codigo_rol = R.codigo_rol
LEFT JOIN tFactura AS F ON F.tEmpleado_codigo_empleado = E.codigo_empleado AND F.estado = 'EMITIDA'
GROUP BY
E.cedula,
E.nombres,
E.apellidos,
E.activo,
R.nombre;

-- -----------------------------------------------------
-- View `mydb`.`Bodegas_Disponibles`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `mydb`.`Bodegas_Disponibles`;
USE `mydb`;
CREATE  OR REPLACE VIEW `Bodegas_Disponibles` AS
SELECT B.codigo_bodega,
B.nombre,
B.direccion,
COALESCE(SUM(I.cantidad),0) AS Cantidad,
COUNT(DISTINCT(I.tProducto_codigo_oe)) AS Productos_Bodega,
COALESCE(SUM(P.precio_venta*I.cantidad),0) AS Valor_Bodega
FROM tBodega AS B
LEFT JOIN tInventario AS I ON I.tBodega_codigo_bodega = B.codigo_bodega AND I.cantidad > 0 
LEFT JOIN tProducto AS P ON P.codigo_oe = I.tProducto_codigo_oe
GROUP BY 
B.codigo_bodega,
B.nombre,
B.direccion;

-- -----------------------------------------------------
-- View `mydb`.`Desempeno_marca`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `mydb`.`Desempeno_marca`;
USE `mydb`;
CREATE  OR REPLACE VIEW `Desempeno_marca` AS
SELECT M.codigo_marca AS Marca_codigo,
M.nombre AS Nombre_Marca,
C.nombre AS Categoria,
ROUND(SUM(((DF.cantidad * DF.precio_unitario) - (DF.porcentaje_descuento*(DF.cantidad * DF.precio_unitario)/100))*F.porcentaje_iva/100
+ ((DF.cantidad * DF.precio_unitario) - (DF.porcentaje_descuento*(DF.cantidad * DF.precio_unitario)/100))),4) AS Venta_Marca
FROM tMarca AS M
INNER JOIN tProducto AS P ON codigo_marca = P.tMarca_codigo_marca
INNER JOIN tDetalleFactura AS DF ON tProducto_codigo_oe = P.codigo_oe
INNER JOIN tFactura AS F ON DF.tFactura_numero_factura = F.numero_factura AND F.estado = 'EMITIDA'
INNER JOIN tCategoria AS C ON P.tCategoria_codigo_categoria = C.codigo_categoria
GROUP BY 
M.codigo_marca,
M.nombre,
C.nombre;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
