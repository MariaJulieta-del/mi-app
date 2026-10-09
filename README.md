#GymTrack

Sistema de gestión de gimnasios desarrollado con **Spring Boot** (backend) y **React + TypeScript** (frontend).

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Java 21 · Spring Boot 4 · Spring Data JPA |
| Base de datos | PostgreSQL 17 |
| Frontend | React 19 · TypeScript · Vite · React Router 7 |
| HTTP client | Axios |
| Estilos | CSS custom (design system propio) |
| Build tool | Maven (backend) · npm (frontend) |

---

## Estructura del proyecto

```
gymtrack/
├── gymtrack-backend/
│   ├── src/main/java/com/example/gymtrack_backend/
│   │   ├── entities/          # Entidades JPA
│   │   │   └── enums/         # TipoMembresia, EstadoPago, etc.
│   │   ├── dto/               # DTOs de entrada y salida
│   │   ├── repository/        # Interfaces JpaRepository
│   │   ├── service/           # Lógica de negocio
│   │   └── web/               # Controllers REST
│   └── sql/                   # Scripts de creación de tablas
└── gymtrack-frontend/
    └── src/
        ├── components/        # Componentes de UI
        ├── services/          # Llamadas a la API (axios)
        └── types/             # Interfaces TypeScript
```

---

## Módulos implementados

### Sprint 1 — Socios
CRUD completo. Baja lógica (no elimina físicamente).

### Sprint 2 — Rutinas, Membresías y Pagos

**Rutinas:** cada socio puede tener múltiples rutinas con ejercicios asignados.

**Membresías:**
- Tipos: `MENSUAL` · `TRIMESTRAL` · `SEMESTRAL` · `ANUAL`
- Estados: `PENDIENTE_PAGO` → `ACTIVA` → `VENCIDA` / `CANCELADA`
- La `fechaVencimiento` se calcula automáticamente al crear.

**Pagos:** al registrar un pago `COMPLETADO`, la membresía pasa automáticamente a `ACTIVA`.

---

## Cómo levantar el proyecto

### Requisitos
- Java 21+ · Maven · Node.js 18+ · PostgreSQL 17

### Base de datos

```sql
-- 1. Crear la BD en pgAdmin
CREATE DATABASE gymtrack_db;

-- 2. Ejecutar los scripts en orden:
-- sql/V1__create_rutinas.sql
-- sql/V2__create_membresias_pagos.sql
```

> La tabla `socios` la crea Hibernate automáticamente.

### Backend

```bash
cd gymtrack-backend
./mvnw spring-boot:run
# Disponible en http://localhost:8080
```

### Frontend

```bash
cd gymtrack-frontend
npm install
npm run dev
# Disponible en http://localhost:5173
```

---

## API — Endpoints

### Socios — `/api/v1/socios`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/socios` | Listar socios activos |
| GET | `/api/v1/socios/{id}` | Obtener por ID |
| POST | `/api/v1/socios` | Crear socio |
| PUT | `/api/v1/socios/{id}` | Actualizar |
| DELETE | `/api/v1/socios/{id}` | Baja lógica |

### Rutinas — `/api/v1/rutinas` · Header: `X-Socio-Id`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/rutinas` | Listar del socio |
| GET | `/api/v1/rutinas/{id}` | Obtener una |
| POST | `/api/v1/rutinas` | Crear |
| PUT | `/api/v1/rutinas/{id}` | Actualizar |
| DELETE | `/api/v1/rutinas/{id}` | Eliminar |

### Membresías — `/api/v1/membresias`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/membresias` | Listar todas |
| GET | `/api/v1/membresias/{id}` | Detalle |
| POST | `/api/v1/membresias` | Crear |
| PATCH | `/api/v1/membresias/{id}/estado` | Cambiar estado |

### Pagos — `/api/v1/pagos`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/pagos` | Listar todos |
| POST | `/api/v1/pagos` | Registrar pago |
| GET | `/api/v1/pagos/membresia/{id}` | Historial por membresía |

---

## Variables de entorno

Los secretos **no** van en el código. El backend lee estas variables (entre paréntesis, el default para desarrollo local):

| Variable | Uso |
|----------|-----|
| `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` | Conexión a PostgreSQL (`gymtrack_db`, `postgres`, `1234`) |
| `JWT_SECRET` | Clave de firma de tokens. **Obligatoria en producción** (mín. 32 caracteres) |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | Casilla y contraseña de aplicación para mandar los avisos (ver `gymtrack-backend/CONFIGURAR-MAIL.md`) |
| `MAIL_ENABLED` | `true` para enviar emails (`false`) |

Frontend: copiar `gymtrack-frontend/.env.example` a `.env.local` y ajustar `VITE_API_URL` (default `http://localhost:8080`).

Base de datos con Docker:

```bash
docker compose -f docker.yml up -d
```

---

## Próximos pasos (Sprint 3)

- [ ] Módulo de Asistencias (control de acceso)
- [ ] Catálogo de Ejercicios con FK real
- [ ] Dashboard con estadísticas y gráficos
- [ ] Autenticación con roles
