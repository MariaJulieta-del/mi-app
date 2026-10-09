# GymTrack — desarrollo y publicación

| Parte | Dónde | Repositorio |
|---|---|---|
| Base de datos | **Supabase** (Postgres) | — |
| Backend (Spring Boot) | **Render** | `MariaJulieta-del/gymtrack` (carpeta `gymtrack-backend`) |
| Frontend (React + Vite) | **Vercel** | `MariaJulieta-del/mi-app` (carpeta `gymtrack-frontend`) |

---

## 1. Desarrollo en la PC

```bash
# Backend (usa la base local gymtrack_db)
cd gymtrack-backend
./mvnw spring-boot:run

# Frontend
cd gymtrack-frontend
npm install
npm run dev
```

Abrí http://localhost:5173. El frontend llama a `/api/...` y Vite lo reenvía al backend (puerto 8080).

### Usarlo desde el celular (misma WiFi)

| Comando | Para qué |
|---|---|
| `npm run dev:red` | Abrir la app en el celular por `http://<IP-de-la-PC>:5173`. Sirve para todo menos el escáner de QR dentro de la app. |
| `npm run dev:celular` | Igual pero con **HTTPS** (`https://<IP-de-la-PC>:5173`). Hace falta para que la cámara escanee el QR. |

- La IP de la PC aparece en la consola al arrancar (línea `Network:`), por ejemplo `192.168.0.103`.
- Con `dev:celular` el navegador del celular avisa que el certificado no es seguro: es un certificado local de prueba. Tocá **Configuración avanzada → Continuar**.
- Si Windows pregunta por el firewall, permití el acceso de **Node.js** en redes privadas.
- El celular no necesita saber nada del backend: Vite reenvía `/api` a `localhost:8080`.

---

## 2. Base de datos en Supabase

1. Creá un proyecto en https://supabase.com (elegí la región más cercana, ej. São Paulo).
2. Guardá la contraseña de la base.
3. **Project Settings → Database → Connection string → Session pooler**. Usá el *pooler* (no la conexión directa: la directa es solo IPv6 y Render no la alcanza).
4. Pasá esa URL al formato JDBC:

   ```
   DB_URL      = jdbc:postgresql://aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require
   DB_USERNAME = postgres.<referencia-del-proyecto>
   DB_PASSWORD = <la contraseña del paso 2>
   ```

**No hace falta crear tablas a mano.** Al arrancar, el backend corre las migraciones de Flyway (`db/migration`) y deja la base lista.

### Pasar los datos de la PC a Supabase (opcional)

Para llevar los socios, pagos y rutinas que ya tenés en la base local, copiá la base completa **antes** de arrancar el backend contra Supabase:

```bash
pg_dump --no-owner --no-privileges -d gymtrack_db > gymtrack.sql
psql "postgresql://postgres.<ref>:<contraseña>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require" -f gymtrack.sql
```

Al arrancar, Flyway reconoce la base existente (la marca como V1) y aplica solo las migraciones nuevas.

---

## 3. Backend en Render

1. https://render.com → **New → Blueprint** → elegí el repositorio `gymtrack`. Toma la configuración de `render.yaml` (Docker, plan gratis, chequeo de salud en `/api/v1/salud`).
2. Completá las variables que pide:

| Variable | Valor |
|---|---|
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | Los de Supabase (paso 2) |
| `CORS_ORIGINS` | La URL de Vercel, ej. `https://gymtrack.vercel.app` |
| `ADMIN_PASSWORD` | Contraseña del primer admin (8+ caracteres, letras y números). **Solo la primera vez** si la base está vacía. |
| `JWT_SECRET` | Render la genera solo |
| `APP_PRODUCCION` | `true` (ya viene) |

3. Cuando termine, probá `https://<tu-servicio>.onrender.com/api/v1/salud` → `{"estado":"ok"}`.
4. Entrá como `admin` y **borrá `ADMIN_PASSWORD`** de las variables.

> El plan gratis de Render "se duerme" tras 15 minutos sin uso y tarda ~1 minuto en despertar. Si la pantalla de recepción está prendida, la mantiene despierta (pide el QR cada 30 s).

---

## 4. Frontend en Vercel

1. https://vercel.com → **Add New → Project** → elegí `mi-app`.
2. **Root Directory:** `gymtrack-frontend` (Vercel detecta Vite).
3. Variable de entorno: `VITE_API_URL = https://<tu-servicio>.onrender.com`
4. Deploy. `vercel.json` ya hace que las rutas (`/socios/…`, `/kiosco`, etc.) funcionen al recargar.
5. Volvé a Render y poné la URL de Vercel en `CORS_ORIGINS`.

Vercel sirve todo con HTTPS, así que el escáner de QR del celular funciona sin configurar nada.

---

## 5. Primer uso en producción

1. Entrá como admin.
2. **Socios → 🔑 PIN pendientes**: genera el PIN de cada socio. Imprimí la lista y entregala.
3. **Acceso → QR de ingreso → Pantallas de recepción → Vincular pantalla**: escaneá el QR con la tablet de la entrada y dejala en pantalla completa.
4. Creá los profesores en **Profesores**.

## Variables de entorno del backend (referencia)

| Variable | Por defecto | Uso |
|---|---|---|
| `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` | base local | Conexión a Postgres |
| `JWT_SECRET` | uno de ejemplo | Firma de sesiones. **Obligatorio** en producción |
| `APP_PRODUCCION` | `false` | `true` exige un `JWT_SECRET` propio |
| `CORS_ORIGINS` | localhost | Dominios del frontend |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | `admin` / vacío | Primer admin (solo si no hay ninguno) |
| `DB_POOL_SIZE` | `5` | Conexiones a la base |
| `DDL_AUTO` | `validate` | Hibernate solo verifica el esquema (lo crea Flyway) |
| `JWT_EXPIRATION_MS` | 24 h | Sesión del staff |
| `MAIL_ENABLED` / `MAIL_USERNAME` / `MAIL_PASSWORD` | `false` | Mails de avisos por SMTP (Gmail u otro). Paso a paso en `gymtrack-backend/CONFIGURAR-MAIL.md` |
| `PORT` | `8080` | Lo define Render |
