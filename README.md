# Mi Jardín Mental

Este repositorio contiene una implementación de referencia para la aplicación "Mi Jardín Mental", compuesta por:

- **Backend**: API RESTful construida con Node.js, Express, PostgreSQL y Sequelize.
- **Frontend**: SPA de demostración construida con React, Vite, Tailwind CSS, Axios y GSAP.

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
- PostgreSQL >= 13

### Configuración

1. Copiar el archivo de variables de entorno:

   ```bash
   cd backend
   cp .env.example .env
   ```

2. Editar `.env` con los valores correctos de la base de datos y el `JWT_SECRET`.

3. Instalar dependencias:

   ```bash
   npm install
   ```

4. Ejecutar migraciones automáticas (a través de `sequelize.sync()` en el arranque) iniciando el servidor:

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

---

## Notas

- Ajusta las políticas de CORS y los valores de salud del jardín según las necesidades del producto.
- Considera implementar migraciones formales con Sequelize CLI para entornos productivos.
- Tailwind CSS requiere ejecutar `npm run dev` para generar los estilos a partir de los `@tailwind` declarados en `index.css`.
