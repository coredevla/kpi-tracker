# Changelog

Todas las modificaciones notables de **KPI Tracker** se documentan en este archivo.

## [No publicado]

### Añadido
- **Driver de datos Supabase (Fase A)**: nueva clase `SupabaseRepository` con el mismo contrato que
  `LocalStorageRepository`, seleccionable con `VITE_DATA_DRIVER=supabase`. Incluye `supabaseClient.js`,
  esquema SQL (`supabase/schema.sql`) y `.env.example`. Ningún store ni componente requirió cambios.
- **PRI como KPI transversal de ingresos**: nuevo indicador calculado automáticamente desde la
  bitácora como `Σ(monto)`, independiente del catálogo de servicios.
- **Campo `monto`** (RD$, 2 decimales, `>= 0`) en cada registro de bitácora.
- **Campo `tipoGestion`** (`venta` / `reclamacion`) en bitácora; ambas suman al PRI.
- **Metas PRI por persona/periodo** (colección `metasPri`), editables por admin en *Asignaciones*.
  El objetivo global se deriva como suma de los individuales.
- **Tarjeta "PRI · Ingresos"** independiente en el Dashboard, sensible a filtros y a la gobernanza
  de datos (representante ve solo lo suyo).
- **Reportes ampliados**: tabla por persona/servicio con cantidad, monto y % de contribución al PRI,
  fila de totales, filtro por tipo de gestión y métricas PRI (objetivo, logrado, excedente, %).
- **Exportación a Excel** (`.xlsx`) de los reportes, incluyendo monto, tipo de gestión y métricas PRI.
- `money()` en `src/utils/format.js` para formato `RD$` con 2 decimales.
- Documentación: `docs/PRI-KPI.md` (especificación) y `docs/KPI-CALCULOS.md` (todas las fórmulas).

### Cambiado
- **Renombrado el producto de "KPI Telecom" a "KPI Tracker"** en toda la interfaz y metadatos.
- **Namespace de `localStorage` unificado** bajo el prefijo `kpi-tracker:` (sesión, tema y datos).
- Versión del respaldo (export/import) elevada a `2`, incluyendo las nuevas colecciones y campos.

### Notas
- Fase de desarrollo: no se incluye migración de datos legacy. Al cambiar el esquema/namespace se
  parte de un `localStorage` limpio (resiembra automática del admin y los servicios).
