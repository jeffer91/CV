-- CV Jefferson Villarreal · backend maestro
-- Ejecutar una sola vez en Supabase SQL Editor.
-- Nunca usar service_role en el navegador.

create table if not exists public.cv_master (
  id integer primary key,
  data jsonb not null default '{}'::jsonb,
  published boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.cv_master enable row level security;

drop policy if exists "cv_master_public_read" on public.cv_master;
create policy "cv_master_public_read" on public.cv_master
for select to public using (published = true);

drop policy if exists "cv_master_authenticated_insert" on public.cv_master;
create policy "cv_master_authenticated_insert" on public.cv_master
for insert to authenticated with check (true);

drop policy if exists "cv_master_authenticated_update" on public.cv_master;
create policy "cv_master_authenticated_update" on public.cv_master
for update to authenticated using (true) with check (true);

-- Evidencias visibles desde el CV.
insert into storage.buckets (id,name,public)
values ('evidencias-publicas','evidencias-publicas',true)
on conflict (id) do update set public=excluded.public;

drop policy if exists "evidencias_public_read" on storage.objects;
create policy "evidencias_public_read" on storage.objects
for select to public using (bucket_id='evidencias-publicas');

drop policy if exists "evidencias_auth_insert" on storage.objects;
create policy "evidencias_auth_insert" on storage.objects
for insert to authenticated with check (bucket_id='evidencias-publicas');

drop policy if exists "evidencias_auth_update" on storage.objects;
create policy "evidencias_auth_update" on storage.objects
for update to authenticated using (bucket_id='evidencias-publicas') with check (bucket_id='evidencias-publicas');

drop policy if exists "evidencias_auth_delete" on storage.objects;
create policy "evidencias_auth_delete" on storage.objects
for delete to authenticated using (bucket_id='evidencias-publicas');

-- Documentos sensibles: sin lectura pública.
insert into storage.buckets (id,name,public)
values ('documentos-privados','documentos-privados',false)
on conflict (id) do update set public=false;

drop policy if exists "privados_auth_select" on storage.objects;
create policy "privados_auth_select" on storage.objects
for select to authenticated using (bucket_id='documentos-privados');

drop policy if exists "privados_auth_insert" on storage.objects;
create policy "privados_auth_insert" on storage.objects
for insert to authenticated with check (bucket_id='documentos-privados');

drop policy if exists "privados_auth_update" on storage.objects;
create policy "privados_auth_update" on storage.objects
for update to authenticated using (bucket_id='documentos-privados') with check (bucket_id='documentos-privados');

drop policy if exists "privados_auth_delete" on storage.objects;
create policy "privados_auth_delete" on storage.objects
for delete to authenticated using (bucket_id='documentos-privados');

-- Acceso administrador:
-- crear un usuario en Supabase Auth con correo:
-- admin.<cedula-solo-digitos>@cv.jeffersonvillarreal.com
-- y usar el PIN como contraseña.
