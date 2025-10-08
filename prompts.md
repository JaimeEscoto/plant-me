# Prompts para "Mi Jardín Mental"

## Prompt para el Backend (API RESTful)
Actúa como un arquitecto de software y un desarrollador backend senior. Necesito diseñar y construir una API RESTful para una aplicación de bitácora emocional llamada "Mi Jardín Mental". La aplicación usará una metáfora de un jardín para representar el estado emocional del usuario.

El proyecto debe ser construido con:
- **Lenguaje de Programación**: Node.js
- **Framework**: Express.js
- **Base de Datos**: PostgreSQL
- **ORM**: Sequelize
- **Autenticación**: JSON Web Tokens (JWT) para la autenticación de usuarios.
- **Validación de Datos**: Joi.

La API debe tener los siguientes modelos y endpoints:

1. **Modelo `Usuario`**:
   - `id` (UUID)
   - `nombre_usuario` (único)
   - `email` (único)
   - `contrasena` (encriptada)
   - `fecha_creacion`
   - Relación: Un usuario tiene un jardín.

2. **Modelo `Jardin`**:
   - `id` (UUID)
   - `usuario_id` (FK a `Usuario`)
   - `estado_salud` (ej. `0` a `100`, representa el estado general del jardín)
   - `ultima_modificacion`
   - Relación: Un jardín tiene muchas plantas.

3. **Modelo `Planta` (emociones/eventos)**:
   - `id` (UUID)
   - `jardin_id` (FK a `Jardin`)
   - `nombre` (ej. "Rayo de Sol", "Nube Gris")
   - `tipo` (ej. "positivo", "negativo", "neutro")
   - `fecha_plantado`
   - `descripcion`
   - Relación: Una planta pertenece a un jardín.

**Endpoints (con validación de Joi):**

- `POST /api/auth/register`: Registro de un nuevo usuario.
- `POST /api/auth/login`: Autenticación y retorno de un JWT.
- `GET /api/jardin/`: Obtener el estado y las plantas del jardín del usuario autenticado.
- `POST /api/jardin/planta`: Registrar un nuevo evento (plantar o quitar una planta). El body debe incluir el nombre, tipo y descripción. Debe actualizar el estado de salud del jardín.
- `GET /api/jardin/historial`: Obtener el historial de eventos del jardín en un rango de fechas.
- `PUT /api/jardin/planta/:id`: Actualizar la descripción de una planta.
- `DELETE /api/jardin/planta/:id`: Eliminar una planta.

**Instrucciones para la IA:**
- Proporciona el código completo y comentado para cada uno de los modelos y los *controllers* de los *endpoints* principales.
- Incluye un archivo `server.js` con la configuración básica del servidor, conexión a la base de datos y enrutamiento.
- Asegúrate de que la seguridad sea una prioridad, incluyendo la encriptación de contraseñas y la protección de rutas con JWT.
- Dame también las instrucciones para configurar el entorno de desarrollo (variables de entorno, instalación de dependencias, etc.).

## Prompt para el Frontend (Aplicación de Demostración)
Actúa como un desarrollador frontend senior especializado en React.js y un diseñador de UI/UX. Necesito construir una aplicación web de demostración para la API de "Mi Jardín Mental" que diseñaste. La aplicación debe ser una Single Page Application (SPA).

El proyecto debe ser construido con:
- **Framework**: React.js (con Create React App o Vite).
- **Librerías de Estilos**: Tailwind CSS para un diseño limpio y rápido.
- **Manejo de Estado**: Context API de React.
- **Manejo de Peticiones**: Axios.
- **Animaciones**: GSAP (GreenSock Animation Platform) para las transiciones del jardín.

La aplicación debe tener los siguientes componentes y funcionalidades:

1. **Componente de Autenticación**:
   - Formulario de registro y login.
   - Redirección a la vista del jardín al iniciar sesión con éxito.

2. **Componente `JardinView`**:
   - Pantalla principal que muestra la representación visual del jardín.
   - El estado del jardín (`estado_salud`) se reflejará visualmente (ej. más flores, menos plantas, colores vibrantes). Usa CSS y GSAP para estas transiciones.
   - Un botón para "plantar" (registrar un evento positivo) y otro para "podar" (registrar un evento negativo).
   - Un modal o formulario para ingresar la descripción del evento.

3. **Componente `HistorialView`**:
   - Muestra una lista de todos los eventos del jardín del usuario, con la fecha, tipo y descripción.
   - Debe tener un filtro de fechas para ver el historial de una semana, un mes, etc.

**Instrucciones para la IA:**
- Genera el código completo de los componentes principales (`App.js`, `JardinView.js`, `HistorialView.js`, `Auth.js`).
- Usa un contexto global de React para manejar el estado de autenticación y los datos del jardín.
- Incluye los *hooks* de React (`useState`, `useEffect`, `useContext`) de manera profesional.
- Proporciona la estructura de carpetas sugerida para el proyecto.
- Asegúrate de que las llamadas a la API (`GET`, `POST`, `PUT`, `DELETE`) se manejen con Axios de manera asíncrona.
- Dame también las instrucciones para configurar el proyecto, instalar dependencias y cómo ejecutarlo.
