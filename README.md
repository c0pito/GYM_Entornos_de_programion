# GYM_Entornos_de_programion
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
GYM_Entornos_de_programion/
├── FronEnd_Gym/               # Frontend (HTML, CSS, JS)
│   ├── admin.js
│   ├── administrador.html
│   ├── cliente.html
│   ├── cliente.js
│   ├── login.html
│   └── styles.css
├── Gimnasio_Copia2/           # Backend (Spring Boot)
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/uis/gimnasio/
│   │   │   │   ├── controlador/
│   │   │   │   │   ├── AuthController.java
│   │   │   │   │   ├── ClienteMembresiaController.java
│   │   │   │   │   ├── MembresiaControlador.java
│   │   │   │   │   ├── PagoControlador.java
│   │   │   │   │   ├── UsuarioControlador.java
│   │   │   │   ├── modelo/
│   │   │   │   │   ├── ClienteMembresia.java
│   │   │   │   │   ├── Estado.java
│   │   │   │   │   ├── Membresia.java
│   │   │   │   │   ├── MetodoPago.java
│   │   │   │   │   ├── Pago.java
│   │   │   │   │   ├── Rol.java
│   │   │   │   │   ├── Usuario.java
│   │   │   │   ├── repositorio/
│   │   │   │   │   ├── ClienteMembresiaRepository.java
│   │   │   │   │   ├── MembresiaRepository.java
│   │   │   │   │   ├── PagoRepository.java
│   │   │   │   │   ├── UsuarioRepository.java
│   │   │   │   ├── security/
│   │   │   │   │   ├── AuthenticationRequest.java
│   │   │   │   │   ├── AuthenticationResponse.java
│   │   │   │   │   ├── JwtRequestFilter.java
│   │   │   │   │   ├── JwtUtil.java
│   │   │   │   │   └── SecurityConfig.java
│   │   │   │   ├── service/
│   │   │   │   │   ├── ClienteMembresiaService.java
│   │   │   │   │   ├── MembresiaService.java
│   │   │   │   │   ├── PagoService.java
│   │   │   │   │   ├── UsuarioService.java
│   │   │   │   │   ├── UserDetailsServiceImpl.java
│   │   │   │   │   └── UsuariosServiceImpl.java
│   │   │   │   └── GimnasioApplication.java
│   │   │   └── resources/
│   │   │       └── application.properties
│   └── pom.xml
├── gimnasio3000.sql           # Esquema de la base de datos MySQL
├── README.md                  # Este documento
└── README_Copia2.md           # Copia del README

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

6. Posibles Mejoras

Agregar más detalles al README.
Deploy en servidor (e.g., Heroku para backend).
Tests unitarios con JUnit.
