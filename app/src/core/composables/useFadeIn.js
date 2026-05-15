import { onMounted, onUnmounted } from 'vue'

export function useFadeIn(selector = '.fade-in', rootEl = null) {
  let io
  let mo

  function observe(el) {
    if (el.classList.contains('visible')) return
    io.observe(el)
  }

  onMounted(() => {
    const root = rootEl?.value || document

    io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible')
          io.unobserve(e.target)
        }
      })
    }, { threshold: 0.1 })

    // Observe elements already in DOM
    root.querySelectorAll(selector).forEach(observe)

    // Watch for elements added later (e.g. after async data loads)
    mo = new MutationObserver((mutations) => {
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (node.nodeType !== 1) return
          if (node.matches?.(selector)) observe(node)
          node.querySelectorAll?.(selector).forEach(observe)
        })
      })
    })
    mo.observe(root === document ? document.body : root, { childList: true, subtree: true })
  })

  onUnmounted(() => {
    io?.disconnect()
    mo?.disconnect()
  })
}
