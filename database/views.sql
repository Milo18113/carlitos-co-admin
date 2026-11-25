SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- View `repuestos_bdd`.`repuestos_disponibles`
-- -----------------------------------------------------
USE `repuestos_bdd`;
CREATE OR REPLACE VIEW `repuestos_disponibles` AS
    SELECT 
        I.tBodega_codigo_bodega AS Bodega,
        I.tProducto_codigo_oe AS Codigo_oe,
        I.cantidad,
        I.ubicacion,
        P.descripcion,
        M.nombre AS Marca
    FROM
        tInventario AS I
            INNER JOIN
        tProducto AS P ON I.tProducto_codigo_oe = codigo_oe
            INNER JOIN
        tMarca AS M ON P.tMarca_codigo_marca = codigo_marca
            INNER JOIN
        tBodega AS B ON codigo_bodega = tBodega_codigo_bodega
    WHERE
        cantidad > 0;

-- -----------------------------------------------------
-- View `repuestos_bdd`.`Cuentas_por_cobrar`
-- -----------------------------------------------------
USE `repuestos_bdd`;
-- Pagos (P) y devoluciones (NC) se suman primero por factura en subconsultas
-- dentro del FROM: asi cada factura trae una sola fila de cada una y el SUM
-- del detalle no se multiplica. Antes eran un WITH (CTE); el editor de
-- Workbench marca el WITH dentro de CREATE VIEW como error de sintaxis.
CREATE OR REPLACE VIEW `Cuentas_por_cobrar` AS
    SELECT 
        C.razon_social AS Nombre_Cliente,
        F.numero_factura AS seriefactura,
        F.fecha_emision AS fechafactura,
        ROUND(SUM(((DF.cantidad * DF.precio_unitario) - (DF.porcentaje_descuento * (DF.cantidad * DF.precio_unitario) / 100)) * F.porcentaje_iva / 100 + ((DF.cantidad * DF.precio_unitario) - (DF.porcentaje_descuento * (DF.cantidad * DF.precio_unitario) / 100))),
                2) AS Total,
        ROUND(SUM(((DF.cantidad * DF.precio_unitario) - (DF.porcentaje_descuento * (DF.cantidad * DF.precio_unitario) / 100)) * F.porcentaje_iva / 100 + ((DF.cantidad * DF.precio_unitario) - (DF.porcentaje_descuento * (DF.cantidad * DF.precio_unitario) / 100))) - COALESCE(P.pagado, 0) - COALESCE(NC.devolucion, 0),
                2) AS Saldo,
        COALESCE(P.pagado, 0) AS pagado,
        ROUND(COALESCE(NC.devolucion, 0), 2) AS devolucion
    FROM
        tCliente AS C
            INNER JOIN
        tFactura AS F ON F.tCliente_numero_identificacion = C.numero_identificacion
            INNER JOIN
        tDetalleFactura AS DF ON DF.tFactura_numero_factura = F.numero_factura
            LEFT JOIN
        (SELECT 
            NCR.tFactura_numero_factura,
                SUM(((DNC.cantidad * DFN.precio_unitario) - (DFN.porcentaje_descuento * (DNC.cantidad * DFN.precio_unitario) / 100)) * FN.porcentaje_iva / 100 + ((DNC.cantidad * DFN.precio_unitario) - (DFN.porcentaje_descuento * (DNC.cantidad * DFN.precio_unitario) / 100))) AS devolucion
        FROM
            tNotaCredito AS NCR
        INNER JOIN tDetalleNotaCredito AS DNC ON DNC.tNotaCredito_numero_nota = NCR.numero_nota
        INNER JOIN tFactura AS FN ON FN.numero_factura = NCR.tFactura_numero_factura
        INNER JOIN tDetalleFactura AS DFN ON DFN.tFactura_numero_factura = NCR.tFactura_numero_factura
            AND DFN.tProducto_codigo_oe = DNC.tProducto_codigo_oe
        GROUP BY NCR.tFactura_numero_factura) AS NC ON NC.tFactura_numero_factura = F.numero_factura
            LEFT JOIN
        (SELECT 
            tFactura_numero_factura, SUM(monto) AS pagado
        FROM
            tPago
        GROUP BY tFactura_numero_factura) AS P ON P.tFactura_numero_factura = F.numero_factura
    WHERE
        F.estado = 'EMITIDA'
    GROUP BY C.razon_social , F.numero_factura , F.fecha_emision , P.pagado , NC.devolucion
    HAVING Saldo >= 0.01;

