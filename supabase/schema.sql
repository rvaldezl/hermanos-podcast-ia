-- =============================================================================
-- ESQUEMA DE BASE DE DATOS SUPABASE PARA PODCAST IA "@hermanosdelechemx"
-- Ejecuta este script en el SQL Editor de tu proyecto en https://supabase.com
-- =============================================================================

create table if not exists public.hermanos_episodes (
  id text primary key,
  video_id text not null,
  title text not null,
  url text not null default 'https://www.youtube.com/@hermanosdelechemx',
  category text not null default 'general',
  tags text[] not null default '{}',
  adrian_position text not null,
  lamole_position text not null,
  transcript_excerpts text[] not null default '{}',
  full_transcript_snippet text default '',
  source_type text not null default 'youtube-transcript',
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

-- Índice GIN para búsqueda rápida por etiquetas (ej. 'mujeres', 'exs', 'borrachos', 'regios')
create index if not exists idx_hermanos_episodes_tags on public.hermanos_episodes using gin (tags);

-- Índice de búsqueda de texto completo en español sobre títulos y posturas
create index if not exists idx_hermanos_episodes_fts on public.hermanos_episodes
using gin (
  to_tsvector('spanish', coalesce(title, '') || ' ' || coalesce(category, '') || ' ' || coalesce(adrian_position, '') || ' ' || coalesce(lamole_position, ''))
);

-- Habilitar acceso para la API REST (Row Level Security opcional o abierto para el backend)
alter table public.hermanos_episodes enable row level security;

drop policy if exists "Permitir lectura y escritura de episodios" on public.hermanos_episodes;
create policy "Permitir lectura y escritura de episodios"
  on public.hermanos_episodes
  for all
  using (true)
  with check (true);
