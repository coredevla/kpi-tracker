# Changelog

Todas las modificaciones notables de **KPI Tracker** se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y el proyecto usa [SemVer](https://semver.org/lang/es/).

## [1.2.0] - 2026-06-11

### Añadido
- Tabla **`app_config`** en Supabase: mantenimiento, mensaje personalizable y `clientVersion` desplegada.
- **`version.json`** generado en cada build (`prebuild`) con versión SemVer y timestamp.
- **`VITE_APP_VERSION`** inyectada en el bundle desde `package.json`.
- Capa de plataforma (SOLID):
  - `src/services/platformConfig.js` — lectura de config remota y versión publicada.
  - `src/composables/usePlatformUpdate.js` — polling y estados de mantenimiento/actualización.
  - `src/components/PlatformUpdateOverlay.vue` — overlay bloqueante (mantenimiento) y aviso de nueva versión.
- Footer con versión visible y crédito **Powered By Cherry Solutions** (app y login).
- CI: activar/desactivar mantenimiento y sincronizar `clientVersion` en cada deploy (requiere `SUPABASE_SERVICE_ROLE_KEY`).
- Documentación: [`docs/APP_CONFIG.md`](docs/APP_CONFIG.md), [`docs/VERSIONING.md`](docs/VERSIONING.md), [`docs/ROADMAP.md`](docs/ROADMAP.md).

### Cambiado
- Versión del producto elevada a **1.2.0** (SemVer de tres segmentos).

### Corregido
- Alta de usuarios: validación previa por correo duplicado o cuenta inactiva, con mensajes claros (Auth `user_already_exists` y perfil `activo = false`).
- Manual admin § 3.4: procedimiento desde **Usuarios → Ver inactivos → Activar** cuando el correo ya existe.

## [1.1.0] - 2026-06-10

### Añadido
- Manuales de usuario integrados en la app (`/manual`, `/manual/admin`) con Markdown, placeholders SVG y enlaces **Ayuda** en la navbar.
- Script `npm run manual:placeholders` para regenerar capturas placeholder.

## [1.0.1] - 2026-06-09

### Corregido
- Logout: `await auth.logout()` antes de navegar y limpieza de datos en store.
- Trigger `handle_new_user` y políticas RLS en `perfiles` para creación de usuarios vía Auth.

## [1.0.0] - 2026-06-08

### Añadido
- Release inicial **KPI Tracker**: Dashboard, Bitácora, Reportes, Personal, Servicios, Asignaciones, Usuarios.
- **PRI** como KPI transversal de ingresos (`Σ monto` en RD$), metas PRI por persona, export Excel.
- Backend **Supabase** (Postgres + Auth + RLS), login email/contraseña, roles admin/representante.
- Driver de datos abstracto (`local` / `supabase`), despliegue GitHub Pages, tema claro/oscuro.
- Documentación de cálculos: [`docs/PRI-KPI.md`](docs/PRI-KPI.md), [`docs/KPI-CALCULOS.md`](docs/KPI-CALCULOS.md).

[1.2.0]: https://github.com/coredevla/kpi-tracker/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/coredevla/kpi-tracker/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/coredevla/kpi-tracker/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/coredevla/kpi-tracker/releases/tag/v1.0.0
