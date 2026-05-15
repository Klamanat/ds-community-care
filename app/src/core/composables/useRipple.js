export function useRipple() {
  function addRipple(event, el) {
    const rect = el.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = (event.clientX || event.touches?.[0]?.clientX || rect.left + rect.width / 2) - rect.left - size / 2
    const y = (event.clientY || event.touches?.[0]?.clientY || rect.top + rect.height / 2) - rect.top - size / 2
    const ripple = document.createElement('span')
    ripple.className = 'ripple'
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`
    el.appendChild(ripple)
    ripple.addEventListener('animationend', () => ripple.remove())
  }

  function handleRippleClick(event) {
    const target = event.currentTarget
    addRipple(event, target)
  }

  return { addRipple, handleRippleClick }
}
