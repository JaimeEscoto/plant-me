# Mi Jardín Mental

Este repositorio contiene una implementación de referencia para la aplicación "Mi Jardín Mental", compuesta por:

- **Backend**: API RESTful construida con Node.js, Express y Supabase (PostgreSQL gestionado).
- **Frontend**: SPA de demostración construida con React, Vite, Tailwind CSS, Axios y GSAP.

## ¿De qué trata la aplicación?

"Mi Jardín Mental" propone una metáfora sencilla para cultivar nuestro bienestar emocional. Cada vez que vivas una situación que te impacte —por ejemplo, un atasco interminable, un logro en el trabajo o un gesto amable— puedes entrar en la app y registrarla como un evento. Los eventos se clasifican por categoría (trabajo, relaciones, autocuidado, etc.) y se etiquetan como positivos o negativos.

Cada registro se traduce en el cuidado de una planta que simboliza tu estado interior: las experiencias positivas nutren tu jardín y hacen que crezca, mientras que las negativas lo desgastan. De esta forma obtienes un diario emocional visual que te ayuda a reconocer patrones, celebrar avances y detectar cuándo necesitas darte más cuidados.

## Estructura del proyecto

```
.
├── backend/              # API RESTful
├── frontend/             # SPA de demostración
├── plant.html            # (archivo previo en el repositorio)
└── prompts.md            # Prompts originales
```

---

## Backend

### Requisitos previos

- Node.js >= 18
- Una instancia de Supabase (PostgreSQL gestionado)

### Configuración

1. Copiar el archivo de variables de entorno:

   ```bash
   cd backend
   cp .env.example .env
   ```

2. Editar `.env` con los valores correctos de Supabase (`SUPABASE_URL` y `SUPABASE_ANON_KEY`) y el `JWT_SECRET`.

3. Crear el esquema de base de datos en Supabase ejecutando el script [`backend/supabase/schema.sql`](backend/supabase/schema.sql) en el editor SQL del proyecto. El script también inserta un usuario y un jardín de demostración para que puedas explorar la aplicación sin tener que registrar una cuenta manualmente.

4. Instalar dependencias:

   ```bash
   npm install
   ```

5. Iniciar el servidor (las tablas se gestionan directamente por Supabase):

   ```bash
   npm run dev
   ```

   El servidor escuchará en `http://localhost:4000` por defecto.

### Scripts disponibles

- `npm run dev`: Arranca el servidor con `nodemon`.
- `npm start`: Arranca el servidor en modo producción.

### Endpoints principales

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/jardin/`
- `POST /api/jardin/planta`
- `GET /api/jardin/historial`
- `PUT /api/jardin/planta/:id`
- `DELETE /api/jardin/planta/:id`
- `GET /api/economia/resumen`
- `GET /api/economia/accesorios`
- `POST /api/economia/accesorios/:id/comprar`
- `POST /api/economia/accesorios/:id/vender`
- `POST /api/economia/accesorios/:id/transferir`
- `POST /api/economia/accesorios/transferencias/:transferId/aceptar`
- `POST /api/economia/accesorios/transferencias/:transferId/rechazar`
- `POST /api/economia/semillas/transferir`
- `POST /api/economia/semillas/:transferId/aceptar`
- `POST /api/economia/semillas/:transferId/rechazar`

La documentación detallada se encuentra en los controladores y rutas del directorio `backend/src`.

---

## Frontend

### Requisitos previos

- Node.js >= 18

### Configuración

1. Crear el archivo de variables de entorno con la URL del backend (opcional):

   ```bash
   cd frontend
   cp .env.example .env
   ```

2. Instalar dependencias:

   ```bash
   npm install
   ```

3. Iniciar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

La aplicación quedará disponible en la URL indicada por Vite (por defecto `http://localhost:5173`).

### Scripts disponibles

- `npm run dev`: Arranca Vite en modo desarrollo.
- `npm run build`: Genera la versión de producción.
- `npm run preview`: Previsualiza la build.

El código principal se encuentra en `frontend/src`.

### Sistema de economía con semillas y accesorios

La aplicación incluye un sistema de economía lúdica que utiliza semillas como moneda virtual. Algunos aspectos destacados:

- Cada evento registrado en el jardín entrega semillas como recompensa.
- Existe una tienda con 10 accesorios cosméticos que se pueden comprar con semillas; cada compra genera un evento positivo en el jardín, mejora su salud y aumenta la medalla de compras del perfil.
- Los accesorios adquiridos se renderizan visualmente en la ilustración de la planta.
- Es posible vender accesorios (recibiendo el 50 % del precio original) o transferirlos a otra persona usuaria, quien debe aceptar el regalo para incorporarlo a su inventario.
- Las semillas también se pueden transferir entre usuarios a modo de regalo pendiente de aceptación.

### Usuario de prueba

Después de ejecutar el script de base de datos tendrás disponible el siguiente usuario para iniciar sesión y revisar datos de ejemplo:

- **Email**: `test@example.com`
- **Contraseña**: `test1234`

El usuario ya cuenta con un jardín y varios eventos registrados que permiten visualizar la experiencia completa nada más acceder.

---

## Notas

- Ajusta las políticas de CORS y los valores de salud del jardín según las necesidades del producto.
- Considera gestionar migraciones formales utilizando el CLI de Supabase o herramientas de PostgreSQL según tus necesidades.
- Tailwind CSS requiere ejecutar `npm run dev` para generar los estilos a partir de los `@tailwind` declarados en `index.css`.
