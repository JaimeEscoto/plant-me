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
  medalla_compras integer not null default 0,
  rol text not null default 'usuario'
);

alter table if exists public.usuarios
  add column if not exists rol text not null default 'usuario';

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

create table if not exists public.event_types (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  plant_delta integer not null default 0,
  remove_delta integer not null default 0,
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.event_type_translations (
  id uuid primary key default uuid_generate_v4(),
  event_type_id uuid not null references public.event_types(id) on delete cascade,
  language text not null,
  label text not null,
  constraint event_type_translations_unique unique (event_type_id, language)
);

create table if not exists public.event_categories (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.event_category_translations (
  id uuid primary key default uuid_generate_v4(),
  event_category_id uuid not null references public.event_categories(id) on delete cascade,
  language text not null,
  label text not null,
  constraint event_category_translations_unique unique (event_category_id, language)
);

create table if not exists public.plantas (
  id uuid primary key default uuid_generate_v4(),
  jardin_id uuid not null references public.jardines(id) on delete cascade,
  nombre text not null,
  categoria text not null,
  tipo text not null references public.event_types(code) on update cascade,
  fecha_plantado timestamptz not null default timezone('utc', now()),
  descripcion text
);

alter table if exists public.plantas drop constraint if exists plantas_tipo_check;
alter table if exists public.plantas drop constraint if exists plantas_tipo_fkey;
alter table if exists public.plantas
  add constraint plantas_tipo_fkey foreign key (tipo) references public.event_types(code) on update cascade;

alter table if exists public.plantas drop constraint if exists plantas_categoria_fkey;
alter table if exists public.plantas
  add constraint plantas_categoria_fkey foreign key (categoria) references public.event_categories(code) on update cascade;

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

insert into public.event_types (code, plant_delta, remove_delta, position)
values
  ('positivo', 5, -5, 0),
  ('negativo', -5, 5, 1),
  ('neutro', 0, -2, 2)
on conflict (code) do update
set
  plant_delta = excluded.plant_delta,
  remove_delta = excluded.remove_delta,
  position = excluded.position;

insert into public.event_type_translations (event_type_id, language, label)
select et.id, v.language, v.label
from public.event_types et
join (
  values
    ('positivo', 'es', 'Positivo'),
    ('positivo', 'en', 'Positive'),
    ('positivo', 'fr', 'Positif'),
    ('positivo', 'ar', 'إيجابي'),
    ('negativo', 'es', 'Negativo'),
    ('negativo', 'en', 'Negative'),
    ('negativo', 'fr', 'Négatif'),
    ('negativo', 'ar', 'سلبي'),
    ('neutro', 'es', 'Neutro'),
    ('neutro', 'en', 'Neutral'),
    ('neutro', 'fr', 'Neutre'),
    ('neutro', 'ar', 'محايد')
) as v(code, language, label) on v.code = et.code
on conflict (event_type_id, language) do update set label = excluded.label;

insert into public.event_categories (code, position)
values
  ('work', 0),
  ('relationships', 1),
  ('self-care', 2),
  ('health', 3),
  ('learning', 4),
  ('other', 5)
on conflict (code) do update
set
  position = excluded.position;

insert into public.event_category_translations (event_category_id, language, label)
select ec.id, v.language, v.label
from public.event_categories ec
join (
  values
    ('work', 'es', 'Trabajo'),
    ('work', 'en', 'Work'),
    ('work', 'fr', 'Travail'),
    ('work', 'ar', 'العمل'),
    ('relationships', 'es', 'Relaciones'),
    ('relationships', 'en', 'Relationships'),
    ('relationships', 'fr', 'Relations'),
    ('relationships', 'ar', 'العلاقات'),
    ('self-care', 'es', 'Autocuidado'),
    ('self-care', 'en', 'Self-care'),
    ('self-care', 'fr', 'Auto-soin'),
    ('self-care', 'ar', 'العناية الذاتية'),
    ('health', 'es', 'Salud'),
    ('health', 'en', 'Health'),
    ('health', 'fr', 'Santé'),
    ('health', 'ar', 'الصحة'),
    ('learning', 'es', 'Aprendizaje'),
    ('learning', 'en', 'Learning'),
    ('learning', 'fr', 'Apprentissage'),
    ('learning', 'ar', 'التعلم'),
    ('other', 'es', 'Otro'),
    ('other', 'en', 'Other'),
    ('other', 'fr', 'Autre'),
    ('other', 'ar', 'أخرى')
) as v(code, language, label) on v.code = ec.code
on conflict (event_category_id, language) do update set label = excluded.label;

insert into public.plantas (id, jardin_id, nombre, categoria, tipo, fecha_plantado, descripcion)
values
  (
    '519440fa-b80b-458a-a453-4c7f3d0698e9',
    'ee6d89ea-b79f-4268-8f95-0debf9818eb3',
    'Camino al trabajo sin tráfico',
    'work',
    'positivo',
    timezone('utc', now()) - interval '5 days',
    'La mañana fluyó con tranquilidad y llegué puntual a la oficina.'
  ),
  (
    '9819c548-9a76-4694-92b7-d5d2c824e0f7',
    'ee6d89ea-b79f-4268-8f95-0debf9818eb3',
    'Discusión con un colega',
    'relationships',
    'negativo',
    timezone('utc', now()) - interval '3 days',
    'Una conversación incómoda que me dejó con cierta tensión el resto del día.'
  ),
  (
    '09f0b641-156a-4d24-bf23-9d16169c8439',
    'ee6d89ea-b79f-4268-8f95-0debf9818eb3',
    'Sesión de meditación guiada',
    'self-care',
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
