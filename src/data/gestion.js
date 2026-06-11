// Tipo de gestión de un registro de bitácora.
// Ambos suman al KPI transversal PRI (ingresos).

export const TIPO_GESTION = {
  VENTA: 'venta',
  RECLAMACION: 'reclamacion',
}

export const TIPO_GESTION_LABEL = {
  [TIPO_GESTION.VENTA]: 'Venta',
  [TIPO_GESTION.RECLAMACION]: 'Reclamación',
}
