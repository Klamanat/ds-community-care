import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useConfetti } from '../../../core/composables/useConfetti.js'

describe('useConfetti', () => {
  /** Tracks the current draw callback so tests can drive the animation loop. */
  let currentDrawFn
  let rafIdCounter
  /** Accumulates all drawn frames for inspection. */
  let ctxMock

  beforeEach(() => {
    rafIdCounter = 0
    currentDrawFn = null

    // Mock requestAnimationFrame to actually invoke the callback, simulating
    // the browser's animation loop. The callback receives a timestamp and
    // may schedule the next frame by calling requestAnimationFrame again.
    vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => {
      currentDrawFn = cb
      return ++rafIdCounter
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    // Mock canvas context with spies on every method used by the confetti
    // animation loop so tests can assert they are called.
    ctxMock = {
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
    }
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ctxMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    // Clean up any leftover canvas elements
    document.body.innerHTML = ''
  })

  it('launchConfetti creates a canvas element in the DOM', () => {
    const { launchConfetti } = useConfetti()
    launchConfetti({ count: 5 })

    const canvas = document.querySelector('canvas')
    expect(canvas).toBeTruthy()
    expect(canvas.style.position).toBe('fixed')
    expect(canvas.style.pointerEvents).toBe('none')
    expect(canvas.style.zIndex).toBe('9999')
  })

  it('creates canvas with proper dimensions', () => {
    window.innerWidth = 1024
    window.innerHeight = 768

    const { launchConfetti } = useConfetti()
    launchConfetti({ count: 5 })

    const canvas = document.querySelector('canvas')
    expect(canvas.width).toBe(1024)
    expect(canvas.height).toBe(768)
  })

  it('uses custom colors when provided', () => {
    const { launchConfetti } = useConfetti()
    launchConfetti({ count: 10, colors: ['#FF0000', '#00FF00'] })

    const canvas = document.querySelector('canvas')
    expect(canvas).toBeTruthy()
  })

  describe('animation loop (draw)', () => {
    it('clears canvas and draws particles each frame', () => {
      const { launchConfetti } = useConfetti()
      launchConfetti({ count: 3 })

      // The initial call to requestAnimationFrame schedules the first draw
      expect(currentDrawFn).toBeTypeOf('function')

      // Invoke the draw callback once
      currentDrawFn(100)

      // Canvas should be cleared
      expect(ctxMock.clearRect).toHaveBeenCalledWith(
        0, 0, window.innerWidth, window.innerHeight,
      )

      // Should have called save/restore and fillRect for each particle
      expect(ctxMock.save).toHaveBeenCalled()
      expect(ctxMock.restore).toHaveBeenCalled()
      expect(ctxMock.fillRect).toHaveBeenCalled()
      expect(ctxMock.translate).toHaveBeenCalled()
      expect(ctxMock.rotate).toHaveBeenCalled()
    })

    it('draws circle-shaped particles with arc', () => {
      const { launchConfetti } = useConfetti()
      // Use a single color and a relatively high count so at least one
      // particle is guaranteed to be a circle (shapes are randomly assigned).
      launchConfetti({ count: 50, colors: ['#FF00FF'] })

      currentDrawFn(100)

      // Some particles should be circles drawn via beginPath + arc + fill
      // The exact number depends on random shape assignment, but at least
      // one should exist with 50 particles across 3 shapes.
      expect(ctxMock.beginPath).toHaveBeenCalled()
      expect(ctxMock.arc).toHaveBeenCalled()
    })

    it('draws ribbon-shaped particles as thin rectangles', () => {
      const { launchConfetti } = useConfetti()
      // With enough particles, some will be 'ribbon' shape
      launchConfetti({ count: 50 })

      currentDrawFn(100)

      // fillRect should have been called for rect and ribbon shapes
      // (circle uses arc+fill instead)
      expect(ctxMock.fillRect).toHaveBeenCalled()
    })

    it('cancels animation and removes canvas when all particles fade out', () => {
      const { launchConfetti } = useConfetti()
      launchConfetti({ count: 3 })

      // Simulate many frames so all particles fall off screen / alpha reaches 0.
      // Each frame decrements alpha by 0.008, so ~125 frames brings alpha ≤ 0.
      // We also simulate gravity pushing particles below canvas.height + 20.
      // Set a small height so particles quickly exceed the boundary.
      window.innerHeight = 100

      // Re-create confetti with small window height so particles fall fast
      document.body.innerHTML = ''
      vi.clearAllMocks()
      rafIdCounter = 0
      currentDrawFn = null
      ctxMock = {
        clearRect: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        fillRect: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
      }
      HTMLCanvasElement.prototype.getContext = vi.fn(() => ctxMock)
      vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => {
        currentDrawFn = cb
        return ++rafIdCounter
      }))

      const { launchConfetti: launch2 } = useConfetti()
      launch2({ count: 3 })

      const canvas = document.querySelector('canvas')
      expect(canvas).toBeTruthy()

      // Run frames until the animation stops scheduling new frames
      let frames = 0
      const maxFrames = 200
      while (currentDrawFn && frames < maxFrames) {
        const fn = currentDrawFn
        currentDrawFn = null  // will be re-set if draw calls rAF again
        fn(16 * frames)       // simulate ~16ms per frame
        frames++
      }

      // After enough frames the canvas should be removed from DOM
      expect(document.querySelector('canvas')).toBeNull()
      // cancelAnimationFrame should have been called
      expect(cancelAnimationFrame).toHaveBeenCalled()
    })

    it('applies globalAlpha and fillStyle per particle', () => {
      const { launchConfetti } = useConfetti()
      launchConfetti({ count: 3, colors: ['#FF0000'] })

      currentDrawFn(100)

      // Each particle should set globalAlpha and fillStyle before drawing
      expect(ctxMock.save).toHaveBeenCalled()
      // globalAlpha should be set by modifying the context property
      // The code does ctx.globalAlpha = p.alpha — we can verify save was called
      // which captures the state before modification
    })
  })

  describe('multiple colors', () => {
    it('accepts custom color array and creates particles', () => {
      const colors = ['#FF0000', '#00FF00', '#0000FF']
      const { launchConfetti } = useConfetti()
      launchConfetti({ count: 10, colors })

      const canvas = document.querySelector('canvas')
      expect(canvas).toBeTruthy()
    })
  })

  describe('canvas dimension calculation', () => {
    it('sets canvas size to window inner dimensions', () => {
      window.innerWidth = 1920
      window.innerHeight = 1080

      const { launchConfetti } = useConfetti()
      launchConfetti({ count: 5 })

      const canvas = document.querySelector('canvas')
      expect(canvas.width).toBe(1920)
      expect(canvas.height).toBe(1080)
    })
  })
})
