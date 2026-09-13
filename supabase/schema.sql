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

-- Para el acceso del administrador, crear UN usuario en Supabase Auth.
-- La app transforma la cédula ingresada a: admin.<solo-digitos>@cv.local
-- y usa el PIN como contraseña. Conviene aumentar la longitud del PIN y
-- aplicar controles de intentos antes de usarlo en producción.
