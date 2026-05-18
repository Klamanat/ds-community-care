// Unit tests for core/composables/useImageCompress.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Helpers ─────────────────────────────────────────────────────────

const FAKE_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

function createMockFile(content = FAKE_DATA_URL, name = 'test.jpg', type = 'image/jpeg') {
  return new File([content], name, { type })
}

// ── Canvas mock ─────────────────────────────────────────────────────

let mockCtx

function setupCanvasMock() {
  mockCtx = { drawImage: vi.fn() }
  HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCtx)
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/jpeg;base64,/9j/4AAQSkZJRgBAQEAAAAAAA==')
}

// ── Image mock (deferred onload/onerror via setTimeout) ─────────────

class MockImage {
  constructor() {
    this._onload = null
    this._onerror = null
    this.naturalWidth = 100
    this.naturalHeight = 100
  }
  set onload(fn) { this._onload = fn }
  get onload() { return this._onload }
  set onerror(fn) { this._onerror = fn }
  get onerror() { return this._onerror }
  set src(url) {
    setTimeout(() => {
      if (this._onerror && url === 'BAD') {
        this._onerror(new Error('load error'))
      } else if (this._onload) {
        this._onload()
      }
    }, 0)
  }
  get src() { return '' }
}

// ── Mock FileReader (compatible with fake timers) ──────────────────

function makeMockFileReader(resultDataUrl) {
  return class {
    constructor() {
      this.onload = null
      this.onerror = null
    }
    readAsDataURL() {
      if (resultDataUrl === 'ERROR') {
        setTimeout(() => this.onerror?.(new Error('Reader error')), 0)
      } else {
        setTimeout(() => {
          this.onload?.({ target: { result: resultDataUrl } })
        }, 0)
      }
    }
  }
}

