# GYM_Entornos_de_programion
Se creara un Gym
1. Descripción General del Proyecto
Este proyecto es un Sistema de Gestión de Gimnasio (Gym Management System) diseñado para administrar usuarios, membresías, clases y pagos en un gimnasio. Utiliza una arquitectura web con separación clara entre frontend, backend y base de datos.

Objetivo principal: Optimizar la gestión diaria de un gimnasio mediante una aplicación web.
Estado actual: En desarrollo. El repositorio incluye frontend, backend y esquema de base de datos.
Tecnologías clave:

Frontend: HTML, CSS, JavaScript (en FronEnd_Gym).
Backend: Spring Boot (Java) en Gimnasio_Copia2.
Base de datos: MySQL (esquema en gimnasio3000.sql).


Herramientas:

IntelliJ IDEA para el backend.
Visual Studio Code para el frontend.
MySQL Workbench para la base de datos.



2. Estructura del Proyecto
Basado en las carpetas y archivos del repositorio:

<img width="435" height="829" alt="image" src="https://github.com/user-attachments/assets/af833fd7-116f-41e3-8ba6-7073c31711fe" />


3. Instalación y Configuración

Clonar el repositorio:
git clone https://github.com/miguelitowashere/GYM_Entornos_de_programion.git
cd GYM_Entornos_de_programion
Configurar la Base de Datos:

Abre MySQL Workbench.
Crea una BD: CREATE DATABASE gym_db;.
Ejecuta gimnasio3000.sql para crear las tablas.
Asegúrate de que las credenciales en application.properties coincidan (e.g., spring.datasource.username=root, spring.datasource.password=tu_password).


Backend (Gimnasio_Copia2):

Abre la carpeta Gimnasio_Copia2 en IntelliJ.
Importa como proyecto Maven.
Configura application.properties con tu BD:

spring.datasource.url=jdbc:mysql://localhost:3306/gym_db
spring.datasource.username=root
spring.datasource.password=tu_password
spring.jpa.hibernate.ddl-auto=update

Ejecuta GimnasioApplication.java: mvn spring-boot:run.
El servidor corre en http://localhost:8080.


Frontend (FronEnd_Gym):

Abre FronEnd_Gym en VS Code.
Usa Live Server para servir login.html en http://localhost:5500.
Conecta al backend editando JS (e.g., fetch('http://localhost:8080/api/usuarios')).


Pruebas:

Accede a http://localhost:5500/login.html.
Prueba APIs con Postman (e.g., GET /api/usuarios).



4. Funcionalidades Principales

Gestión de Usuarios: Registro, edición y eliminación (vía UsuarioControlador).
Membresías: Administración de planes (vía MembresiaControlador).
Pagos: Registro y seguimiento (vía PagoControlador).
Autenticación: Login con JWT (vía SecurityConfig y JwtUtil).
Interfaz: Páginas como administrador.html y cliente.html para gestión.

5. Base de Datos (MySQL)

Esquema definido en gimnasio3000.sql.
Tablas principales inferidas: usuarios, membresias, pagos, etc.

<img src="https://drive.google.com/uc?export=view&id=1h79YJGnQILi5VTn0D7gpJUX9OQO1OHsQ" 
     alt="Diagrama de la base de datos gimnasio3000" 
     width="435" height="829">

6. Posibles Mejoras

Agregar más detalles al README.
Deploy en servidor (e.g., Heroku para backend).
Tests unitarios con JUnit.

## Datos de ejemplo para `gym_fullstack`

Si quieres probar el nuevo backend basado en Django/MongoDB que vive en `gym_fullstack/backend`, después de crear y activar tu
entorno virtual instala las dependencias (por ejemplo, `pip install -r requirements.txt`) y ejecuta:

```bash
cd gym_fullstack/backend
python manage.py migrate
python manage.py shell < ../database/seed/seed_data.py
```

El comando `migrate` prepara el esquema y, a continuación, el script `seed_data.py` pobla la base de datos con usuarios y
catálogos imprescindibles. El seed es idempotente, por lo que puedes ejecutarlo varias veces sin generar duplicados.

Credenciales creadas automáticamente:

- `admin@gym.com` / `Admin123!` (superusuario/documentado en el seed).
- `coach@gym.com` / `Coach123!`.
- `cliente@gym.com` / `Cliente123!`.
- `pepito1@gym.com` … `pepito10@gym.com` / `Pepito123!`.

Además, el seed registra los planes base, las máquinas y reservas de ejemplo para facilitar la verificación del frontend.
