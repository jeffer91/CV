# CV · Jefferson Villarreal

Aplicación web con dos áreas:

- **Perfil público:** `/<repo>/`
- **Administrador:** `/<repo>/admin/`

## Funciones incluidas

- Perfil profesional completo y navegable.
- Experiencia, formación, competencias, proyectos, publicaciones, cursos, idiomas y referencias.
- Evidencias/certificados con enlaces cuando estén cargados.
- Panel administrador.
- Preparación para autenticación y Storage de Supabase.
- 7 perfiles de CV especializados.
- Generador de CV de una sola página A4 con QR al perfil público.
- Impresión / guardado como PDF desde el navegador.
- Modo local para preparar la información antes de conectar Supabase.

## Seguridad

El PIN **no está guardado en el repositorio**. El login de producción debe validarse con Supabase Auth.

## Supabase

1. Crear/conectar un proyecto Supabase.
2. Ejecutar `supabase/schema.sql`.
3. Crear el usuario administrador en Supabase Auth.
4. En `/admin/`, pestaña **Conexión**, cargar la URL y la clave pública `anon`.

La foto actual se obtuvo del CV anterior proporcionado por el propietario del repositorio.
