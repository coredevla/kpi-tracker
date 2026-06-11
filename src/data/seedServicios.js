// Catálogo inicial de servicios (KPIs) precargados.
// `objetivoMensual` es un valor sugerido por defecto; se ajusta luego en el mantenimiento.

export const CATEGORIAS = {
  MOVIL: 'Móvil',
  FIJO: 'Fijo',
  ACCESORIOS: 'Accesorios',
  OTRO: 'Otro',
}

export const seedServicios = [
  { nombre: 'PREPAGO', categoria: CATEGORIAS.MOVIL, color: '#3b90f6', objetivoMensual: 120 },
  { nombre: 'POSPAGO + NET', categoria: CATEGORIAS.MOVIL, color: '#2570eb', objetivoMensual: 80 },
  { nombre: 'POSPAGO', categoria: CATEGORIAS.MOVIL, color: '#1d59d8', objetivoMensual: 90 },
  { nombre: 'NET', categoria: CATEGORIAS.MOVIL, color: '#60b0fa', objetivoMensual: 70 },
  { nombre: 'UPGRADE', categoria: CATEGORIAS.MOVIL, color: '#7c3aed', objetivoMensual: 50 },
  { nombre: 'AUMENTO PLAN CON EQUIPO', categoria: CATEGORIAS.MOVIL, color: '#a855f7', objetivoMensual: 40 },
  { nombre: 'MIGRACIONES', categoria: CATEGORIAS.MOVIL, color: '#ec4899', objetivoMensual: 60 },
  { nombre: 'UPSELL FIJO', categoria: CATEGORIAS.FIJO, color: '#14b8a6', objetivoMensual: 45 },
  { nombre: 'GA + MIGRA FIJA', categoria: CATEGORIAS.FIJO, color: '#0d9488', objetivoMensual: 35 },
  { nombre: 'GA FIJO', categoria: CATEGORIAS.FIJO, color: '#0891b2', objetivoMensual: 40 },
  { nombre: 'MIGRACIONES FIJO', categoria: CATEGORIAS.FIJO, color: '#0e7490', objetivoMensual: 30 },
  { nombre: 'HFC &FIBRA', categoria: CATEGORIAS.FIJO, color: '#22c55e', objetivoMensual: 55 },
  { nombre: 'ACCESORIOS MÓVILES', categoria: CATEGORIAS.ACCESORIOS, color: '#f59e0b', objetivoMensual: 150 },
  { nombre: 'GA (HFC + FTTH)', categoria: CATEGORIAS.FIJO, color: '#16a34a', objetivoMensual: 50 },
  { nombre: 'PRI', categoria: CATEGORIAS.OTRO, color: '#64748b', objetivoMensual: 25 },
]
