import { describe, it, expect, vi } from 'vitest'
import { useRipple } from '../../../core/composables/useRipple.js'

describe('useRipple', () => {
  it('addRipple creates a span element with ripple class', () => {
    const { addRipple } = useRipple()
    const el = document.createElement('div')
    el.getBoundingClientRect = () => ({
      width: 100, height: 100,
      top: 0, left: 0, right: 100, bottom: 100,
      x: 0, y: 0,
      toJSON: () => {},
    })
    const event = { clientX: 50, clientY: 50 }

    addRipple(event, el)

    const ripple = el.querySelector('.ripple')
    expect(ripple).toBeTruthy()
    expect(ripple.tagName).toBe('SPAN')
  })

  it('handleRippleClick calls addRipple', () => {
    const { handleRippleClick } = useRipple()
    const el = document.createElement('div')
    el.getBoundingClientRect = () => ({
      width: 100, height: 100,
      top: 0, left: 0, right: 100, bottom: 100,
      x: 0, y: 0,
      toJSON: () => {},
    })
    const event = { currentTarget: el, clientX: 50, clientY: 50 }

    handleRippleClick(event)

    const ripple = el.querySelector('.ripple')
    expect(ripple).toBeTruthy()
  })

  it('ripple element is removed after animationend event', () => {
    const { addRipple } = useRipple()
    const el = document.createElement('div')
    el.getBoundingClientRect = () => ({
      width: 100, height: 100,
      top: 0, left: 0, right: 100, bottom: 100,
      x: 0, y: 0,
      toJSON: () => {},
    })
    const event = { clientX: 50, clientY: 50 }

    addRipple(event, el)

    const ripple = el.querySelector('.ripple')
    expect(ripple).toBeTruthy()

    // Dispatch animationend event
    ripple.dispatchEvent(new Event('animationend'))

    expect(el.querySelector('.ripple')).toBeNull()
  })
})
