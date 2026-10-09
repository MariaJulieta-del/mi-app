# Pruebas de punta a punta

Prueban la API real: seguridad, permisos, QR de ingreso, PIN de socios, kiosco, métricas, auditoría.
**Crean datos (socios, pagos, rutinas): correrlas solo contra una base de prueba**, nunca contra la real.

## Cómo correrlas

1. Crear una base vacía y levantar el backend apuntando a ella (Flyway crea las tablas y el admin):

   ```bash
   psql -U postgres -c "CREATE DATABASE gymtrack_test"
   cd gymtrack-backend
   DB_URL=jdbc:postgresql://localhost:5432/gymtrack_test ADMIN_PASSWORD=Admin1234 PORT=8081 ./mvnw spring-boot:run
   ```

2. En otra terminal:

   ```bash
   E2E_API=http://localhost:8081/api/v1 node pruebas-e2e/todas.mjs
   ```

Variables: `E2E_API` (URL de la API), `E2E_ADMIN_USER` y `E2E_ADMIN_PASS` (por defecto `admin` / `Admin1234`).

3. Al terminar, borrar la base: `psql -U postgres -c "DROP DATABASE gymtrack_test"`.

## Probar los mails (sin mandar mails de verdad)

`smtp-trucho.mjs` es un servidor de mail falso: acepta todo y lo guarda en `pruebas-e2e/mails-recibidos.json`.

1. Levantar el servidor trucho:

   ```bash
   node pruebas-e2e/smtp-trucho.mjs
   ```

2. Levantar el backend de prueba apuntando a él:

   ```bash
   cd gymtrack-backend
   DB_URL=jdbc:postgresql://localhost:5432/gymtrack_test ADMIN_PASSWORD=Admin1234 PORT=8081 MAIL_ENABLED=true MAIL_HOST=localhost MAIL_PORT=2525 MAIL_SMTP_AUTH=false MAIL_STARTTLS=false ./mvnw spring-boot:run
   ```

3. Correr la prueba (o mandar avisos desde la app y mirar el archivo):

   ```bash
   E2E_API=http://localhost:8081/api/v1 node pruebas-e2e/mails.mjs
   ```
