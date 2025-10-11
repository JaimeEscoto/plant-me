-- Esquema de la base de datos para Supabase (PostgreSQL)
-- Ejecutar este script en el editor SQL de Supabase.

create extension if not exists "uuid-ossp";

create table if not exists public.usuarios (
  id uuid primary key default uuid_generate_v4(),
  nombre_usuario text not null unique,
  email text not null unique,
  contrasena text not null,
  fecha_creacion timestamptz not null default timezone('utc', now()),
  semillas integer not null default 0,
  medalla_compras integer not null default 0
);

create table if not exists public.usuario_accesorios (
  id uuid primary key default uuid_generate_v4(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  accesorio_id text not null,
  cantidad integer not null default 0 check (cantidad >= 0),
  fecha_actualizacion timestamptz not null default timezone('utc', now()),
  constraint usuario_accesorios_unicos unique (usuario_id, accesorio_id)
);

create table if not exists public.semillas_transferencias (
  id uuid primary key default uuid_generate_v4(),
  remitente_id uuid not null references public.usuarios(id) on delete cascade,
  destinatario_id uuid not null references public.usuarios(id) on delete cascade,
  cantidad integer not null check (cantidad > 0),
  mensaje text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aceptado', 'rechazado')),
  fecha_creacion timestamptz not null default timezone('utc', now())
);

create index if not exists semillas_transferencias_destinatario_idx on public.semillas_transferencias (destinatario_id);
create index if not exists semillas_transferencias_remitente_idx on public.semillas_transferencias (remitente_id);

create table if not exists public.accesorios_transferencias (
  id uuid primary key default uuid_generate_v4(),
  remitente_id uuid not null references public.usuarios(id) on delete cascade,
  destinatario_id uuid not null references public.usuarios(id) on delete cascade,
  accesorio_id text not null,
  cantidad integer not null check (cantidad > 0),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aceptado', 'rechazado')),
  fecha_creacion timestamptz not null default timezone('utc', now())
);

create index if not exists accesorios_transferencias_destinatario_idx on public.accesorios_transferencias (destinatario_id);
create index if not exists accesorios_transferencias_remitente_idx on public.accesorios_transferencias (remitente_id);

create table if not exists public.jardines (
  id uuid primary key default uuid_generate_v4(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  estado_salud integer not null default 50 check (estado_salud >= 0 and estado_salud <= 100),
  ultima_modificacion timestamptz not null default timezone('utc', now()),
  constraint jardines_usuario_unico unique (usuario_id)
);

create table if not exists public.plantas (
  id uuid primary key default uuid_generate_v4(),
  jardin_id uuid not null references public.jardines(id) on delete cascade,
  nombre text not null,
  categoria text not null,
  tipo text not null check (tipo in ('positivo', 'negativo', 'neutro')),
  fecha_plantado timestamptz not null default timezone('utc', now()),
  descripcion text
);

create index if not exists plantas_jardin_id_idx on public.plantas (jardin_id);
create index if not exists plantas_jardin_fecha_idx on public.plantas (jardin_id, fecha_plantado desc);

create table if not exists public.amistades (
  id uuid primary key default uuid_generate_v4(),
  usuario_a uuid not null references public.usuarios(id) on delete cascade,
  usuario_b uuid not null references public.usuarios(id) on delete cascade,
  fecha_creacion timestamptz not null default timezone('utc', now()),
  constraint amistades_unicas unique (usuario_a, usuario_b),
  constraint amistades_no_autovinculo check (usuario_a <> usuario_b),
  constraint amistades_orden check (usuario_a < usuario_b)
);

create index if not exists amistades_usuario_a_idx on public.amistades (usuario_a);
create index if not exists amistades_usuario_b_idx on public.amistades (usuario_b);

create table if not exists public.plantas_likes (
  id uuid primary key default uuid_generate_v4(),
  planta_id uuid not null references public.plantas(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  fecha_creacion timestamptz not null default timezone('utc', now()),
  constraint plantas_likes_unicos unique (planta_id, usuario_id)
);

create index if not exists plantas_likes_planta_idx on public.plantas_likes (planta_id);
create index if not exists plantas_likes_usuario_idx on public.plantas_likes (usuario_id);

create table if not exists public.plantas_comentarios (
  id uuid primary key default uuid_generate_v4(),
  planta_id uuid not null references public.plantas(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  contenido text not null,
  fecha_creacion timestamptz not null default timezone('utc', now())
);

create index if not exists plantas_comentarios_planta_idx on public.plantas_comentarios (planta_id);
create index if not exists plantas_comentarios_usuario_idx on public.plantas_comentarios (usuario_id);

create table if not exists public.comentarios_likes (
  id uuid primary key default uuid_generate_v4(),
  comentario_id uuid not null references public.plantas_comentarios(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  fecha_creacion timestamptz not null default timezone('utc', now()),
  constraint comentarios_likes_unicos unique (comentario_id, usuario_id)
);

create index if not exists comentarios_likes_comentario_idx on public.comentarios_likes (comentario_id);
create index if not exists comentarios_likes_usuario_idx on public.comentarios_likes (usuario_id);

-- ---------------------------------------------------------------------------
-- Datos de demostración
-- ---------------------------------------------------------------------------

insert into public.usuarios (id, nombre_usuario, email, contrasena, fecha_creacion)
values (
  '21dccfd0-b9de-46a1-b4b7-2797a0029a18',
  'test',
  'test@example.com',
  '$2a$10$fv9bUflgqaXIrW5OxaASTOC2WdXxmhOyj1khupuNu4.pDtg.2NhdK',
  timezone('utc', now()) - interval '21 days'
)
on conflict (id) do nothing;

update public.usuarios
set semillas = 120,
    medalla_compras = 3
where id = '21dccfd0-b9de-46a1-b4b7-2797a0029a18';

insert into public.jardines (id, usuario_id, estado_salud, ultima_modificacion)
values (
  'ee6d89ea-b79f-4268-8f95-0debf9818eb3',
  '21dccfd0-b9de-46a1-b4b7-2797a0029a18',
  78,
  timezone('utc', now()) - interval '2 days'
)
on conflict (id) do nothing;

insert into public.plantas (id, jardin_id, nombre, categoria, tipo, fecha_plantado, descripcion)
values
  (
    '519440fa-b80b-458a-a453-4c7f3d0698e9',
    'ee6d89ea-b79f-4268-8f95-0debf9818eb3',
    'Camino al trabajo sin tráfico',
    'Trabajo',
    'positivo',
    timezone('utc', now()) - interval '5 days',
    'La mañana fluyó con tranquilidad y llegué puntual a la oficina.'
  ),
  (
    '9819c548-9a76-4694-92b7-d5d2c824e0f7',
    'ee6d89ea-b79f-4268-8f95-0debf9818eb3',
    'Discusión con un colega',
    'Relaciones',
    'negativo',
    timezone('utc', now()) - interval '3 days',
    'Una conversación incómoda que me dejó con cierta tensión el resto del día.'
  ),
  (
    '09f0b641-156a-4d24-bf23-9d16169c8439',
    'ee6d89ea-b79f-4268-8f95-0debf9818eb3',
    'Sesión de meditación guiada',
    'Autocuidado',
    'positivo',
    timezone('utc', now()) - interval '1 days',
    'Tomé 20 minutos para respirar con calma y recargar energías.'
  )
on conflict (id) do nothing;

insert into public.usuario_accesorios (usuario_id, accesorio_id, cantidad)
values
  ('21dccfd0-b9de-46a1-b4b7-2797a0029a18', 'sombrero_floral', 1),
  ('21dccfd0-b9de-46a1-b4b7-2797a0029a18', 'maceta_arcoiris', 1)
on conflict (usuario_id, accesorio_id) do update set cantidad = excluded.cantidad;
