# Roadmap · KPI Tracker

Elementos planificados que **no** forman parte del alcance actual.

## Feature flags (TO-BE)

**Estado:** no implementado en v1.2.0. Documentado para una iteración futura más robusta.

### Objetivo

Activar o desactivar funcionalidades sin redeploy, con control por rol o porcentaje de usuarios.

### Diseño propuesto (borrador)

| Componente | Responsabilidad |
|------------|-----------------|
| Tabla `feature_flags` o JSON en `app_config` | Clave, `enabled`, `rolloutPercent`, `roles[]`, `expiresAt` |
| `platformConfig.js` | `fetchFeatureFlags()` con caché TTL en cliente |
| Composable `useFeatureFlag(key)` | Evaluación reactiva en vistas |
| Panel admin (vista o Supabase Table Editor) | Toggle sin tocar código |

### Alternativas a evaluar

- Extensión de `app_config` con columna `flags jsonb`
- Supabase Edge Function como evaluador centralizado
- Servicio externo (LaunchDarkly, Unleash, Flagsmith)

### Criterios de aceptación futuros

- [ ] Flag desactivado oculta ruta/menú sin error 404
- [ ] Cambio de flag visible en cliente en ≤ TTL configurado
- [ ] Auditoría de quién cambió qué flag y cuándo
- [ ] Documentación en `docs/FEATURE_FLAGS.md`

---

## Alcance actual (v1.2.0)

- Mantenimiento vía `app_config.maintenance`
- Detección de nueva versión vía `version.json` + `PlatformUpdateOverlay`
- Sin flags de funcionalidad en runtime

Ver [`APP_CONFIG.md`](APP_CONFIG.md) y [`VERSIONING.md`](VERSIONING.md).
