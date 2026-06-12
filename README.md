# KPI Tracker · Trazabilidad de Metas

SPA (Single Page Application) para llevar la trazabilidad y el cálculo de metas tipo **KPI** de vendedoras de servicios.

Construida con **Vue 3 + Vite + Tailwind CSS + Pinia + Vue Router + Chart.js**, con estilo empresarial moderno, tarjetas 3D, transiciones de página y animaciones al hacer scroll. Lista para publicarse en **GitHub Pages**.

## 🔐 Acceso y roles

- **Login** con **correo y contraseña** mediante **Supabase Auth**. No hay credenciales por defecto: el primer administrador se crea una sola vez desde Supabase (ver *Primer administrador*).
- **Roles** (guardados en la tabla `perfiles`, 1:1 con `auth.users`):
  - **Administrador**: ve y gestiona todo sin restricciones (incluida la gestión de usuarios y roles).
  - **Representante de venta**: solo accede a Dashboard, Bitácora y Reportes, y **únicamente con los datos de su propia persona** (gobernanza de datos). Puede registrar, editar y eliminar sus propias ventas.
- Solo el admin puede crear usuarios y asignar roles (vista **Usuarios**). Cada representante se enlaza a un registro de **Personal** existente.

> 🔒 La seguridad real la imponen las políticas **Row Level Security (RLS)** de Supabase (ver `supabase/schema.sql`). La `anon`/publishable key del frontend es pública por diseño; **nunca** se incluye la *secret key*.

### Primer administrador (una sola vez)

1. Supabase → **Authentication → Users → Add user** → correo + contraseña (marca **"Auto Confirm User"**).
2. El trigger crea su perfil con rol `representante`. Súbelo a admin en el **SQL Editor**:

```sql
update perfiles set rol = 'admin' where email = 'tucorreo@empresa.com';
```

## ✨ Características

- **Dashboard** con tarjetas 3D por servicio: objetivo, logrado, restante, % diario de cumplimiento, % logrado vs objetivo, meta diaria, proyectado y total general.
- **PRI · Ingresos**: KPI **transversal** de dinero, calculado automáticamente desde la bitácora como `Σ(monto)`. Tarjeta independiente en el Dashboard con objetivo, logrado, restante, excedente y proyección, todo en **RD$**.
- **Bitácora diaria**: registro de cada servicio con cliente, numeración (CARD / línea / contrato), **cantidad**, **monto (RD$)** y **tipo de gestión** (venta / reclamación), agrupado por servicio.
- **Reportes**: cortes mensuales y evaluación de performance por persona en periodos de **3, 6 o 12 meses**, ranking de vendedoras, **tabla por persona/servicio** (cantidad, monto y % de contribución al PRI) y **exportación a Excel**.
- **Mantenimiento de Servicios (KPI)** con softdelete (activo sí/no), categoría, objetivo mensual y color.
- **Mantenimiento de Personal** con softdelete.
- **Asignaciones** Personal ⇄ Servicio por periodo, con generación masiva.
- **Respaldo**: exportar/importar todos los datos en JSON.
- Tema claro/oscuro.

## 🗂️ Servicios precargados

PREPAGO · POSPAGO + NET · POSPAGO · NET · UPGRADE · AUMENTO PLAN CON EQUIPO · MIGRACIONES · UPSELL FIJO · GA + MIGRA FIJA · GA FIJO · MIGRACIONES FIJO · HFC &FIBRA · ACCESORIOS MÓVILES · GA (HFC + FTTH) · PRI

