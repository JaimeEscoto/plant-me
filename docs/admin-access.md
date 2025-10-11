# Acceso administrativo

Este documento resume cómo habilitar y acceder al panel administrativo de Mi Jardín Mental.

## 1. Requisitos previos

1. Tener la API en funcionamiento con las variables de entorno configuradas (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `JWT_SECRET`, etc.).
2. Contar con acceso al proyecto de Supabase usado por la aplicación.
3. Verificar que la tabla `usuarios` tiene la columna `rol` con valor por defecto `usuario`.
   - El archivo [`backend/supabase/schema.sql`](../backend/supabase/schema.sql) ya incluye la creación de la columna.
   - Si tu instancia de Supabase se creó antes de esta actualización, ejecuta el siguiente comando en el editor SQL de Supabase para asegurarte de que exista la columna:

   ```sql
   alter table if exists public.usuarios
     add column if not exists rol text not null default 'usuario';
   ```

## 2. Crear o actualizar un usuario administrador

1. En el editor SQL de Supabase, localiza el usuario que deseas promover a administrador.
2. Ejecuta la siguiente consulta reemplazando `<ID_DEL_USUARIO>` por el `id` del usuario:

   ```sql
   update public.usuarios
      set rol = 'admin'
    where id = '<ID_DEL_USUARIO>';
   ```

   También puedes crear un nuevo usuario directamente con el rol `admin` insertando un registro en la tabla `usuarios` y, posteriormente, creando su jardín en la tabla `jardines`.

## 3. Inicio de sesión como administrador

1. Inicia sesión en la aplicación web utilizando el email y contraseña del usuario con rol `admin`.
2. El backend adjuntará la información del rol en el token de autenticación.
3. Al navegar, la interfaz detectará que el usuario tiene rol `admin` y mostrará el acceso al panel administrativo.

## 4. Resolución de problemas comunes

- **Los listados del panel muestran errores 500**: confirma que el usuario autenticado tiene `rol = 'admin'` y que la columna `rol` existe en Supabase.
- **No aparecen datos para usuarios nuevos**: asegúrate de haber ejecutado el script completo de `schema.sql` para crear el jardín y los registros iniciales.

Con estos pasos deberías poder gestionar el acceso administrativo sin inconvenientes.
