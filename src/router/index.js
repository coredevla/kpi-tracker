import { createRouter, createWebHashHistory } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

// Hash history -> imprescindible para GitHub Pages (sin 404 al refrescar rutas).
const routes = [
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { title: 'Iniciar sesión', public: true, layout: 'blank' } },
  { path: '/', name: 'dashboard', component: () => import('@/views/DashboardView.vue'), meta: { title: 'Dashboard' } },
  { path: '/bitacora', name: 'bitacora', component: () => import('@/views/BitacoraView.vue'), meta: { title: 'Bitácora diaria' } },
  { path: '/reportes', name: 'reportes', component: () => import('@/views/ReportesView.vue'), meta: { title: 'Reportes' } },
  { path: '/manual', name: 'manual', component: () => import('@/views/ManualRepresentanteView.vue'), meta: { title: 'Manual de usuario' } },
  { path: '/manual/admin', name: 'manual-admin', component: () => import('@/views/ManualAdminView.vue'), meta: { title: 'Manual administrador', adminOnly: true } },
  { path: '/personal', name: 'personal', component: () => import('@/views/PersonalView.vue'), meta: { title: 'Personal', adminOnly: true } },
  { path: '/servicios', name: 'servicios', component: () => import('@/views/ServiciosView.vue'), meta: { title: 'Servicios', adminOnly: true } },
  { path: '/asignaciones', name: 'asignaciones', component: () => import('@/views/AsignacionesView.vue'), meta: { title: 'Asignaciones', adminOnly: true } },
  { path: '/usuarios', name: 'usuarios', component: () => import('@/views/UsuariosView.vue'), meta: { title: 'Usuarios', adminOnly: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' }
  },
})

router.beforeEach(async (to) => {
  // Asegura que los datos (incluidos usuarios y sesión) estén cargados.
  await useAppStore().bootstrap()
  const auth = useAuthStore()

  if (to.meta.public) {
    // Si ya hay sesión, no tiene sentido ver el login.
    if (to.name === 'login' && auth.isAuthenticated) return { name: 'dashboard' }
    return true
  }

  if (!auth.isAuthenticated) {
    return { name: 'login', query: to.fullPath !== '/' ? { redirect: to.fullPath } : {} }
  }

  if (to.meta.adminOnly && !auth.isAdmin) {
    return { name: 'dashboard' }
  }

  return true
})

router.afterEach((to) => {
  document.title = to.meta?.title ? `${to.meta.title} · KPI Tracker` : 'KPI Tracker'
})

export default router
