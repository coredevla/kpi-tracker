import { ref, onMounted, onUnmounted } from 'vue'
import { fetchAppConfig, fetchDeployedVersion, getEmbeddedVersion } from '@/services/platformConfig'

const POLL_MS = 5 * 60 * 1000

export function usePlatformUpdate() {
  const maintenance = ref(false)
  const maintenanceMessage = ref('')
  const updateAvailable = ref(false)
  const embeddedVersion = getEmbeddedVersion()
  const remoteVersion = ref(null)

  async function refresh() {
    try {
      const cfg = await fetchAppConfig()
      maintenance.value = !!cfg.maintenance
      maintenanceMessage.value =
        cfg.maintenanceMessage || 'Estamos actualizando la plataforma. Vuelve en unos minutos.'
    } catch {
      // No bloquear la app si falla la lectura de config.
    }

    if (maintenance.value) return

    try {
      const deployed = await fetchDeployedVersion()
      remoteVersion.value = deployed
      updateAvailable.value = deployed !== embeddedVersion
    } catch {
      // Offline o caché; el usuario sigue con la versión embebida.
    }
  }

  function reloadApp() {
    window.location.reload()
  }

  let timer

  onMounted(() => {
    refresh()
    timer = setInterval(refresh, POLL_MS)
  })

  onUnmounted(() => clearInterval(timer))

  return {
    maintenance,
    maintenanceMessage,
    updateAvailable,
    embeddedVersion,
    remoteVersion,
    reloadApp,
    refresh,
  }
}
