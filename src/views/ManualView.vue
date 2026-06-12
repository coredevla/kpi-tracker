<script setup>
import { ref, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import { useAuthStore } from '@/stores/auth'
import { loadManualHtml } from '@/composables/useManual'
import { BookOpen, BookMarked, ArrowLeft } from 'lucide-vue-next'

const props = defineProps({
  slug: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})

const auth = useAuthStore()
const html = ref('')
const loading = ref(true)
const error = ref('')

async function fetchManual() {
  loading.value = true
  error.value = ''
  try {
    html.value = await loadManualHtml(props.slug)
  } catch (e) {
    error.value = e.message || 'Error al cargar el manual.'
    html.value = ''
  } finally {
    loading.value = false
  }
}

onMounted(fetchManual)
watch(() => props.slug, fetchManual)
</script>

<template>
  <div>
    <PageHeader :title="title" :subtitle="subtitle || 'Guía de autoservicio dentro de la aplicación'" :icon="slug === 'admin' ? BookMarked : BookOpen">
      <template #actions>
        <div class="flex flex-wrap items-center gap-2">
          <RouterLink v-if="slug === 'admin'" to="/manual" class="btn btn-ghost !py-2 text-sm">
            Manual representante
          </RouterLink>
          <RouterLink v-if="auth.isAdmin && slug === 'representante'" to="/manual/admin" class="btn btn-ghost !py-2 text-sm">
            Manual admin
          </RouterLink>
          <RouterLink to="/" class="btn btn-ghost !py-2 text-sm">
            <ArrowLeft class="h-4 w-4" /> Volver
          </RouterLink>
        </div>
      </template>
    </PageHeader>

    <div v-if="loading" class="card-surface flex h-64 items-center justify-center">
      <div class="h-10 w-10 animate-spin rounded-full border-4 border-brand-500/30 border-t-brand-500" />
    </div>

    <div v-else-if="error" class="card-surface p-8 text-center text-rose-600 dark:text-rose-400">
      {{ error }}
    </div>

    <article v-else class="card-surface manual-prose overflow-hidden p-6 sm:p-10" v-html="html" />
  </div>
</template>
