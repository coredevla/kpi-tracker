# Configuración de plataforma (`app_config`)

La tabla **`app_config`** centraliza ajustes globales de KPI Tracker que no pertenecen al dominio de negocio (ventas, personal, servicios, etc.).

## Propósito

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `text` | Clave fija (`default`). Reservado para futuras particiones si hiciera falta. |
| `maintenance` | `boolean` | Si es `true`, la app muestra un overlay bloqueante en todos los usuarios (incluso antes del login). |
| `maintenanceMessage` | `text` | Mensaje mostrado durante el mantenimiento. |
| `clientVersion` | `text` | Última versión desplegada registrada por CI (referencia operativa). |
| `updatedAt` | `timestamptz` | Marca de última modificación (trigger `set_updated_at`). |

## Seguridad (RLS)

- **Lectura:** roles `anon` y `authenticated`. El overlay de mantenimiento debe funcionar en la pantalla de login sin sesión.
- **Escritura:** solo usuarios con rol **admin** (`es_admin()`).
- **CI/CD:** GitHub Actions usa la **service role key**, que bypass RLS, para activar/desactivar mantenimiento durante el deploy.

> La publishable/anon key del frontend es pública por diseño. Nunca incluyas la service role key en el código ni en `.env.local`.

## Mantenimiento manual

Desde el **SQL Editor** de Supabase:

```sql
-- Activar
update app_config
set maintenance = true,
    "maintenanceMessage" = 'Mantenimiento programado. Volvemos en 15 minutos.'
where id = 'default';

-- Desactivar
update app_config set maintenance = false where id = 'default';
```

También puedes editar la fila `default` desde **Table Editor** si eres admin en Supabase Dashboard.

## Integración con CI

El workflow `.github/workflows/deploy.yml`:

1. **Antes del build:** `maintenance = true`
2. **Después del deploy a Pages:** `maintenance = false` y `clientVersion = <versión de package.json>`

Requisito: secret **`SUPABASE_SERVICE_ROLE_KEY`** en GitHub → Settings → Secrets and variables → Actions.

Si el secret no está configurado, el workflow continúa pero emite un warning y no modifica `app_config`.

### Recuperación si el deploy falla con mantenimiento activo

Si el job falla después de activar mantenimiento, la app puede quedar bloqueada. Desactívalo manualmente:

```sql
update app_config set maintenance = false where id = 'default';
```

## Extensibilidad futura

Esta tabla puede crecer con columnas o filas adicionales (mensajes globales, límites temporales, etc.). Los **feature flags** están planificados como evolución separada; ver [`ROADMAP.md`](ROADMAP.md).

## Referencias en código

- Esquema: [`supabase/schema.sql`](../supabase/schema.sql)
- Servicio: [`src/services/platformConfig.js`](../src/services/platformConfig.js)
- UI: [`src/components/PlatformUpdateOverlay.vue`](../src/components/PlatformUpdateOverlay.vue)
