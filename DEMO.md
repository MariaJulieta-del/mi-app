# Demo pública de GymTrack — paso a paso

La demo es **otra copia del sistema, separada de producción**: su propia base de datos (Supabase), su propio
servidor (Render) y su propio frontend (Vercel), todos publicados desde la rama **`demo`**. No toca los datos reales.

- Se entra **sin contraseña**: la pantalla de entrada tiene "Entrar a la demo" (la dueña), "Probar la app del socio" y "Entrar como profesor".
- Los datos de prueba (Gimnasio Demo, socios "… Demo") se **recargan solos** cada vez que arranca el servidor y **todas las madrugadas a las 5**,
  con las fechas corridas al día de hoy (nada aparece vencido de más).
- Está bloqueado lo que rompería la demo para el próximo visitante: cambiar contraseñas o PIN, crear o tocar usuarios del personal,
  y borrar o dar de baja al socio de la demo. Los enlaces de WhatsApp no se abren (los teléfonos de prueba no son de nadie).
- El QR impreso apunta a **la app real + `/demo`** (`https://mi-app-mu-livid.vercel.app/demo`), que redirige a la demo.
  Así se pudo imprimir antes y se puede cambiar la demo sin reimprimir nada.

> Las claves (contraseña de la base, etc.) se pegan **solo** en el panel de cada servicio. Nunca en el chat ni en el repositorio.

---

## 1 · Base de datos: un proyecto nuevo en Supabase

1. supabase.com → **New project**.
   - Nombre: `gymtrack-demo`
   - Región: **South America (São Paulo)**
   - Database password: generá una y guardala en tu gestor de contraseñas (la vas a pegar en Render).
2. Cuando termine de crearse: **Connect** (arriba) → pestaña **Connection string** → tipo **JDBC** → modo **Session pooler**.
   Vas a ver algo así (con tus datos):
   `jdbc:postgresql://aws-0-sa-east-1.pooler.supabase.com:5432/postgres?user=postgres.XXXX&password=[YOUR-PASSWORD]`
   - **DB_URL** = la parte hasta `/postgres`, agregando `?sslmode=require`
     → `jdbc:postgresql://aws-0-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require`
   - **DB_USERNAME** = `postgres.XXXX` (lo que está después de `user=`)
   - **DB_PASSWORD** = la contraseña del paso 1

No hay que crear tablas: el servidor las crea solo al arrancar (Flyway) y después carga los datos de prueba.

## 2 · Servidor: un servicio nuevo en Render

1. render.com → **New → Web Service** → elegí el repositorio **mi-app**.
2. Configuración:
   - Name: `gymtrack-demo`
   - Branch: **`demo`**
   - Root Directory: **`gymtrack-backend`**
   - Runtime / Language: **Docker** (usa el Dockerfile de esa carpeta)
   - Region: **Virginia (US East)** (la misma que producción)
   - Instance type: **Free**
   - Health Check Path (en Advanced): `/api/v1/salud`
3. **Environment variables** (Advanced → Add environment variable):

   | Variable | Valor |
   |---|---|
   | `DEMO_MODE` | `true` |
   | `DB_URL` | la del paso 1 |
   | `DB_USERNAME` | la del paso 1 |
   | `DB_PASSWORD` | la del paso 1 |
   | `JWT_SECRET` | tocá **Generate** (un valor largo al azar) |
   | `APP_PRODUCCION` | `true` |
   | `BACKUP_ENABLED` | `false` |
   | `DB_POOL_SIZE` | `5` |
   | `JAVA_TOOL_OPTIONS` | `-Duser.timezone=America/Argentina/Cordoba` |
   | `CORS_ORIGINS` | la URL de Vercel del paso 3 (la cargás cuando la tengas, ej. `https://gymtrack-demo.vercel.app`) |

4. **Create Web Service**. La primera vez tarda unos minutos. Cuando diga *Live*, abrí
   `https://gymtrack-demo-XXXX.onrender.com/api/v1/salud` → tiene que decir `{"estado":"ok"}`.
   En **Logs** tiene que aparecer: `[Demo] Datos de prueba recargados`.

## 3 · Frontend: un proyecto nuevo en Vercel

1. vercel.com → **Add New → Project** → importá **mi-app** otra vez (es un proyecto aparte del de producción).
2. Configuración:
   - Project Name: `gymtrack-demo`
   - Root Directory: **`gymtrack-frontend`**
   - Framework: Vite (lo detecta solo)
3. **Environment Variables**:

   | Variable | Valor |
   |---|---|
   | `VITE_DEMO` | `true` |
   | `VITE_API_URL` | la URL de Render del paso 2, **sin barra al final** (ej. `https://gymtrack-demo-XXXX.onrender.com`) |

4. **Deploy**. Después: Project → **Settings → Git → Production Branch** = **`demo`** y volvé a publicar
   (Deployments → los tres puntos del último → **Redeploy**).
5. Volvé a Render y cargá `CORS_ORIGINS` con la URL de este proyecto (ej. `https://gymtrack-demo.vercel.app`). Render se reinicia solo.

## 4 · Conectar el QR impreso con la demo

En el proyecto de Vercel **de producción** (el de `mi-app-mu-livid.vercel.app`):
**Settings → Environment Variables** → agregá `VITE_DEMO_URL` = la URL de la demo del paso 3 → **Redeploy**.
Desde ese momento `https://mi-app-mu-livid.vercel.app/demo` redirige a la demo (es lo que abre el QR del póster y el tríptico).

> Para eso la app de producción tiene que tener el cambio "Dirección fija /demo" (está en la rama `mejoras-seguridad-y-deploy`
> y hay que pasarlo a `master`).

## 5 · Límites de los planes gratis y el día de la muestra

- **Render Free**: el servidor **se duerme después de 15 minutos sin uso** y tarda **~1 minuto en despertar** (la pantalla de la demo
  lo avisa: "Despertando el servidor…"). Hay **750 horas gratis por mes para toda la cuenta**: si producción y la demo
  estuvieran despiertas todo el mes serían ~1.490 horas, así que **la demo no se mantiene despierta siempre**, solo el día de la muestra.
  Además los servicios gratis se reinician de vez en cuando: no pasa nada, la demo recarga sus datos al arrancar.
- **Supabase Free**: hasta 2 proyectos activos y 500 MB por base (la demo usa unos pocos MB). Un proyecto **se pausa si pasa
  una semana sin uso**: si eso pasa, entrá a Supabase y tocá **Restore project** (tarda unos minutos). Conviene abrir la demo
  un par de días antes del 29.
- **Vercel Hobby**: sin problemas para este uso.

**Mantenerla despierta el día de la muestra (29/10)** sin pasarse del límite, con **cron-job.org** (el mismo que ya usás para producción):
1. Create cronjob → URL: `https://gymtrack-demo-XXXX.onrender.com/api/v1/salud`
2. Schedule: **cada 10 minutos**, solo el **29 de octubre**, de **8 a 22 h** (Advanced/Custom: minutos `*/10`, horas `8-22`, día `29`, mes `10`).
3. Son ~15 horas: no afecta las 750 horas del mes. Después de la muestra, desactivalo.

**El mismo día, antes de abrir el stand:** escaneá el QR con tu celular, tocá "Entrar a la demo" y esperá que cargue.
Si querés que la demo arranque "limpia", en Render → **Manual Deploy → Restart service** (recarga los datos de prueba).
