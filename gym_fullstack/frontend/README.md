# Frontend React para Gestor de Gimnasio

Interfaz construida en **React + Vite** que reemplaza el frontend original en HTML/JS plano. Consume el backend en Django Rest Framework con autenticación JWT.

## Requisitos

- Node.js 18+

## Instalación

```bash
cd frontend
npm install
```

## Variables de entorno

Crea un archivo `.env` con la URL del backend si es diferente a la predeterminada:

```
VITE_API_BASE=http://localhost:8000/api
```

## Scripts

- `npm run dev` inicia el servidor de desarrollo en `http://localhost:5173`.
- `npm run build` genera la versión de producción.
- `npm run preview` levanta la aplicación compilada.

## Características

- Inicio de sesión con JWT y almacenamiento seguro de tokens.
- Registro público de clientes con inicio de sesión automático.
- Sincronización automática del perfil usando el endpoint `/api/auth/me`.
- Panel administrativo para gestionar usuarios, membresías, asignaciones y pagos.
- Panel para clientes con actualización de perfil, resumen de membresías y pagos.
- Estilos modernos y responsivos.

## Credenciales de ejemplo

Si ejecutaste el script de datos iniciales (`python manage.py shell < ../database/seed/seed_data.py`), puedes iniciar sesión con:

- Administrador: `admin@gym.com` / `Admin123!`
- Entrenador: `coach@gym.com` / `Coach123!`
- Cliente: `cliente@gym.com` / `Cliente123!`

Asegúrate de que el backend esté ejecutándose antes de iniciar el frontend para evitar errores de autenticación.
