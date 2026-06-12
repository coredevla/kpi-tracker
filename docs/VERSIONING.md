# Versionado y actualizaciones en cliente

KPI Tracker usa **SemVer** (`MAJOR.MINOR.PATCH`) con fuente de verdad en [`package.json`](../package.json).

## Flujo de versión

```
package.json (1.2.0)
       │
       ├─► vite.config.js → VITE_APP_VERSION (embebida en el bundle)
       │
       └─► prebuild → public/version.json (publicado en GitHub Pages)
```

### Versión embebida (`VITE_APP_VERSION`)

- Se compila en el JavaScript que el usuario ya tiene cargado.
- Aparece en el footer: `KPI Tracker · v1.2.0 · Powered By Cherry Solutions`.

### Versión publicada (`version.json`)

- Generado por [`scripts/write-version-json.mjs`](../scripts/write-version-json.mjs) en cada `npm run build`.
- Contiene `{ "version": "...", "builtAt": "..." }`.
- El cliente hace poll cada **5 minutos** (y al montar la app) comparando con la versión embebida.
- Si difieren → banner con botón **Recargar** (`PlatformUpdateOverlay`).

## Publicar una nueva versión

1. Actualizar `version` en `package.json` según SemVer:
   - **PATCH** — correcciones compatibles.
   - **MINOR** — funcionalidad nueva compatible.
   - **MAJOR** — cambios incompatibles.
2. Documentar en [`CHANGELOG.md`](../CHANGELOG.md).
3. Commit y push a `main`.
4. GitHub Actions compila, publica y (con service role) actualiza `app_config.clientVersion`.

## Historial acordado

| Versión | Contenido principal |
|---------|---------------------|
| 1.0.0 | Release inicial Supabase + KPI + PRI |
| 1.0.1 | Fix logout y trigger perfiles |
| 1.1.0 | Manuales en app |
| 1.2.0 | `app_config`, overlay de plataforma, footer Cherry Solutions |

## Desarrollo local

- `npm run dev` usa `VITE_APP_VERSION` del `package.json` actual.
- `version.json` en `public/` puede estar desactualizado hasta ejecutar `npm run build` o `node scripts/write-version-json.mjs`.

## Nota sobre `app.js` export backup

El store `app` usa `version: 2` en el formato de export/import JSON de datos. Es **independiente** de la versión SemVer del producto.
