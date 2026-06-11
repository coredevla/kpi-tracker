# KPI Tracker — Especificación: PRI transversal + Monto en Bitácora

**Estado:** implementado · **Fase:** desarrollo (sin datos reales, sin despliegue aún)

## 1. Objetivo

Implementar `PRI` como **KPI transversal** (no como servicio del catálogo), calculado
automáticamente desde la bitácora con el campo `monto`. Ampliar reportes para mostrar en detalle
**cantidad** y **monto** por persona/servicio, con meta de PRI **por persona** y **consolidado
global** del equipo.

## 2. Glosario

- **PRI**: KPI de ingresos. Transversal: `Σ(monto)` de la bitácora según filtros. No es un servicio.
- **Monto**: dinero generado por un registro de bitácora (RD$, 2 decimales, `>= 0`).
- **Cantidad**: unidades vendidas/gestionadas (`>= 0`).
- **tipoGestion**: `'venta'` o `'reclamacion'`. Ambas **suman** al PRI.
- **Excedente**: `max(logrado - objetivo, 0)` — cuánto se superó la meta ("milla extra").

## 3. Reglas de negocio

- **R1** — Cada registro de bitácora tiene `cantidad` y `monto`.
- **R2** — `monto >= 0` (no negativos). Default `0`.
- **R3** — `cantidad >= 0` (se permite `0`).
- **R4** — `PRI_logrado = Σ(monto)` de registros filtrados.
- **R5** — `venta` y `reclamacion` ambas suman al PRI.
- **R6** — Objetivo de PRI en dinero y **por persona**.
- **R7** — Objetivo **global** = `Σ(objetivos individuales)` (derivado).
- **R8** — `%PRI_global = (Σ montos / Σ objetivos) × 100`; los excedentes compensan déficits.
- **R9** — Reportes muestran siempre **cantidad** y **monto**.
- **R10** — Filtros incluyen valores `0` (no excluir por checks `falsy`).
- **R11** — Representante solo ve su propio PRI; admin ve todo.
- **R12** — Moneda: **RD$** con **2 decimales**.

## 4. Modelo de datos

### Registro de bitácora (colección `ventas`)

Campos nuevos:

- `monto: number` — default `0`, `>= 0`.
- `tipoGestion: 'venta' | 'reclamacion'` — default `'venta'`.

### Objetivo PRI por persona (colección `metasPri`)

```
{ id, personalId, periodo (YYYY-MM), objetivoMonto, activo }
```

El objetivo global se deriva sumando los individuales en alcance.

## 5. UX/UI

- **Bitácora**: inputs `Monto` (min 0, step 0.01) y `Tipo de gestión`. Muestra `RD$ {monto}`.
- **Dashboard**: tarjeta independiente **"PRI · Ingresos"** (separada de las tarjetas por servicio).
- **Asignaciones**: sección de **Metas PRI** por persona y periodo (solo admin).
- **Reportes**: tabla persona/servicio con cantidad, monto y % contribución; tarjeta PRI del periodo;
  filtro por tipo de gestión; exportación a Excel y JSON con todos los campos.

## 6. Fórmulas

Ver [`KPI-CALCULOS.md`](./KPI-CALCULOS.md) (sección A.7).

## 7. Criterios de aceptación

- `cantidad=0` y `monto=0` válidos y visibles en reportes.
- `monto<0` o `cantidad<0` bloquean guardado.
- PRI = suma exacta de `monto`; venta y reclamación suman.
- Vista persona muestra PRI individual; vista global muestra consolidado (puede superar 100%).
- Excedente visible por persona en reportes.
- Representante solo ve su PRI; admin ve todo.
- Exportaciones (JSON + Excel) incluyen campos nuevos.
- Montos en `RD$` con 2 decimales.
