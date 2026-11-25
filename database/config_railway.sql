-- =====================================================================
--  Configuracion del servidor MySQL en Railway
--
--  Se corre UNA sola vez, conectado como root, despues de cargar
--  schema.sql, views.sql, procedures.sql y triggers.sql. No es parte de
--  la reconstruccion de la base (los 5 archivos): configura el servidor.
--
--  OJO con la clave: el repo es publico. Reemplaza CAMBIAR_CLAVE solo en
--  la pestana de Workbench, ejecuta y cierra la pestana sin guardar.
--  La clave real se la pasas a Milo por privado y va en su .env.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Revisar el servidor (anota el resultado)
-- ---------------------------------------------------------------------
SELECT VERSION()                          AS version,
       NOW()                              AS hora_servidor,
       @@global.time_zone                 AS zona_global,
       @@system_time_zone                 AS zona_sistema,
       @@log_bin                          AS binlog_activo,
       @@log_bin_trust_function_creators  AS trust_function_creators,
       @@lower_case_table_names           AS minusculas_tablas,
       @@require_secure_transport         AS exige_tls;

-- Si Ssl_cipher sale con un valor, esta conexion de Workbench ya va cifrada.
SHOW SESSION STATUS LIKE 'Ssl_cipher';

--  Como leerlo:
--  * binlog_activo = 1 y trust_function_creators = 0 es lo normal y NO hay
--    que cambiarlo: como root se crean procedures y triggers igual. Solo
--    una FUNCTION nueva necesita declarar READS SQL DATA o DETERMINISTIC
--    (si no, error 1418).
--  * minusculas_tablas = 0: en Linux los nombres de tablas y vistas
--    distinguen mayusculas. tFactura y tfactura son distintos, y la vista
--    es Cuentas_por_cobrar, no cuentas_por_cobrar. En Windows (=1) eso no
--    falla, por eso hay que probar contra Railway.
--  * exige_tls = 0: la conexion acepta TLS pero no lo exige.

-- ---------------------------------------------------------------------
-- 2. Hora de Ecuador para todo el servidor
--    CURDATE() la usan eliminar_pago, registrar_pago, emitir_factura y
--    trg_cliente_fecha_modificacion. Con el servidor en UTC, despues de
--    las 19:00 de Quito ya seria "manana".
--    Ecuador no tiene horario de verano, asi que basta el desfase fijo.
--    SET PERSIST lo guarda en el volumen: sobrevive a reinicios y vale
--    para todas las conexiones (Workbench y el pool del API).
-- ---------------------------------------------------------------------
SET PERSIST time_zone = '-05:00';
SET time_zone = '-05:00';   -- esta pestana ya estaba abierta; las nuevas lo toman solas

SELECT NOW() AS hora_quito, CURDATE() AS hoy, @@global.time_zone AS zona_global;

-- ---------------------------------------------------------------------
-- 3. Usuario de la app con permisos minimos
--    SELECT: leer tablas y vistas (listados, reportes, login).
--    EXECUTE: llamar los procedures. Toda escritura pasa por ellos: el
--    procedure corre con los permisos de quien lo creo (root, SQL
--    SECURITY DEFINER por defecto), asi que el usuario de la app no
--    necesita INSERT, UPDATE ni DELETE.
--    '%' porque las conexiones llegan por el proxy de Railway.
-- ---------------------------------------------------------------------
DROP USER IF EXISTS 'carlitos_app'@'%';
CREATE USER 'carlitos_app'@'%' IDENTIFIED BY 'CAMBIAR_CLAVE';
GRANT SELECT, EXECUTE ON repuestos_bdd.* TO 'carlitos_app'@'%';

SHOW GRANTS FOR 'carlitos_app'@'%';

-- ---------------------------------------------------------------------
-- 4. Prueba del usuario: crea otra conexion en Workbench con
--    carlitos_app y corre estas lineas una por una.
-- ---------------------------------------------------------------------
-- SELECT COUNT(*) FROM repuestos_bdd.tCliente;                 -- OK
-- SELECT * FROM repuestos_bdd.Cuentas_por_cobrar;             -- OK (puede salir vacia)
-- CALL repuestos_bdd.registrar_pago('X', 'NO-EXISTE', 1, '01', NULL);   -- OK: devuelve 'ROLLBACK: la factura NO-EXISTE no existe'
-- INSERT INTO repuestos_bdd.tMarca VALUES ('X', 'X');          -- error 1142: INSERT denegado
-- DELETE FROM repuestos_bdd.tPago;                             -- error 1142: DELETE denegado
