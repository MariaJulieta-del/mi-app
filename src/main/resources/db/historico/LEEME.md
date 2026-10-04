# Migraciones históricas (no se ejecutan)

Estas eran las migraciones originales del proyecto. Flyway estaba desactivado y el esquema
lo mantenía Hibernate (`ddl-auto=update`), así que quedaron desactualizadas y algunas tienen
errores (por ejemplo `V15` usa `AUTO_INCREMENT`, que es de MySQL).

Se reemplazaron por `db/migration/V1__esquema_inicial.sql`. Quedan acá solo como referencia:
Flyway lee únicamente `classpath:db/migration`.
