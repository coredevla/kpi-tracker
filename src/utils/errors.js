// Traduce errores técnicos (Supabase / Postgres / red) a mensajes claros
// para usuarios no técnicos.

export function friendlyError(err, fallback = 'Ocurrió un error. Intenta de nuevo.') {
  const msg = (err && (err.message || err.error_description || err.details)) || ''
  const code = err?.code || err?.error_code || ''

  if (
    code === 'user_already_exists' ||
    /duplicate key|already exists|already registered|user already|unique constraint/i.test(msg)
  ) {
    return 'Ya existe un usuario con ese correo.'
  }
  if (/schema cache|column .* does not exist|could not find the/i.test(msg)) {
    return 'Hay un problema de configuración de datos. Avisa al administrador.'
  }
  if (/violates foreign key|foreign key constraint/i.test(msg)) {
    return 'No se puede completar: hay datos relacionados que dependen de este registro.'
  }
  if (/failed to fetch|networkerror|network error|fetch failed/i.test(msg)) {
    return 'Sin conexión con el servidor. Revisa tu internet e intenta de nuevo.'
  }
  if (/row-level security|rls|permission denied|not authorized|jwt/i.test(msg)) {
    return 'No tienes permiso para realizar esta acción.'
  }
  if (/^(Ya existe|Este correo|No se pudo crear la cuenta)/i.test(msg)) return msg
  return fallback
}
