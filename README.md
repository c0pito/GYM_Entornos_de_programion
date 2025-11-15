# GYM_Entornos_de_programion

Este repositorio contiene **dos implementaciones** del gestor de gimnasio solicitado. La versión vigente (full‑stack React + Django REST) vive en `gym_fullstack/` y convive con el código legado (frontend HTML + backend Spring Boot + MySQL) para referencia histórica.

> Si estabas buscando el proyecto "nuevo" que se pidió crear, entra directamente a [`gym_fullstack/`](./gym_fullstack). Ahí encontrarás el frontend en React/Vite, el backend en Django REST Framework y los scripts de seed.

## Estructura del repositorio

| Carpeta | Descripción |
| --- | --- |
| `gym_fullstack/frontend/` | Aplicación React + Vite que consume la API REST. Incluye contexto de autenticación, pantallas de admin/cliente y estilos. |
| `gym_fullstack/backend/` | Proyecto Django REST Framework con autenticación JWT, endpoints de usuarios/membresías y documentación específica en su propio README. |
| `gym_fullstack/database/` | Recursos para datos de ejemplo (seed) y un `docker-compose` opcional para levantar dependencias. |
| `FronEnd_Gym/` | Frontend original en HTML/JS plano (legacy). |
| `Gimnasio_Copia2/` | Backend legacy en Spring Boot + MySQL. |
| `gimnasio3000.sql` | Script SQL utilizado por la versión legacy. |

## Cómo ejecutar la solución React + Django

### 1. Backend (Django REST)

1. Instala dependencias:
   ```bash
   cd gym_fullstack/backend
   python -m venv .venv
   source .venv/bin/activate  # En Windows: .venv\\Scripts\\activate
   pip install -r requirements.txt
   ```
2. Configura variables de entorno (puedes crear un `.env` en la carpeta `backend`):
   ```env
   DJANGO_SECRET_KEY="cambia-esta-clave"
   MONGO_DB_URI="mongodb://localhost:27017"
   MONGO_DB_NAME="gymdb"
   DJANGO_DEBUG=True
   CORS_ALLOWED_ORIGINS="http://localhost:5173"
   CSRF_TRUSTED_ORIGINS="http://localhost:5173"
   ```
3. Aplica migraciones y crea el superusuario:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   python manage.py createsuperuser
   ```
4. (Opcional) Carga datos de ejemplo:
   ```bash
   python manage.py shell < ../database/seed/seed_data.py
   ```
5. Ejecuta el servidor de desarrollo:
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

El backend quedará expuesto en `http://localhost:8000/api/`.

### 2. Frontend (React + Vite)

1. Instala dependencias:
   ```bash
   cd gym_fullstack/frontend
   npm install
   ```
2. (Opcional) crea `.env` para apuntar al backend si usas otro host:
   ```env
   VITE_API_BASE=http://localhost:8000/api
   ```
3. Arranca el modo desarrollo:
   ```bash
   npm run dev
   ```

La interfaz estará disponible en `http://localhost:5173` y consumirá la API anterior.

### 3. Credenciales de ejemplo

Si ejecutaste el script de seed del backend, dispones de:

- `admin@gym.com` / `Admin123!`
- `coach@gym.com` / `Coach123!`
- `cliente@gym.com` / `Cliente123!`

(consulta `gym_fullstack/database/seed/seed_data.py` para más usuarios/roles).

## Estado del proyecto

- **En desarrollo activo**: la rama `work` contiene los últimos cambios.
- **Stack recomendado**: React + Django en `gym_fullstack/`.
- **Stack legacy**: permanece disponible por si necesitas revisar la versión previa basada en Spring Boot/MySQL y el frontend estático.

## Recursos adicionales

- Documentación específica del backend: [`gym_fullstack/backend/README.md`](./gym_fullstack/backend/README.md)
- Documentación específica del frontend: [`gym_fullstack/frontend/README.md`](./gym_fullstack/frontend/README.md)
- Script SQL legacy: [`gimnasio3000.sql`](./gimnasio3000.sql)

Con estas instrucciones puedes clonar el repo, navegar al árbol moderno y ejecutar toda la solución desde Visual Studio Code o tu entorno favorito.