-- -----------------------------------------------------
-- View `repuestos_bdd`.`Empleados`
-- -----------------------------------------------------
USE `repuestos_bdd`;
-- codigo_empleado: el boton "Dar de baja" llama a
-- dar_baja_empleado(codigo_empleado), y la cedula no sirve para eso.
-- El usuario de inicio de sesion NO va en la vista, por seguridad: la vista
-- la lee cualquier empleado con sesion desde el reporte de empleados.
CREATE OR REPLACE VIEW `Empleados` AS
    SELECT 
        E.codigo_empleado,
        E.cedula,
        E.nombres,
        E.apellidos,
        E.activo,
        R.nombre AS Rol,
        COUNT(DISTINCT (F.numero_factura)) AS Facturas_emitidas
    FROM
        tEmpleado AS E
            INNER JOIN
        tRol AS R ON E.tRol_codigo_rol = R.codigo_rol
            LEFT JOIN
        tFactura AS F ON F.tEmpleado_codigo_empleado = E.codigo_empleado
            AND F.estado = 'EMITIDA'
    GROUP BY E.codigo_empleado , E.cedula , E.nombres , E.apellidos , E.activo , R.nombre;

-- -----------------------------------------------------
-- View `repuestos_bdd`.`Bodegas_Disponibles`
-- -----------------------------------------------------
USE `repuestos_bdd`;
CREATE OR REPLACE VIEW `Bodegas_Disponibles` AS
    SELECT 
        B.codigo_bodega,
        B.nombre,
        B.direccion,
        COALESCE(SUM(I.cantidad), 0) AS Cantidad,
        COUNT(DISTINCT (I.tProducto_codigo_oe)) AS Productos_Bodega,
        COALESCE(SUM(P.precio_venta * I.cantidad), 0) AS Valor_Bodega
    FROM
        tBodega AS B
            LEFT JOIN
        tInventario AS I ON I.tBodega_codigo_bodega = B.codigo_bodega
            AND I.cantidad > 0
            LEFT JOIN
        tProducto AS P ON P.codigo_oe = I.tProducto_codigo_oe
    GROUP BY B.codigo_bodega , B.nombre , B.direccion;

-- -----------------------------------------------------
-- View `repuestos_bdd`.`Desempeno_marca`
-- -----------------------------------------------------
USE `repuestos_bdd`;
CREATE OR REPLACE VIEW `Desempeno_marca` AS
    SELECT 
        M.codigo_marca AS Marca_codigo,
        M.nombre AS Nombre_Marca,
        C.nombre AS Categoria,
        ROUND(SUM(((DF.cantidad * DF.precio_unitario) - (DF.porcentaje_descuento * (DF.cantidad * DF.precio_unitario) / 100)) * F.porcentaje_iva / 100 + ((DF.cantidad * DF.precio_unitario) - (DF.porcentaje_descuento * (DF.cantidad * DF.precio_unitario) / 100))),
                4) AS Venta_Marca
    FROM
        tMarca AS M
            INNER JOIN
        tProducto AS P ON codigo_marca = P.tMarca_codigo_marca
            INNER JOIN
        tDetalleFactura AS DF ON tProducto_codigo_oe = P.codigo_oe
            INNER JOIN
        tFactura AS F ON DF.tFactura_numero_factura = F.numero_factura
            AND F.estado = 'EMITIDA'
            INNER JOIN
        tCategoria AS C ON P.tCategoria_codigo_categoria = C.codigo_categoria
    GROUP BY M.codigo_marca , M.nombre , C.nombre;

SET SQL_MODE=@OLD_SQL_MODE;