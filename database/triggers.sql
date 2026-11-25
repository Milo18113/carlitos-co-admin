-- =====================================================================
--  Triggers del proyecto (repuestos_bdd)
--
--  Regla del proyecto (planificacion.md): trigger solo para lo que tiene
--  que pasar SIEMPRE que cambia una tabla; los flujos que inicia el
--  usuario (vender, pagar, trasladar) van en procedures.
--
--  Los procedures ya validan todo esto antes de escribir, asi que en el
--  uso normal estos triggers no se disparan: son la red de seguridad para
--  cualquier INSERT o UPDATE hecho fuera de un procedure (Workbench,
--  datos.sql o un error futuro en un procedure).
--
--  Los errores usan SIGNAL SQLSTATE '45000' (pauta del profe). Un trigger
--  no puede devolver un SELECT, asi que aqui no se usa el aviso
--  'ROLLBACK: ...' de los procedures. Si el SIGNAL salta dentro de un
--  procedure, lo atrapa su EXIT HANDLER: hace ROLLBACK y devuelve su
--  mensaje generico de "error de SQL".
--
--  Orden de carga: schema.sql, views.sql, procedures.sql, triggers.sql y
--  al final datos.sql, para que los triggers tambien revisen los datos.
-- =====================================================================

-- Cada trigger guarda el sql_mode activo al crearse, igual que los procedures.
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- trigger trg_inventario_no_negativo
--   El stock de una bodega nunca queda negativo.
--   MySQL pide un trigger por evento: este cubre UPDATE (ventas y
--   traslados restan con UPDATE) y el de abajo cubre INSERT.
-- -----------------------------------------------------

DELIMITER $$
USE `repuestos_bdd`$$
DROP TRIGGER IF EXISTS `trg_inventario_no_negativo`$$
CREATE TRIGGER trg_inventario_no_negativo
BEFORE UPDATE ON tInventario
FOR EACH ROW
BEGIN
DECLARE v_mensaje VARCHAR(255);

IF NEW.cantidad < 0 THEN
SET v_mensaje = CONCAT('El stock de ', NEW.tProducto_codigo_oe, ' en la bodega ',
NEW.tBodega_codigo_bodega, ' quedaria en ', NEW.cantidad,
'; hay ', OLD.cantidad, ' unidad(es)');
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_mensaje;
END IF;
END$$

DELIMITER ;

-- -----------------------------------------------------
-- trigger trg_inventario_no_negativo_ins
-- -----------------------------------------------------

DELIMITER $$
USE `repuestos_bdd`$$
DROP TRIGGER IF EXISTS `trg_inventario_no_negativo_ins`$$
CREATE TRIGGER trg_inventario_no_negativo_ins
BEFORE INSERT ON tInventario
FOR EACH ROW
BEGIN
DECLARE v_mensaje VARCHAR(255);

IF NEW.cantidad < 0 THEN
SET v_mensaje = CONCAT('No se puede registrar ', NEW.cantidad, ' unidad(es) de ',
NEW.tProducto_codigo_oe, ' en la bodega ', NEW.tBodega_codigo_bodega,
'; el stock no puede ser negativo');
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_mensaje;
END IF;
END$$

DELIMITER ;

-- -----------------------------------------------------
-- trigger trg_cliente_fecha_modificacion
--   Cualquier UPDATE de un cliente deja la fecha de hoy en
--   fecha_modificacion, aunque se haga fuera de registrar_cliente.
--   Los INSERT no la tocan: un cliente nuevo queda con NULL.
--   CURDATE() usa la zona horaria de la sesion: por eso el servidor
--   tiene que estar en -05:00 (config_railway.sql).
-- -----------------------------------------------------

DELIMITER $$
USE `repuestos_bdd`$$
DROP TRIGGER IF EXISTS `trg_cliente_fecha_modificacion`$$
CREATE TRIGGER trg_cliente_fecha_modificacion
BEFORE UPDATE ON tCliente
FOR EACH ROW
BEGIN
SET NEW.fecha_modificacion = CURDATE();
END$$

DELIMITER ;

-- -----------------------------------------------------
-- trigger trg_detalle_factura_valida
--   Cada linea nueva de una factura tiene que tener cantidad mayor que 0,
--   precio mayor que 0 y descuento de 0 a 100, y solo se agregan lineas
--   a una factura EMITIDA (no a una ANULADA).
--   Ojo en datos.sql: una factura ANULADA de prueba se inserta como
--   EMITIDA, se le cargan las lineas y despues se cambia a ANULADA.
--   El stock no se valida aqui: tDetalleFactura no guarda la bodega, asi
--   que el trigger no sabe de que fila de tInventario descontar. Eso lo
--   hace emitir_factura.
-- -----------------------------------------------------

DELIMITER $$
USE `repuestos_bdd`$$
DROP TRIGGER IF EXISTS `trg_detalle_factura_valida`$$
CREATE TRIGGER trg_detalle_factura_valida
BEFORE INSERT ON tDetalleFactura
FOR EACH ROW
BEGIN
DECLARE v_mensaje VARCHAR(255);
DECLARE v_estado VARCHAR(45);

