// Unit tests for core/services/edgeFunctions.js
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

const FAKE_URL = 'https://test.supabase.co'
const FAKE_ANON = 'test-anon-key'

vi.mock('../../../core/services/supabase.js', () => ({
  supabase: {},
}))

// Static imports are hoisted, so we must use dynamic import after stubbing env.
let uploadImage, deleteImage, fixCacheControl, getImages

beforeAll(async () => {
  vi.stubEnv('VITE_SUPABASE_URL', FAKE_URL)
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', FAKE_ANON)
  const mod = await import('../../../core/services/edgeFunctions.js')
  uploadImage = mod.uploadImage
  deleteImage = mod.deleteImage
  fixCacheControl = mod.fixCacheControl
  getImages = mod.getImages
})

beforeEach(() => {
  vi.clearAllMocks()
  globalThis.fetch = vi.fn()
})

function mockFetchOk(body) {
  globalThis.fetch.mockResolvedValue({
    ok: true,
    text: () => Promise.resolve(JSON.stringify(body)),
  })
}

function mockFetchError(status) {
  globalThis.fetch.mockResolvedValue({
    ok: false,
    status,
    text: () => Promise.resolve(''),
  })
}

describe('uploadImage', () => {
  const base64 = 'data:image/jpeg;base64,/9j/4AAQ=='
  const fileName = 'photo.jpg'
  const folderType = 'empathy'

  beforeEach(() => { vi.clearAllMocks() })

  it('POSTs to upload-image endpoint with correct payload', async () => {
    mockFetchOk({ ok: true, data: { id: 'img_1', url: 'https://drive.google.com/uc?id=img_1' } })
    const result = await uploadImage(base64, fileName, folderType)

    expect(globalThis.fetch).toHaveBeenCalledOnce()
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${FAKE_URL}/functions/v1/upload-image`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${FAKE_ANON}`,
        },
        body: JSON.stringify({ base64, fileName, folderType }),
      },
    )
    expect(result).toEqual({ id: 'img_1', url: 'https://drive.google.com/uc?id=img_1' })
  })

  it('uses default folderType "empathy" when not specified', async () => {
    mockFetchOk({ ok: true, data: { id: 'img_2', url: '' } })
    await uploadImage(base64, fileName)

    const callBody = JSON.parse(globalThis.fetch.mock.calls[0][1].body)
    expect(callBody.folderType).toBe('empathy')
  })

  it('throws on non-ok response', async () => {
    mockFetchError(500)
    await expect(uploadImage(base64, fileName)).rejects.toThrow('upload-image: 500')
  })

  it('throws when response body has ok: false', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ ok: false, error: 'Drive quota exceeded' })),
    })
    await expect(uploadImage(base64, fileName)).rejects.toThrow('Drive quota exceeded')
  })

  it('throws when response body is not valid JSON', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('not json'),
    })
    await expect(uploadImage(base64, fileName)).rejects.toThrow('upload-image: invalid response')
  })
})

describe('deleteImage', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('POSTs to delete-image endpoint with paths array', async () => {
    mockFetchOk({ ok: true })
    const paths = ['empathy/file1.jpg', 'empathy/file2.jpg']
    await deleteImage(paths)

    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${FAKE_URL}/functions/v1/delete-image`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${FAKE_ANON}`,
        },
        body: JSON.stringify({ paths }),
      },
    )
  })

  it('does nothing when paths is empty', async () => {
    await deleteImage([])
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('does nothing when paths is undefined', async () => {
    await deleteImage()
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('throws on non-ok response', async () => {
    mockFetchError(403)
    await expect(deleteImage(['x.jpg'])).rejects.toThrow('delete-image: 403')
  })
})

describe('fixCacheControl', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('POSTs to fix-cache endpoint', async () => {
    const expectedData = { fixed: 10, failed: 0, errors: [] }
    mockFetchOk({ ok: true, data: expectedData })
    const result = await fixCacheControl()

    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${FAKE_URL}/functions/v1/fix-cache`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${FAKE_ANON}`,
        },
        body: '{}',
      },
    )
    expect(result).toEqual(expectedData)
  })

  it('throws on non-ok response', async () => {
    mockFetchError(401)
    await expect(fixCacheControl()).rejects.toThrow('fix-cache: 401')
  })

  it('throws when response body has ok: false', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ ok: false, error: 'Not authorized' })),
    })
    await expect(fixCacheControl()).rejects.toThrow('Not authorized')
  })

  it('throws when response is not valid JSON', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('not json'),
    })
    await expect(fixCacheControl()).rejects.toThrow('fix-cache: invalid response')
  })
})

describe('getImages', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('fetches images with imgIds query param', async () => {
    const data = { file1: 'data:image/jpeg;base64,/9j/', file2: 'data:image/jpeg;base64,/8k/' }
    mockFetchOk({ ok: true, data })
    const result = await getImages(['file1', 'file2'])

    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${FAKE_URL}/functions/v1/get-images?imgIds=file1%2Cfile2`,
      {
        headers: { Authorization: `Bearer ${FAKE_ANON}` },
      },
    )
    expect(result).toEqual(data)
  })

  it('returns empty object for empty input', async () => {
    const result = await getImages([])
    expect(globalThis.fetch).not.toHaveBeenCalled()
    expect(result).toEqual({})
  })

  it('returns empty object when input is undefined', async () => {
    const result = await getImages()
    expect(globalThis.fetch).not.toHaveBeenCalled()
    expect(result).toEqual({})
  })

  it('throws on non-ok response', async () => {
    mockFetchError(404)
    await expect(getImages(['x'])).rejects.toThrow('get-images: 404')
  })

  it('throws when response body has ok: false', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ ok: false, error: 'Not found' })),
    })
    await expect(getImages(['x'])).rejects.toThrow('Not found')
  })

  it('throws when response is not valid JSON', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('not json'),
    })
    await expect(getImages(['x'])).rejects.toThrow('get-images: invalid response')
  })
})
