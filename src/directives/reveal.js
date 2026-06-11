// Directiva v-reveal: aplica la clase .is-visible cuando el elemento entra en viewport.
// Soporta retraso escalonado con v-reveal="index".

let observer = null
const queue = new WeakMap()

function ensureObserver() {
  if (observer) return observer
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const delay = queue.get(entry.target) || 0
          entry.target.style.transitionDelay = `${delay}ms`
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
  )
  return observer
}

export const reveal = {
  mounted(el, binding) {
    el.classList.add('reveal')
    const index = Number(binding.value) || 0
    queue.set(el, Math.min(index * 60, 480))
    ensureObserver().observe(el)
  },
  unmounted(el) {
    observer?.unobserve(el)
  },
}
