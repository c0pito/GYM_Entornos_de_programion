# Backend Django REST para Gestor de Gimnasio

Este backend reemplaza el proyecto original en Spring Boot por una API desarrollada con **Django REST Framework** y autenticación **JWT**. Utiliza una base de datos **MongoDB** mediante `djongo`.

## Requisitos

- Python 3.11+
- MongoDB (local o en la nube). Puedes levantarlo con Docker usando [`../database/docker-compose.yml`](../database/docker-compose.yml).

## Instalación

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # En Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
```

## Variables de entorno

Crea un archivo `.env` o exporta variables antes de ejecutar `manage.py`:

```
DJANGO_SECRET_KEY="cambia-esta-clave"
MONGO_DB_URI="mongodb://localhost:27017"
MONGO_DB_NAME="gymdb"
DJANGO_DEBUG=True
CORS_ALLOWED_ORIGINS="http://localhost:5173"
CSRF_TRUSTED_ORIGINS="http://localhost:5173"
```

## Migraciones iniciales

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

## Datos de ejemplo opcionales

Con la base de datos activa puedes crear información de prueba ejecutando:

```bash
python manage.py shell < ../database/seed/seed_data.py
```

El script crea usuarios administradores, entrenadores y clientes junto con membresías, asignaciones y pagos.

## Ejecutar servidor de desarrollo

```bash
python manage.py runserver 0.0.0.0:8000
```

La API quedará disponible en `http://localhost:8000/api/`.

## Endpoints principales

| Método | Endpoint | Descripción |
| --- | --- | --- |
| POST | `/api/auth/register` | Registra un cliente y devuelve tokens JWT |
| POST | `/api/auth/login` | Obtiene tokens JWT y datos del usuario |
| POST | `/api/auth/refresh` | Refresca el token de acceso |
| GET | `/api/auth/me` | Datos del usuario autenticado |
| GET | `/api/usuario/list` | Lista de usuarios (solo administrador) |
| POST | `/api/usuario/` | Crear usuario (solo administrador) |
| DELETE | `/api/usuario/<id>` | Elimina usuario (solo administrador) |
| GET/PUT | `/api/usuario/perfil` | Información y edición del perfil actual |
| GET | `/api/membresia/list` | Lista pública de membresías |
| POST/DELETE | `/api/membresia/` | Crear/eliminar membresías (administrador) |
| GET | `/api/clientemembresia/list` | Asignaciones (administrador) |
| POST | `/api/clientemembresia/` | Crear asignación (administrador) |
| GET | `/api/clientemembresia/mis-membresias` | Membresías del cliente autenticado |
| GET | `/api/gimnasio/pagos` | Pagos (administrador) |
| POST | `/api/gimnasio/pago` | Registrar pago (administrador) |
| GET | `/api/gimnasio/mis-pagos` | Pagos del cliente autenticado |

## Datos iniciales sugeridos

Puedes crear datos rápidamente con el shell de Django:

```bash
python manage.py shell
```

```python
from django.contrib.auth import get_user_model
from gym.models import Membership

User = get_user_model()
admin = User.objects.create_superuser(
    email='admin@gym.com',
    password='Admin123!',
    first_name='Admin',
    last_name='Gym'
)
Membership.objects.create(name='Mensual', description='Acceso ilimitado por 30 días', price=120000, duration_days=30)
```

> **Nota:** Este backend está preparado para integrarse con el frontend en React incluido en la carpeta superior.
