# API RESTful de Superhéroes

## Descripción
Esta API RESTful desarrollada con Node.js y Express permite gestionar un sistema de superhéroes y sus creadores. Implementa una arquitectura en capas (controladores, servicios, modelos) con operaciones CRUD completas, autenticación JWT, validación de datos, paginación y un sistema de logging robusto.

## Funcionalidades Principales

### 1. Autenticación
- Registro de usuarios
- Login con JWT
- Protección de rutas sensibles

### 2. Módulo de ABMC (Alta, Baja, Modificación, Consulta)
- **Superhéroes:**
  - Creación de superhéroes con poderes
  - Listado paginado
  - Búsqueda por ID
  - Actualización de información
  - Eliminación
  - Gestión de poderes
- **Creadores:**
  - Registro de creadores
  - Listado paginado
  - Búsqueda por ID
  - Actualización de información
  - Eliminación

### 3. Características Técnicas
- Arquitectura en capas (Controladores, Servicios, Modelos)
- Sistema de logging detallado
- Validación de datos de entrada
- Manejo centralizado de errores
- Paginación en listados

## Tecnologías Utilizadas
- **Node.js & Express:** Framework backend
- **MongoDB & Mongoose:** Base de datos y ORM
- **JWT:** Autenticación y autorización
- **Express-validator:** Validación de datos
- **Winston:** Sistema de logging
- **Bcryptjs:** Encriptación de contraseñas
- **Cors:** Manejo de CORS
- **Dotenv:** Manejo de variables de entorno

## Estructura del Proyecto

superhero-api/
├── src/
│ ├── controllers/
│ │ ├── authController.js
│ │ ├── superheroController.js
│ │ └── creatorController.js
│ ├── services/
│ │ ├── authService.js
│ │ ├── superheroService.js
│ │ └── creatorService.js
│ ├── middleware/
│ │ ├── authMiddleware.js
│ │ └── validator.js
│ ├── models/
│ │ ├── User.js
│ │ ├── Superhero.js
│ │ └── Creator.js
│ ├── routes/
│ │ ├── authRouter.js
│ │ ├── superheroRouter.js
│ │ └── creatorRouter.js
│ ├── config/
│ │ ├── database.js
│ │ ├── logger.js
│ └── app.js
├── logs/
│ ├── error.log
│ └── combined.log
├── .env
├── package.json
└── README.md



## Endpoints de la API

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login de usuario

### Superhéroes
- `GET /api/superheros` - Listar superhéroes (paginado)
- `GET /api/superheros/:id` - Obtener superhéroe por ID
- `POST /api/superheros` - Crear nuevo superhéroe
- `PUT /api/superheros/:id` - Actualizar superhéroe
- `DELETE /api/superheros/:id` - Eliminar superhéroe

### Creadores
- `GET /api/creators` - Listar creadores (paginado)
- `GET /api/creators/:id` - Obtener creador por ID
- `POST /api/creators` - Crear nuevo creador
- `PUT /api/creators/:id` - Actualizar creador
- `DELETE /api/creators/:id` - Eliminar creador

## Ejemplos de Uso

### Registro de Usuario

bash
curl -X POST http://localhost:3000/api/auth/register \
-H "Content-Type: application/json" \
-d '{
"email": "usuario@ejemplo.com",
"password": "contraseña123",
"name": "Usuario Ejemplo"
}'


### Crear un Superhéroe

bash
curl -X POST http://localhost:3000/api/superheros \
-H "Content-Type: application/json" \
-H "Authorization: Bearer [TU_TOKEN]" \
-d '{
"name": "Spider-Man",
"alterEgo": "Peter Parker",
"powers": ["Agilidad sobrehumana", "Sentido arácnido", "Trepar paredes"],
"description": "Tu amigable vecino Spider-Man",
"creator": "id_del_creador"
}'

### Crear un Creador

bash
curl -X POST http://localhost:3000/api/creators \
-H "Content-Type: application/json" \
-H "Authorization: Bearer [TU_TOKEN]" \
-d '{
"name": "Stan Lee",
"email": "stanlee@marvel.com",
"company": "Marvel Comics",
"yearsOfExperience": 50
}'

## Configuración del Proyecto

### 1. Clonar el repositorio

bash
git clone https://github.com/Esteban705/SuperheroBackUTN-.git
cd SuperheroBackUTN-

### 2. Instalar dependencias

bash
npm install


### 3. Configurar variables de entorno
Crear archivo `.env`:

plaintext
MONGODB_URI=mongodb://localhost:27017/superhero-api
PORT=3000
JWT_SECRET=tu_secreto_jwt_aqui

### 4. Iniciar el servidor

bash
npm start

## Sistema de Logging
El proyecto utiliza Winston para el logging, guardando:
- Errores en `/logs/error.log`
- Todos los logs en `/logs/combined.log`
- Logs de operaciones CRUD
- Logs de autenticación
- Información de requests y responses

## Contribuidores
- Ruben Esteban Rodriguez
