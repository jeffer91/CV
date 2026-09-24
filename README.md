# CV · Jefferson Villarreal

Sistema de CV maestro con múltiples perfiles públicos y un panel privado de administración.

## Estructura

- `/` — selector general de perfiles.
- `/coordinador-academico/`, `/docencia-mecatronica/`, `/fablab/`, etc. — CV públicos especializados.
- `/admin/` — administración de perfil, experiencia, docencia, formación, cursos, proyectos, publicaciones, perfiles, evidencias y documentos privados.
- Supabase — autenticación, base maestra JSON y almacenamiento de archivos.

## Fuente de datos

`js/data.js` es un respaldo inicial. Una vez configurado Supabase, el administrador publica la versión maestra en la tabla `cv_master`. Los perfiles públicos cargan esa versión automáticamente.

## Seguridad

- Nunca guardar PIN, contraseña o `service_role` en GitHub.
- La cédula solo se usa en el formulario de acceso para derivar el correo interno del administrador.
- `evidencias-publicas`: títulos y certificados que sí pueden mostrarse.
- `documentos-privados`: identificación y documentos sensibles; no tienen lectura pública.

## Configuración inicial

1. Crear/seleccionar proyecto Supabase.
2. Ejecutar `supabase/schema.sql`.
3. Crear el usuario administrador en Supabase Auth.
4. Entrar a `/admin/` y usar “Conectar Supabase por primera vez”.
5. Publicar el borrador maestro.
6. GitHub Actions despliega automáticamente el sitio a GitHub Pages desde `main`.

## Perfiles incluidos

Educación y gestión: Coordinación Académica, Titulación, Calidad, Gestión Académica, Investigación/Innovación y Educación Continua.

Docencia: Mecatrónica, Electrónica, Industrial, Redes/Telecom, Automotriz, Motos e Investigación.

Ingeniería/industria: Mecatrónica, Electrónica/Automatización, Industrial, Procesos, FabLab y Proyectos.

Negocios: Marketing, Marketing Digital/SEO y Ventas.


## Despliegue

GitHub Pages: activo con GitHub Actions.
