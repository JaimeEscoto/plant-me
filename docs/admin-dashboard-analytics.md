# Analítica del panel administrativo

La ruta `GET /admin/dashboard` expone métricas consolidadas para la vista de administración. A continuación se describe cada bloque de datos, las tablas del frontend que los consumen y cómo se calculan.

## Resumen general
- **Usuarios registrados (`resumen.totalUsuarios`)**: total de filas en `usuarios`.
- **Semillas en circulación (`resumen.totalSemillas`)**: suma del campo `semillas` en `usuarios`.
- **Salud promedio del jardín (`resumen.saludPromedioJardines`)**: promedio del campo `estado_salud` en `jardines`.
- **Eventos registrados (`resumen.totalEventos`)**: total de registros en `plantas`.
- **Semillas transferidas (`resumen.totalSemillasTransferidas`)**: suma de `cantidad` en `semillas_transferencias` aceptadas.
- **Accesorios transferidos (`resumen.totalAccesoriosTransferidos`)**: suma de `cantidad` en `accesorios_transferencias` aceptadas.

El componente `SummaryCard` de `AdminDashboard.jsx` muestra estos indicadores en la fila superior.

## Métricas de semillas (`semillas`)
- **Listas principales (`topRemitentes`, `topDestinatarios`, `topMovimientos`)**: rankings calculados con `buildTopList`, que agrupa los totales enviados, recibidos y globales por `usuario_id`.
- **Transferencias recientes (`transferenciasRecientes`)**: últimas seis filas de `semillas_transferencias`, con la información del remitente y destinatario anidados.

En la interfaz se muestran tablas y barras horizontales para visualizar estos valores.

## Actividad de eventos (`eventos`)
- **Por tipo (`porTipo`)**: conteo agrupado por `tipo`.
- **Por categoría (`porCategoria`)**: conteo agrupado por `categoria`.
- **Usuarios destacados (`usuariosDestacados`, `usuariosDestacadosTabla`)**: rankings por total de plantas registradas; el primero limita a cinco usuarios para tarjetas destacadas y el segundo a veinte para la tabla completa.
- **Eventos recientes (`recientes`)**: últimas ocho plantas creadas con el usuario propietario.
- **Intercambio de accesorios (`accesoriosDestacados`)**: top de destinatarios de accesorios aceptados.

El frontend usa estos datos para graficar barras verticales y alimentar tablas comparativas.

## Salud y evolución (`salud`)
- **Promedio temporal (`promedioTemporal`)**: promedio diario de `estado_salud` por fecha (`ultima_modificacion`). Se utiliza en el gráfico de tendencia de salud.

## Segmento de usuarios (`usuarios`)
- **Distribución de semillas (`distribucionSemillas`)**: lista de usuarios con semillas totales y antigüedad en días, utilizada para el gráfico de dispersión.
- **Actividad de comunidad (`actividadComunidad`)**: totales de comentarios, likes y rol dentro del sistema de transferencias para el gráfico de burbujas.
- **Accesorios (`accesorios`)**: totales y porcentaje de usuarios con al menos un accesorio comprado, consumidos por el gráfico de anillos.
- **Top de amistades (`topAmigos`)**: ranking de usuarios por cantidad de amistades.
- **Embudo (`embudo`)**: métricas por etapa (registrados, con jardín, con planta) para el gráfico de embudo, con `promedioDiasPrimeraPlanta` como anotación.

## Campos derivados principales
- `antiguedad_dias`: diferencia en días entre `fecha_creacion` del usuario y la fecha actual.
- `totalInteracciones`: suma de comentarios y likes realizados por el usuario.
- `rol_transferencias`: etiqueta basada en si el usuario ha enviado, recibido o ambas cosas en transferencias de semillas aceptadas.

## Consideraciones
- Todas las agregaciones se calculan en memoria tras recuperar los conjuntos necesarios con `Promise.all`, minimizando rondas adicionales a la base de datos.
- Los valores numéricos se normalizan mediante `normalizeNumber` para evitar `NaN` en sumatorias.
- El frontend incluye formatos locales para números, fechas y porcentajes, y provee mensajes de fallback cuando no existen datos.

Con esta documentación se cubre la nueva estructura `usuarios`/`salud` integrada en `AdminDashboard.jsx` y el controlador `adminController.js`.
