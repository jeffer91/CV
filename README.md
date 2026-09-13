# CV · Jefferson Villarreal

Aplicación web con dos áreas:

- **Perfil público:** `/<repo>/`
- **Administrador:** `/<repo>/admin/`

## Funciones incluidas

- Perfil profesional completo y navegable.
- Experiencia, formación, competencias, proyectos, publicaciones, cursos, idiomas y referencias.
- Evidencias/certificados con enlaces cuando estén cargados.
- Panel administrador protegido mediante Supabase Auth.
- Preparación para Storage de Supabase.
- 7 perfiles de CV especializados.
- Generador de CV de una sola página A4 con QR al perfil público.
- Impresión / guardado como PDF desde el navegador.

## Seguridad

El PIN **no está guardado en el repositorio**. El acceso del administrador se valida con Supabase Auth. El perfil público no muestra ningún enlace hacia el administrador.

## Supabase

1. Crear o seleccionar un proyecto Supabase.
2. Ejecutar `supabase/schema.sql`.
3. Crear el usuario administrador en Supabase Auth usando el correo interno indicado en `supabase/schema.sql` y el PIN como contraseña.
4. En la pantalla de acceso de `/admin/`, abrir **Conectar Supabase por primera vez** e ingresar la URL y la clave pública `anon`.

Nunca se debe usar la clave `service_role` en el navegador.

La foto actual se obtuvo del CV anterior proporcionado por el propietario del repositorio.