## 🚀 Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # build de producción en /dist
npm run preview  # previsualizar el build
```

## 💾 Persistencia de datos

Arquitectura con **capa de repositorios abstracta** (`src/data/repositories/`) que se elige con la variable `VITE_DATA_DRIVER`:

- `local` → `LocalStorage` (modo offline / desarrollo rápido).
- `supabase` → backend real con **Supabase** (Postgres + Auth + RLS).

Cambiar de backend no requiere tocar componentes ni stores: solo la variable de entorno. Las credenciales se configuran en `.env.local` (ver `.env.example`).

## 📖 Manuales de usuario (en la app)

Tras iniciar sesión, usa **Ayuda** en el menú (manual representante) o **Manual admin** (solo administradores).

Los archivos fuente están en `public/manual/`:

- `public/manual/representante/index.md` + `imagenes/` (7 capturas)
- `public/manual/admin/index.md` + `imagenes/` (14 capturas)

Sustituye cada `.svg` placeholder por tu captura real (`.png` recomendado) y actualiza las extensiones en `index.md`. Regenerar placeholders: `npm run manual:placeholders`.

## 📦 Publicar en GitHub Pages

1. Sube el proyecto a un repositorio de GitHub (rama `main`).
2. En **Settings → Pages**, selecciona **Source: GitHub Actions**.
3. El workflow `.github/workflows/deploy.yml` compila y publica automáticamente en cada push a `main`. El `base` de Vite se ajusta solo al nombre del repositorio.

> La app usa *hash history* (`/#/ruta`), por lo que funciona en GitHub Pages sin errores 404 al refrescar.

### Secrets de GitHub Actions

| Secret | Uso |
|--------|-----|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase (build) |
| `VITE_SUPABASE_ANON_KEY` | Publishable key (build) |
| `SUPABASE_SERVICE_ROLE_KEY` | Toggle de mantenimiento y sync de `clientVersion` en deploy (**solo CI**) |

Si falta `SUPABASE_SERVICE_ROLE_KEY`, el deploy sigue pero no activa el overlay de mantenimiento automático. Ver [`docs/APP_CONFIG.md`](docs/APP_CONFIG.md).

## 🔄 Versión y actualizaciones

- Versión SemVer en `package.json`; footer muestra `vX.Y.Z` y **Powered By Cherry Solutions**.
- Tras un deploy, los usuarios con la app abierta ven un aviso para recargar cuando hay versión nueva.
- Detalle: [`docs/VERSIONING.md`](docs/VERSIONING.md) · Config plataforma: [`docs/APP_CONFIG.md`](docs/APP_CONFIG.md) · Roadmap: [`docs/ROADMAP.md`](docs/ROADMAP.md)

## 📐 Cálculos KPI

Por servicio y periodo (semana laboral Lun–Sáb por defecto):

| Indicador | Fórmula |
|-----------|---------|
| Restante | `objetivo - logrado` |
| % Logrado vs Objetivo | `logrado / objetivo × 100` |
| Objetivo diario | `objetivo / días laborables del mes` |
| Meta diaria | `restante / días laborables restantes` |
| % Meta diaria | `ventas del día / meta diaria × 100` |
| Proyectado | `(logrado / días transcurridos) × días totales` |
| % Proyectado | `proyectado / objetivo × 100` |

### PRI (KPI transversal de ingresos)

`PRI` no es un servicio: se calcula sobre la bitácora usando el campo `monto`.

| Indicador | Fórmula |
|-----------|---------|
| PRI logrado | `Σ(monto)` de los registros filtrados |
| PRI objetivo | `Σ(metasPri.objetivoMonto)` de las personas en alcance |
| PRI restante | `max(objetivo - logrado, 0)` |
| PRI excedente | `max(logrado - objetivo, 0)` |
| % PRI | `logrado / objetivo × 100` (puede superar 100% por compensación entre personas) |

> La meta de PRI se fija **por persona** (en *Asignaciones*); el objetivo global es la suma de las individuales. Ventas y reclamaciones **ambas suman**. Ver [`docs/KPI-CALCULOS.md`](docs/KPI-CALCULOS.md).

## 🧱 Estructura

```
src/
├── assets/main.css          # Tailwind + estilos/animaciones
├── components/              # Card3D, KpiCard, PlatformUpdateOverlay, navbar, ...
├── composables/             # useKpi, usePlatformUpdate, useManual, ...
├── services/                # platformConfig (config remota y version.json)
├── data/
│   ├── seedServicios.js     # 15 servicios precargados
│   ├── supabaseClient.js    # cliente Supabase (Auth + datos)
│   └── repositories/        # capa de datos abstracta (LocalStorage / Supabase)
├── stores/                  # Pinia: personal, servicios, asignaciones, ventas, pri, usuarios, auth, app, toast
├── utils/                   # fechas, formato y mensajes de error
├── views/                   # Dashboard, Bitácora, Reportes, Personal, Servicios, Asignaciones
└── router/
```