describe('useImageCompress', () => {
  let compressImage, resizeToBase64, fileToCompressedBase64

  beforeAll(async () => {
    const mod = await import('../../../core/composables/useImageCompress.js')
    compressImage = mod.compressImage
    resizeToBase64 = mod.resizeToBase64
    fileToCompressedBase64 = mod.fileToCompressedBase64
  })

  beforeEach(() => {
    vi.useFakeTimers()
    globalThis.Image = MockImage
    setupCanvasMock()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // ── compressImage ─────────────────────────────────────────────────

  describe('compressImage', () => {
    it('creates Image and draws to canvas, returns data URL', async () => {
      const promise = compressImage(FAKE_DATA_URL)

      vi.advanceTimersByTime(10)

      const result = await promise

      expect(mockCtx.drawImage).toHaveBeenCalledOnce()
      expect(result).toMatch(/^data:image\/jpeg;base64,/)
    })

    it('rejects on image load error', async () => {
      const promise = compressImage('BAD')
      vi.advanceTimersByTime(10)
      await expect(promise).rejects.toThrow('Image load failed')
    })

    it('uses progressive quality/dimension steps until under MAX_CHARS', async () => {
      let callCount = 0
      HTMLCanvasElement.prototype.toDataURL = vi.fn(() => {
        callCount++
        if (callCount <= 2) {
          return 'data:image/jpeg;base64,' + 'A'.repeat(51000)
        }
        return 'data:image/jpeg;base64,' + 'A'.repeat(100)
      })

      const promise = compressImage(FAKE_DATA_URL, 400, 400, 0.72)
      vi.advanceTimersByTime(10)

      const result = await promise
      expect(result).toMatch(/^data:image\/jpeg;base64,/)
      expect(callCount).toBeGreaterThanOrEqual(3)
    })

    it('uses absolute fallback (100x100, 0.25) when all progressive steps exceed limit', async () => {
      HTMLCanvasElement.prototype.toDataURL = vi.fn(() => {
        return 'data:image/jpeg;base64,' + 'A'.repeat(51000)
      })

      const promise = compressImage(FAKE_DATA_URL, 400, 400, 0.72)
      vi.advanceTimersByTime(10)

      const result = await promise
      expect(result).toMatch(/^data:image\/jpeg;base64,/)

      expect(HTMLCanvasElement.prototype.toDataURL).toHaveBeenCalledTimes(13)

      const lastCallArgs = HTMLCanvasElement.prototype.toDataURL.mock.calls.at(-1)
      expect(lastCallArgs).toEqual(['image/jpeg', 0.25])
    })
  })

  // ── resizeToBase64 ────────────────────────────────────────────────

  describe('resizeToBase64', () => {
    it('reads a file, creates an Image, draws to canvas and returns data URL', async () => {
      globalThis.FileReader = makeMockFileReader(FAKE_DATA_URL)
      const file = createMockFile(FAKE_DATA_URL)

      const promise = resizeToBase64(file)
      vi.advanceTimersByTime(10)

      const result = await promise
      expect(mockCtx.drawImage).toHaveBeenCalledOnce()
      expect(result).toMatch(/^data:image\/jpeg;base64,/)
    })

    it('rejects when FileReader errors', async () => {
      globalThis.FileReader = makeMockFileReader('ERROR')
      const file = createMockFile(FAKE_DATA_URL)

      const promise = resizeToBase64(file)
      vi.advanceTimersByTime(10)

      await expect(promise).rejects.toThrow('FileReader failed')
    })

    it('rejects when Image load fails after FileReader succeeds', async () => {
      globalThis.FileReader = makeMockFileReader('BAD')
      const file = createMockFile(FAKE_DATA_URL)

      const promise = resizeToBase64(file)
      vi.advanceTimersByTime(10)

      await expect(promise).rejects.toThrow('Image load failed')
    })

    it('uses custom maxW, maxH, quality parameters', async () => {
      globalThis.FileReader = makeMockFileReader(FAKE_DATA_URL)
      const file = createMockFile(FAKE_DATA_URL)

      const promise = resizeToBase64(file, 800, 400, 0.9)
      vi.advanceTimersByTime(10)

      const result = await promise
      expect(result).toMatch(/^data:image\/jpeg;base64,/)
      expect(mockCtx.drawImage).toHaveBeenCalledOnce()
    })
  })

  // ── fileToCompressedBase64 ────────────────────────────────────────

  describe('fileToCompressedBase64', () => {
    it('reads file and returns compressed base64', async () => {
      globalThis.FileReader = makeMockFileReader(FAKE_DATA_URL)
      const file = createMockFile(FAKE_DATA_URL)

      const promise = fileToCompressedBase64(file)
      vi.advanceTimersByTime(10)

      const result = await promise
      expect(result).toMatch(/^data:image\/jpeg;base64,/)
      expect(mockCtx.drawImage).toHaveBeenCalledOnce()
    })

    it('passes opts to compressImage', async () => {
      globalThis.FileReader = makeMockFileReader(FAKE_DATA_URL)
      const file = createMockFile(FAKE_DATA_URL)

      const promise = fileToCompressedBase64(file, { maxW: 600, maxH: 500, quality: 0.8 })
      vi.advanceTimersByTime(10)

      const result = await promise
      expect(result).toMatch(/^data:image\/jpeg;base64,/)
    })

    it('rejects when FileReader errors', async () => {
      globalThis.FileReader = makeMockFileReader('ERROR')
      const file = createMockFile(FAKE_DATA_URL)

      const promise = fileToCompressedBase64(file)
      vi.advanceTimersByTime(10)

      await expect(promise).rejects.toThrow('FileReader failed')
    })

    it('passes through error from compressImage', async () => {
      globalThis.FileReader = makeMockFileReader('BAD')
      const file = createMockFile(FAKE_DATA_URL)

      const promise = fileToCompressedBase64(file)
      vi.advanceTimersByTime(10)

      await expect(promise).rejects.toThrow('Image load failed')
    })
  })
})
