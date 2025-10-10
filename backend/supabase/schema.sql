-- Esquema de la base de datos para Supabase (PostgreSQL)
-- Ejecutar este script en el editor SQL de Supabase.

create extension if not exists "uuid-ossp";

create table if not exists public.usuarios (
  id uuid primary key default uuid_generate_v4(),
  nombre_usuario text not null unique,
  email text not null unique,
  contrasena text not null,
  fecha_creacion timestamptz not null default timezone('utc', now())
);

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
