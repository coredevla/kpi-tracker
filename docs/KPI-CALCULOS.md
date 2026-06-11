# KPI Tracker — Documentación de cálculos KPI

> Fuente de verdad de **todas** las fórmulas de indicadores. Si cambia una fórmula en código,
> actualiza este documento en el mismo cambio.

## Índice

- [A.0 Bases de cálculo (días laborables)](#a0-bases-de-cálculo-días-laborables)
- [A.1 Objetivo de un servicio](#a1-objetivo-de-un-servicio-objetivode)
- [A.2 Logrado y ventas del día](#a2-logrado-y-ventas-del-día)
- [A.3 Indicadores por servicio (`computeKpi`)](#a3-indicadores-por-servicio-computekpi)
- [A.4 Totales del Dashboard](#a4-totales-del-dashboard)
- [A.5 Reportes](#a5-reportes)
- [A.6 Formato](#a6-formato)
- [A.7 PRI (KPI transversal de ingresos)](#a7-pri-kpi-transversal-de-ingresos)

---

## A.0 Bases de cálculo (días laborables)

Definidas en `src/utils/dates.js`. **Semana laboral = Lun–Sáb** (excluye domingo).

- `diasTotales = workingDaysInPeriod(periodo)` → días no-domingo del mes.
- `diasTranscurridos = max(workingDaysElapsed(periodo), 0)`:
  - periodo pasado → `diasTotales`
  - periodo futuro → `0`
  - periodo actual → días no-domingo hasta hoy (inclusive)
- `diasRestantes = max(diasTotales - diasTranscurridos, 0)`

---

## A.1 Objetivo de un servicio (`objetivoDe`)

Fuente: `src/composables/useKpi.js`.

```
objetivo(servicio) =
  Σ(asignacion.objetivoMensual)   // si hay asignaciones en el periodo (filtra por persona si aplica)
  ó servicio.objetivoMensual      // fallback, solo vista global (sin persona)
  ó 0                             // persona sin asignación
```

---

## A.2 Logrado y ventas del día

- `logrado = Σ(cantidad)` de registros con `{servicioId, periodo[, personalId]}`.
- `ventasHoy = Σ(cantidad)` con el mismo criterio + `fecha = hoy`.

Implementado vía `useVentasStore.totalCantidad(criteria)`.

---

## A.3 Indicadores por servicio (`computeKpi`)

Fuente: `src/composables/useKpi.js`.

| Indicador | Fórmula | Notas |
|-----------|---------|-------|
| `restante` | `max(objetivo - logrado, 0)` | nunca negativo |
| `pctLogrado` | `objetivo > 0 ? (logrado / objetivo) × 100 : 0` | evita división por 0 |
| `objetivoDiario` | `diasTotales > 0 ? objetivo / diasTotales : 0` | ritmo ideal constante |
| `metaDiaria` | `diasRestantes > 0 ? restante / diasRestantes : restante` | lo que falta por día |
| `pctMetaDiaria` | `metaDiaria > 0 ? (ventasHoy / metaDiaria) × 100 : (ventasHoy > 0 ? 100 : 0)` | cumplimiento del día |
| `proyectado` | `diasTranscurridos > 0 ? (logrado / diasTranscurridos) × diasTotales : 0` | cierre estimado al ritmo actual |
| `pctProyectado` | `objetivo > 0 ? (proyectado / objetivo) × 100 : 0` | — |

---

## A.4 Totales del Dashboard (`totales`)

Agrega todas las tarjetas de servicio:

```
objetivo   = Σ tarjetas.objetivo
logrado    = Σ tarjetas.logrado
restante   = Σ tarjetas.restante
ventasHoy  = Σ tarjetas.ventasHoy
proyectado = Σ tarjetas.proyectado
pctLogrado    = objetivo > 0 ? (logrado / objetivo) × 100 : 0
pctProyectado = objetivo > 0 ? (proyectado / objetivo) × 100 : 0
```

---

## A.5 Reportes (`ReportesView.vue`)

Cortes de 3/6/12 meses (`lastPeriods`).

- `objetivoPeriodo(p)`: Σ asignaciones del periodo (filtra persona); fallback global = Σ `objetivoMensual` de servicios activos.
- `logradoPeriodo(p) = totalCantidad({periodo[, personalId]})`.
- `montoPeriodo(p) = totalMonto({periodo[, personalId]})`.
- `pct fila = objetivo > 0 ? (logrado / objetivo) × 100 : 0`.
- `totalLogrado = Σ filas.logrado`, `totalObjetivo = Σ filas.objetivo`.
- `promedioCumplimiento`: promedio de `pct` solo de meses con `objetivo > 0`.
- `mejorMes`: fila con mayor `logrado`.
- `porServicio`: Σ `cantidad` y Σ `monto` por servicio en el rango (orden desc).
- `ranking`: Σ `cantidad` por persona en el rango (solo vista global, orden desc).

### Tabla por persona/servicio

Por cada combinación persona × servicio dentro del rango/filtros:

| Columna | Fórmula |
|---------|---------|
| Cantidad | `Σ(cantidad)` |
| Monto | `Σ(monto)` |
| % contribución al PRI | `priGlobal > 0 ? (monto / priGlobalLogrado) × 100 : 0` |

Más una **fila de totales** con el consolidado del equipo.

---

## A.6 Formato (`src/utils/format.js`)

- `num(v, dec=0)` → entero localizado `es-DO`.
- `pct(v, dec=1)` → `"NN,N%"`.
- `clampPct(v)` → acota a `[0, 100]` (barras/anillos de progreso).
- `money(v)` → `RD$` con **2 decimales** (`es-DO`).

---

## A.7 PRI (KPI transversal de ingresos)

PRI **no es un servicio**: es un KPI transversal calculado sobre la bitácora con el campo `monto`.
Reutiliza la misma lógica de `computeKpi`, pero alimentada con dinero.

| Indicador | Fórmula |
|-----------|---------|
| `priLogrado` | `Σ(monto)` de registros filtrados (periodo, persona, servicio, tipoGestion) |
| `priObjetivo` | `Σ(metasPri.objetivoMonto)` de las personas en alcance |
| `priRestante` | `max(priObjetivo - priLogrado, 0)` |
| `priExcedente` | `max(priLogrado - priObjetivo, 0)` |
| `pctPriLogrado` | `priObjetivo > 0 ? (priLogrado / priObjetivo) × 100 : 0` |
| `priObjetivoDiario` | `diasTotales > 0 ? priObjetivo / diasTotales : 0` |
| `priMetaDiaria` | `diasRestantes > 0 ? priRestante / diasRestantes : priRestante` |
| `priProyectado` | `diasTranscurridos > 0 ? (priLogrado / diasTranscurridos) × diasTotales : 0` |
| `pctPriProyectado` | `priObjetivo > 0 ? (priProyectado / priObjetivo) × 100 : 0` |

### Reglas

- `venta` y `reclamacion` **ambas suman** al PRI.
- `monto >= 0` siempre (no negativos). Valor inicial `0`.
- **Global = suma de individuales.** El % global puede superar 100% porque el excedente de
  unas personas compensa el déficit de otras ("milla extra").
