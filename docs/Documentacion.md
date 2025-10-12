# Actualización de la base de datos para almacenar fotos de plantas

Para resolver el error «No se pudo crear la planta en Supabase» al registrar una planta con foto, debes asegurarte de que la tabla `plantas` tenga la columna `foto`. Sigue estos pasos en el editor SQL de Supabase:

1. **Crear copia de seguridad (recomendado)**
   ```sql
   -- Exporta la tabla antes de modificarla
   select * from public.plantas;
   ```

2. **Agregar la columna `foto` si aún no existe**
   ```sql
   alter table public.plantas
     add column if not exists foto text;
   ```

3. **Verificar la estructura resultante**
   ```sql
   -- Confirma que la columna se añadió correctamente
   select column_name, data_type
   from information_schema.columns
   where table_name = 'plantas';
   ```

4. **Actualizar políticas de acceso (si usas RLS)**
   - Asegúrate de que las políticas de inserción/actualización permitan escribir en la nueva columna `foto`.
   - Si tienes políticas personalizadas, edítalas desde la sección *Auth → Policies* en Supabase para incluir el campo `foto` en las columnas permitidas.

5. **Guardar los cambios**
   - Ejecuta cada sentencia y confirma que no se reporten errores.
   - Prueba nuevamente la creación de la planta desde la aplicación.

> Nota: El archivo `backend/supabase/schema.sql` ya incluye la columna `foto`. Tras ejecutar los pasos anteriores, tu entorno remoto quedará alineado con el esquema del proyecto.
