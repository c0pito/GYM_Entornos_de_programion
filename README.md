# GYM Fullstack (React + Django REST)

La solución actual del repositorio es una aplicación web fullstack dividida en:

| Carpeta | Descripción |
| --- | --- |
| `gym_fullstack/frontend` | Aplicación **React + Vite** que consume la API REST y ofrece paneles para administradores, entrenadores y clientes. |
| `gym_fullstack/backend` | API en **Django REST Framework** con autenticación **JWT**, conectada a MongoDB. |
| `gym_fullstack/database` | Utilidades para levantar MongoDB (Docker Compose) y poblarla con el script de seed. |

Las carpetas `FronEnd_Gym` y `Gimnasio_Copia2` contienen prototipos anteriores (HTML plano + Spring Boot). Consulta la sección [Histórico](#histórico-de-proyectos) si necesitas trabajar con ellos; el resto del documento describe únicamente la pila React + Django.

---

## 1. Requisitos

| Herramienta | Versión sugerida |
| --- | --- |
| Node.js / npm | Node 18+ (instala npm con Node) |
| Python | 3.11+ |
| MongoDB | Local o en contenedor Docker |
| VS Code | Recomendado para ejecutar ambos proyectos |
| Docker (opcional) | Para levantar MongoDB con `docker compose up -d` |

---

## 2. Instalación y configuración

### 2.1 Backend (`gym_fullstack/backend`)

1. Crear entorno virtual e instalar dependencias:
   ```bash
   cd gym_fullstack/backend
   python -m venv .venv
   source .venv/bin/activate  # En Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```
2. Configurar variables de entorno en un archivo `.env` (mismo directorio):
   ```env
   DJANGO_SECRET_KEY=clave-super-secreta
   DJANGO_DEBUG=True
   MONGO_DB_URI=mongodb://localhost:27017
   MONGO_DB_NAME=gymdb
   CORS_ALLOWED_ORIGINS=http://localhost:5173
   CSRF_TRUSTED_ORIGINS=http://localhost:5173
   ACCESS_TOKEN_LIFETIME_MIN=30      # opcional
   REFRESH_TOKEN_LIFETIME_MIN=4320   # opcional (3 días)
   ```
   *Ajusta los orígenes si cambias el puerto del frontend o desplegarás en otra URL.*
3. Preparar la base de datos:
   - Si usas Docker: `cd gym_fullstack/database && docker compose up -d`.
   - Manual: asegúrate de que MongoDB escuche en `MONGO_DB_URI`.
4. Aplicar migraciones y cargar datos de prueba (seed):
   ```bash
   python manage.py migrate
   python manage.py shell < ../database/seed/seed_data.py
   ```
5. Levantar el backend (puerto 8000 por defecto):
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

### 2.2 Frontend (`gym_fullstack/frontend`)

1. Instalar dependencias:
   ```bash
   cd gym_fullstack/frontend
   npm install
   ```
2. (Opcional) Crear `.env` para apuntar a otra API:
   ```env
   VITE_API_BASE=http://localhost:8000/api
   VITE_API_WS=ws://localhost:8000/ws  # si habilitas websockets
   ```
3. Ejecutar en modo desarrollo (puerto 5173):
   ```bash
   npm run dev
   ```
   Usa `npm run dev -- --host` si necesitas exponerlo en tu LAN.

### 2.3 Ejecutar ambos desde VS Code

1. Abre el repositorio en VS Code (`File > Open Folder...`).
2. Crea dos terminales integradas:
   - **Terminal 1** (`gym_fullstack/backend`): activa el entorno virtual (`source .venv/bin/activate`), luego `python manage.py runserver`.
   - **Terminal 2** (`gym_fullstack/frontend`): ejecuta `npm run dev`.
3. Si deseas automatizarlo, añade al `tasks.json` de VS Code comandos para `python manage.py runserver` y `npm run dev` y ejecútalos con `Ctrl+Shift+B`.
4. Verifica en el navegador:
   - Frontend: http://localhost:5173
   - API REST: http://localhost:8000/api/

---

## 3. Credenciales y datos sembrados

El script `gym_fullstack/database/seed/seed_data.py` crea los siguientes usuarios (puedes volver a ejecutarlo sin duplicar registros):

| Rol | Usuario | Contraseña |
| --- | --- | --- |
| Superadmin | `admin@gym.com` | `Admin123!` |
| Entrenador | `coach@gym.com` | `Coach123!` |
| Cliente | `cliente@gym.com` | `Cliente123!` |

También genera membresías (“Mensual”, “Trimestral”), asignaciones (`clientemembresia`) y pagos de ejemplo para probar dashboards y reportes.

---

## 4. Endpoints principales

La API está namespaced en `/api/`. Los endpoints más usados son:

| Método | Endpoint | Descripción |
| --- | --- | --- |
| POST | `/api/auth/login` | Devuelve tokens JWT (access + refresh) y datos del usuario. |
| POST | `/api/auth/refresh` | Renueva el token de acceso. |
| GET/PUT | `/api/usuario/perfil` | Consulta/actualiza el perfil autenticado. |
| GET | `/api/usuario/list` | Listado de usuarios (admin). |
| POST/DELETE | `/api/usuario/` | Crear o eliminar usuarios (admin). |
| GET | `/api/membresia/list` | Membresías disponibles. |
| POST/DELETE | `/api/membresia/` | Gestión de membresías (admin). |
| GET | `/api/clientemembresia/list` | Asignaciones de membresías (admin). |
| POST | `/api/clientemembresia/` | Asignar membresía a cliente (admin). |
| GET | `/api/clientemembresia/mis-membresias` | Membresías del cliente autenticado. |
| GET | `/api/gimnasio/pagos` | Pagos registrados (admin). |
| POST | `/api/gimnasio/pago` | Crear pago (admin). |
| GET | `/api/gimnasio/mis-pagos` | Pagos del cliente autenticado. |

### Colección HTTP/Postman

- **VS Code / REST Client:** Usa `gym_fullstack/backend/http/gym_api.http` para ejecutar solicitudes directamente desde el editor.
- **Postman/Insomnia:** importa el mismo archivo (es texto plano) o crea una nueva colección reutilizando las URLs y cuerpos incluidos.

Cada petición del archivo incluye ejemplos para autenticación, CRUD de usuarios, membresías y pagos. Actualiza los tokens JWT en el encabezado `Authorization: Bearer <token>` tras iniciar sesión.

---

## 5. Consumo desde el frontend

1. Inicia sesión con cualquiera de las credenciales sembradas.
2. El frontend guarda los tokens JWT y refresca automáticamente el access token cuando expira.
3. El panel de administrador permite:
   - Crear/editar usuarios, membresías y asignaciones.
   - Revisar pagos y registrar nuevos.
4. El panel de cliente muestra:
   - Datos personales editables.
   - Historial de membresías y pagos.

Si necesitas probar los endpoints sin interfaz, utiliza el archivo `.http` o tus propias herramientas (curl, Postman, Thunder Client).

---

## 6. Histórico de proyectos

Los directorios originales se conservan por referencia:

| Carpeta | Estado |
| --- | --- |
| `FronEnd_Gym` | Frontend en HTML/CSS/JS estático que dependía del backend en Spring Boot. |
| `Gimnasio_Copia2` | Backend en Spring Boot + MySQL. |

No reciben mantenimiento y pueden contener configuraciones obsoletas. Para la solución vigente utiliza exclusivamente `gym_fullstack/*`.

---

## 7. Recursos adicionales

- Diagrama y script SQL originales: `gimnasio3000.sql`.
- Documentación específica:
  - `gym_fullstack/frontend/README.md`
  - `gym_fullstack/backend/README.md`
  - `gym_fullstack/database/README.md`

Con esto deberías poder levantar todo el stack en minutos y extenderlo según las necesidades del gimnasio.
