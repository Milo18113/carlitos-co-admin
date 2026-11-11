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


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
