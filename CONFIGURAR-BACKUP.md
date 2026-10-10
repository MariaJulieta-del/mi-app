# Copias de seguridad automáticas (PB-20)

El backend hace una copia de toda la base **cada 24 horas** y guarda las **últimas 14**.
Se ve y se descarga en **Gimnasio › Copias de seguridad** (solo el admin), donde también hay un botón para hacer una al momento.

Cada copia es un `.zip` con:

- `datos/*.csv`: una tabla por archivo, todas sacadas de la misma foto de la base (coherentes entre sí).
- `manifest.json`: fecha, versión del esquema y filas por tabla.
- `restaurar.sql` y `LEEME.txt`: cómo volver a cargarla con `psql`.

No se copian `flyway_schema_history` (el esquema lo crea Flyway) ni `tokens_revocados` (sesiones cerradas).

> La copia tiene datos personales de los socios y las contraseñas cifradas del staff. Guardala en un lugar privado.

## Dónde se guardan

| Configuración | Destino | Para qué |
|---|---|---|
| Sin nada | Carpeta `backups/` del servidor (`BACKUP_DIR`) | Desarrollo o una PC/VPS propia |
| `BACKUP_SUPABASE_URL` + `BACKUP_SUPABASE_KEY` | Bucket privado de Supabase Storage | **Producción en Render** |

**En Render la carpeta del servidor se borra en cada reinicio o deploy**, así que en producción hay que usar Supabase Storage.
Si no está configurado, la pantalla lo advierte.

### Configurar Supabase Storage

1. En Supabase: **Storage › New bucket** → nombre `backups`, **sin** marcar *Public bucket*.
2. En **Project Settings › API** copiar la *Project URL* y la clave **service_role** (es secreta: solo va en el backend).
3. En Render, en las variables de entorno del backend:

   ```
   BACKUP_SUPABASE_URL=https://xxxxxxxx.supabase.co
   BACKUP_SUPABASE_KEY=<clave service_role>
   BACKUP_BUCKET=backups
   ```

4. Redeploy. En Gimnasio › Copias de seguridad tocar **Hacer una copia ahora** y verificar que diga *Correcta*.

## Otras variables

| Variable | Por defecto | Qué hace |
|---|---|---|
| `BACKUP_ENABLED` | `true` | Apaga las copias automáticas (el botón manual sigue andando) |
| `BACKUP_CADA_HORAS` | `24` | Cada cuántas horas se hace una copia |
| `BACKUP_RETENER` | `14` | Cuántas copias se guardan (las más viejas se borran solas) |
| `BACKUP_AVISO_MAIL` | (vacío) | Mail al que se avisa si una copia falla (necesita el mail configurado, ver CONFIGURAR-MAIL.md) |

## Cuándo corre

Cada hora el backend se fija si pasaron más de `BACKUP_CADA_HORAS` desde la última copia buena; si pasaron, la hace.
Así, aunque el servidor de Render (plan gratis) se haya dormido por falta de uso, la copia sale apenas se despierta.
Si falla, se reintenta a la hora siguiente y queda registrado en la pantalla (y por mail si está `BACKUP_AVISO_MAIL`).

## Restaurar

1. Crear una base vacía (o usar la de Supabase, sabiendo que **se reemplaza todo**).
2. Levantar el backend una vez contra esa base para que Flyway cree las tablas (misma versión del sistema que la copia: figura en `manifest.json`).
3. Apagar el backend, descomprimir el zip y, **desde esa carpeta**, correr:

   ```bash
   psql "postgresql://postgres:CLAVE@db.xxxxxxxx.supabase.co:5432/postgres" -f restaurar.sql
   ```

   En Supabase usar la **conexión directa** (puerto 5432), no el pooler.
4. Volver a levantar el backend.

Todo va en una transacción: si algo falla, no se cambia nada.

## Además

Supabase también hace sus propios backups diarios en los planes pagos (Database › Backups).
Las copias de GymTrack sirven igual en el plan gratis, y además se pueden descargar y guardar fuera de Supabase.