IF NEW.cantidad <= 0 THEN
SET v_mensaje = CONCAT('Factura ', NEW.tFactura_numero_factura, ', repuesto ',
NEW.tProducto_codigo_oe, ': la cantidad debe ser mayor que 0');
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_mensaje;
END IF;

IF NEW.precio_unitario <= 0 THEN
SET v_mensaje = CONCAT('Factura ', NEW.tFactura_numero_factura, ', repuesto ',
NEW.tProducto_codigo_oe, ': el precio unitario debe ser mayor que 0');
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_mensaje;
END IF;

IF NEW.porcentaje_descuento < 0 OR NEW.porcentaje_descuento > 100 THEN
SET v_mensaje = CONCAT('Factura ', NEW.tFactura_numero_factura, ', repuesto ',
NEW.tProducto_codigo_oe, ': el descuento va de 0 a 100 y llego ',
NEW.porcentaje_descuento);
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_mensaje;
END IF;

-- Si la factura no existe, v_estado queda NULL y el error lo da la FK.
SET v_estado = (SELECT estado FROM tFactura
WHERE numero_factura = NEW.tFactura_numero_factura);

IF v_estado <> 'EMITIDA' THEN
SET v_mensaje = CONCAT('La factura ', NEW.tFactura_numero_factura, ' esta ', v_estado,
'; solo se agregan lineas a una factura EMITIDA');
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_mensaje;
END IF;
END$$

DELIMITER ;

SET SQL_MODE=@OLD_SQL_MODE;

-- =====================================================================
--  PRUEBAS en Workbench. Ejecuta una linea a la vez con Ctrl+Enter.
--  Todo va dentro de una transaccion: el ROLLBACK del final borra los
--  datos de prueba ('ZZ...'), asi que se puede correr con datos reales.
--  Cada error esperado es el 1644 con el mensaje del trigger.
-- =====================================================================
-- START TRANSACTION;
-- INSERT INTO tCategoria VALUES ('ZZ', 'Prueba triggers');
-- INSERT INTO tMarca VALUES ('ZZ', 'Prueba triggers');
-- INSERT INTO tBodega VALUES ('ZZ', 'Prueba triggers', 'N/A');
-- INSERT INTO tProducto VALUES ('ZZ-001', 'Repuesto de prueba', 10.00, 1, 'ZZ', 'ZZ');
-- INSERT INTO tTipoIdentificacion VALUES ('ZZ', 'Prueba triggers');
-- INSERT INTO tCliente VALUES ('ZZ00000001', 'CLIENTE PRUEBA', NULL, NULL, NULL, '2026-01-01', NULL, 'ZZ', NULL);
-- INSERT INTO tRol VALUES (99, 'PRUEBA');
-- INSERT INTO tEmpleado VALUES ('ZZ-E', '0000000099', 'Prueba', 'Triggers', 'zz_prueba', REPEAT('x', 60), 1, 99);
-- INSERT INTO tFactura VALUES ('ZZ-F1', CURDATE(), 15, 'EMITIDA', 'ZZ00000001', 'ZZ-E'), ('ZZ-F2', CURDATE(), 15, 'ANULADA', 'ZZ00000001', 'ZZ-E');
--
-- -- trg_inventario_no_negativo(_ins)
-- INSERT INTO tInventario VALUES ('ZZ', 'ZZ-001', -2, NULL);                    -- error 1644
-- INSERT INTO tInventario VALUES ('ZZ', 'ZZ-001', 3, NULL);                     -- OK
-- UPDATE tInventario SET cantidad = cantidad - 5 WHERE tBodega_codigo_bodega = 'ZZ' AND tProducto_codigo_oe = 'ZZ-001';  -- error 1644: quedaria en -2
-- UPDATE tInventario SET cantidad = cantidad - 3 WHERE tBodega_codigo_bodega = 'ZZ' AND tProducto_codigo_oe = 'ZZ-001';  -- OK, queda en 0
--
-- -- trg_cliente_fecha_modificacion
-- UPDATE tCliente SET telefono = '0990000000' WHERE numero_identificacion = 'ZZ00000001';
-- SELECT fecha_registro, fecha_modificacion FROM tCliente WHERE numero_identificacion = 'ZZ00000001';  -- 2026-01-01 y la fecha de hoy
--
-- -- trg_detalle_factura_valida
-- INSERT INTO tDetalleFactura VALUES ('ZZ-001', 'ZZ-F1', 0, 10.00, 0);          -- error 1644: cantidad
-- INSERT INTO tDetalleFactura VALUES ('ZZ-001', 'ZZ-F1', 1, 0.00, 0);           -- error 1644: precio
-- INSERT INTO tDetalleFactura VALUES ('ZZ-001', 'ZZ-F1', 1, 10.00, 150);        -- error 1644: descuento
-- INSERT INTO tDetalleFactura VALUES ('ZZ-001', 'ZZ-F2', 1, 10.00, 0);          -- error 1644: factura ANULADA
-- INSERT INTO tDetalleFactura VALUES ('ZZ-001', 'ZZ-F1', 1, 10.00, 10);         -- OK
--
-- ROLLBACK;
-- SELECT COUNT(*) FROM tProducto WHERE codigo_oe = 'ZZ-001';                    -- 0: no quedo nada
