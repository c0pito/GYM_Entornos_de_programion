# Inicialización de la base de datos

Desde la migración a SQLite ya no es necesario instalar ni levantar MongoDB ni utilizar Docker para el backend. Todo el estado de la base de datos se almacena en el archivo `gym_fullstack/backend/db.sqlite3`.

## 1. Preparar el entorno virtual

```bash
cd gym_fullstack/backend
python -m venv .venv
source .venv/bin/activate  # En Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## 2. Aplicar migraciones y crear el superusuario

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

Estos comandos crearán el archivo `db.sqlite3` si aún no existe. Si en algún momento quieres partir de una base limpia, elimina el archivo y repite las migraciones.

## 3. Poblar datos de ejemplo (opcional)

Puedes seguir utilizando el script de semillas para generar usuarios, membresías y pagos de prueba:

```bash
python manage.py shell < ../database/seed/seed_data.py
```

El script es idempotente, por lo que puedes ejecutarlo varias veces sin duplicar registros.

## 4. Depuración de configuraciones antiguas

Si tenías variables de entorno como `MONGO_DB_URI` o `MONGO_DB_NAME`, ya no son necesarias. Elimina esas referencias de tus archivos `.env` o del entorno del sistema para evitar errores al iniciar `manage.py`.
