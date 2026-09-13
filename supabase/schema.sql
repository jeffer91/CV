-- CV Jefferson Villarreal · configuración base de Supabase
-- Ejecutar en el SQL Editor después de crear el proyecto.
-- IMPORTANTE: no guardar PIN ni service_role en GitHub.

-- Bucket público de certificados/evidencias.
insert into storage.buckets (id, name, public)
values ('certificados', 'certificados', true)
on conflict (id) do update set public = excluded.public;

-- Lectura pública de evidencias.
drop policy if exists "certificados_public_read" on storage.objects;
create policy "certificados_public_read"
on storage.objects for select
to public
using (bucket_id = 'certificados');

-- Solo usuarios autenticados pueden cargar evidencias.
drop policy if exists "certificados_authenticated_insert" on storage.objects;
create policy "certificados_authenticated_insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'certificados');

-- Solo usuarios autenticados pueden actualizar/eliminar evidencias.
drop policy if exists "certificados_authenticated_update" on storage.objects;
create policy "certificados_authenticated_update"
on storage.objects for update
to authenticated
using (bucket_id = 'certificados')
with check (bucket_id = 'certificados');

drop policy if exists "certificados_authenticated_delete" on storage.objects;
create policy "certificados_authenticated_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'certificados');

-- Relación pública entre cada título/curso y su archivo de evidencia.
create table if not exists public.evidence_links (
  entity_type text not null check (entity_type in ('education','course')),
  entity_id text not null,
  public_url text not null,
  updated_at timestamptz not null default now(),
  primary key (entity_type, entity_id)
);

alter table public.evidence_links enable row level security;

drop policy if exists "evidence_links_public_read" on public.evidence_links;
create policy "evidence_links_public_read"
on public.evidence_links for select
to public
using (true);

drop policy if exists "evidence_links_authenticated_insert" on public.evidence_links;
create policy "evidence_links_authenticated_insert"
on public.evidence_links for insert
to authenticated
with check (true);

drop policy if exists "evidence_links_authenticated_update" on public.evidence_links;
create policy "evidence_links_authenticated_update"
on public.evidence_links for update
to authenticated
using (true)
with check (true);

drop policy if exists "evidence_links_authenticated_delete" on public.evidence_links;
create policy "evidence_links_authenticated_delete"
on public.evidence_links for delete
to authenticated
using (true);

-- Para el acceso del administrador, crear UN usuario en Supabase Auth.
-- La app transforma la cédula ingresada a:
-- admin.<solo-digitos>@cv.jeffersonvillarreal.com
-- y usa el PIN como contraseña.
-- Conviene aplicar protección contra intentos repetidos y considerar un PIN
-- más largo si el administrador se expone directamente a Internet.
