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
