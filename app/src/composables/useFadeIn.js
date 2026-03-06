import { onMounted, onUnmounted } from 'vue'

export function useFadeIn(selector = '.fade-in', rootEl = null) {
  let observer

  onMounted(() => {
    const root = rootEl?.value || document
    const els = root.querySelectorAll(selector)
    observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible')
          observer.unobserve(e.target)
        }
      })
    }, { threshold: 0.1 })
    els.forEach(el => observer.observe(el))
  })

  onUnmounted(() => {
    observer?.disconnect()
  })
}
