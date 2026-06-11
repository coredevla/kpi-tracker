// Hash de contraseñas con Web Crypto (SHA-256 + salt).
//
// NOTA: al ser una app estática con datos en el navegador, esto NO es
// seguridad real (un usuario técnico puede manipular localStorage). Solo
// evita guardar la clave en texto plano. Para seguridad real, migrar a
// Supabase con autenticación y Row Level Security en el servidor.

function bufToHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function randomSalt(bytes = 16) {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return bufToHex(arr.buffer)
}

export async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return bufToHex(digest)
}

export async function verifyPassword(password, salt, expectedHash) {
  const hash = await hashPassword(password, salt)
  return hash === expectedHash
}
