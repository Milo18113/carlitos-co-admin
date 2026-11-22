# Conceptos a investigar

13 conceptos del lado de base de datos que usamos o vamos a necesitar y que no aparecen en el material. No repito los 8 del stack que ya están en *Registro de conceptos nuevos* de [planificacion.md](docs/planificacion.md#L199) (Express, `mysql2`, bcrypt, JWT, etc.).

Una limitación de la búsqueda: el código que en las slides está como imagen no se puede buscar como texto. Por eso, para lo práctico, me basé sobre todo en tus `.sql` de clase.

## Ya lo usamos y no se vio en clase

| Concepto | Dónde está | Qué se vio en clase |
|---|---|---|
| `COALESCE` / `IFNULL` | 5 procedures y 2 views | Nada. Ya figura como excepción pendiente en la planificación, pero hoy se usa en muchos más lugares que `v_saldo_por_cobrar` |
| `REGEXP` | `contratar_empleado` (cédula) y `registrar_cliente` (RUC y cédula) | Nada. Lo de clase sería `LIKE` o `CHAR_LENGTH` |
| `TRIM`, `UPPER`, `CHAR_LENGTH`, `CONCAT`, `IF()` | Validaciones y mensajes de todos los procedures | El syllabus menciona "operaciones de cadena", pero no hay ninguna en tus `.sql` |
| `SELECT ... FOR UPDATE` | `registrar_pago`, `eliminar_pago`, `trasladar_repuesto` | Bloqueo exclusivo y pesimista **en teoría** (S14C10), pero no la sintaxis de MySQL |
| Etiqueta en el bloque + `LEAVE proc` como salida temprana | Los 6 procedures | `LEAVE` solo dentro de un `LOOP` (S11C09) |
| `sql_mode` y que el procedure lo guarde al crearse | `procedures.sql` | Nada |
| `utf8mb4` | `schema.sql` | Nada |

## Lo de clase que **no** estamos siguiendo

En clase el patrón es `EXIT HANDLER` con `ROLLBACK; RESIGNAL;`, y los errores de negocio con `SIGNAL SQLSTATE '45000'`. Así aparece en `skeletons.sql`, en el deber 2 y en la práctica del examen 2, y la planificación lo anota como pauta del profe. Nuestros procedures reportan los errores con `SELECT 'ROLLBACK: ...'`. Es la pista 2 que quedó pendiente, y además es algo que el profe puede preguntar en la defensa.

## Lo vamos a necesitar para la nube y la defensa

| Concepto | Por qué | Qué se vio en clase |
|---|---|---|
| Zona horaria del servidor (`time_zone`) | `CURDATE()` en un servidor en UTC rompe la regla de `eliminar_pago` después de las 19:00 hora de Ecuador | Nada |
| Niveles de aislamiento en MySQL (`REPEATABLE READ` por defecto) | Explicar por qué hace falta `FOR UPDATE` | Solo como lectura asignada (Kroenke, págs. 439–440) |
| Deadlock en MySQL (error 1213) y orden fijo de bloqueos | `trasladar_repuesto` cruzado entre dos bodegas | Concepto de deadlock (S14C10), sin el manejo en MySQL |
| `GRANT` y un usuario de la app con permisos mínimos | El API no debería conectarse como root | El syllabus pone seguridad en la semana 14, pero no encontré material |
| `DEFINER` / `SQL SECURITY` | Procedures creados en la nube sin `SUPER`, y permisos del usuario de la app | Nada |
| `mysqldump` | Backup del esquema en la nube; además es el `.sql` que pide la entrega | Backup y roll forward/backward solo en teoría (S11C09) |
| Conexión remota con TLS | Workbench y el API conectándose a Railway o Aiven | Drivers (JDBC/ODBC) en teoría (S14TP01) |

## Recomendación

Los que más conviene investigar primero son estos tres. Los dos primeros se pueden reemplazar por equivalentes vistos en clase:

1. **`COALESCE`/`IFNULL`**: es el más fácil de reemplazar (con un `CASE WHEN ... IS NULL`, si se vio en clase) o de justificar.
2. **`REGEXP`**: es el más fácil de evitar (con `CHAR_LENGTH(x) = 10` más una verificación de que sea numérico).
3. **`FOR UPDATE`**: no tiene alternativa de clase, pero se conecta directo con la teoría de bloqueo pesimista de S14C10, así que es el más fácil de defender.

¿Quieres que agregue estos conceptos como filas *Por investigar* en el *Registro de conceptos nuevos* de [planificacion.md](docs/planificacion.md#L199)?