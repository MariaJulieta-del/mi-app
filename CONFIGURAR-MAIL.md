# Configurar el mail del gimnasio

GymTrack manda los avisos por mail con una casilla común (Gmail, Outlook o la del dominio
del gimnasio). No hace falta Resend ni ningún servicio pago.

Hasta que lo configures, los avisos se siguen viendo en la app y se pueden mandar por WhatsApp.
En **Notificaciones** aparece "Mail sin configurar" mientras tanto.

## Con Gmail (lo más simple)

1. Creá la casilla del gimnasio (por ejemplo `gimnasio.avisos@gmail.com`).
2. En esa cuenta activá la **verificación en dos pasos**:
   Cuenta de Google › Seguridad › Verificación en dos pasos.
3. Creá una **contraseña de aplicación**:
   Cuenta de Google › Seguridad › Contraseñas de aplicaciones → nombre "GymTrack".
   Google te muestra 16 letras: esa es la contraseña que va en `MAIL_PASSWORD`
   (no la contraseña normal de la cuenta).
4. En **Render** › tu servicio del backend › **Environment**, agregá:

   | Variable        | Valor                                                    |
   |-----------------|----------------------------------------------------------|
   | `MAIL_ENABLED`  | `true`                                                   |
   | `MAIL_USERNAME` | `gimnasio.avisos@gmail.com`                              |
   | `MAIL_PASSWORD` | las 16 letras de la contraseña de aplicación (sin espacios) |
   | `MAIL_FROM`     | `Nombre del Gimnasio <gimnasio.avisos@gmail.com>` (opcional) |

5. Guardá: Render reinicia el backend solo. En Notificaciones ya aparece "Mail listo".

Gmail deja mandar unos **500 mails por día**. Si el gimnasio tiene más socios con mail,
conviene una casilla del dominio propio (ver abajo).

## Con Outlook / Hotmail

Lo mismo que Gmail, más estas dos variables:

| Variable    | Valor               |
|-------------|---------------------|
| `MAIL_HOST` | `smtp.office365.com` |
| `MAIL_PORT` | `587`               |

## Con la casilla del dominio del gimnasio (hosting propio)

El proveedor del hosting te da estos datos ("configuración SMTP"):

| Variable        | Ejemplo                    |
|-----------------|----------------------------|
| `MAIL_HOST`     | `mail.migimnasio.com.ar`   |
| `MAIL_PORT`     | `587` (o el que te indiquen) |
| `MAIL_USERNAME` | `avisos@migimnasio.com.ar` |
| `MAIL_PASSWORD` | la contraseña de la casilla |
| `MAIL_ENABLED`  | `true`                     |

Si el proveedor usa el puerto 465 (SSL), avisá y se ajusta la configuración.

## Probarlo en la compu sin mandar mails de verdad

Ver `pruebas-e2e/LEEME.md`, sección "Probar los mails": hay un servidor de mail falso
que guarda lo que se manda en un archivo.

## Dónde está en el código

- Configuración: `src/main/resources/application.properties` (sección "Email por SMTP").
- Envío: `src/main/java/.../service/EmailService.java`.
- Qué se manda y a quién: `src/main/java/.../service/NotificacionService.java`.
