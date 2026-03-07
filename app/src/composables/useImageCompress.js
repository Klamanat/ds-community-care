const MAX_CHARS = 50000  // Google Sheets cell limit

/**
 * Compress an image data URL to fit within MAX_CHARS (base64).
 * Tries progressive quality/dimension reductions until it fits.
 *
 * @param {string} dataUrl  - original data URL
 * @param {number} maxW     - initial max width  (default 400)
 * @param {number} maxH     - initial max height (default 400)
 * @param {number} quality  - initial JPEG quality 0–1 (default 0.72)
 * @returns {Promise<string>} compressed data URL ≤ 50 000 chars
 */
export function compressImage(dataUrl, maxW = 400, maxH = 400, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onerror = () => reject(new Error('Image load failed'))
    img.onload = () => {
      // Build proportional fallback steps — finer steps to maximise stored resolution
      const attempts = [
        [maxW,                     maxH,                     quality],
        [maxW,                     maxH,                     0.60],
        [maxW,                     maxH,                     0.40],
        [Math.round(maxW * 0.60),  Math.round(maxH * 0.60),  0.70],
        [Math.round(maxW * 0.50),  Math.round(maxH * 0.50),  0.70],
        [Math.round(maxW * 0.42),  Math.round(maxH * 0.42),  0.70],
        [Math.round(maxW * 0.35),  Math.round(maxH * 0.35),  0.70],
        [Math.round(maxW * 0.30),  Math.round(maxH * 0.30),  0.70],
        [Math.round(maxW * 0.25),  Math.round(maxH * 0.25),  0.68],
        [Math.round(maxW * 0.20),  Math.round(maxH * 0.20),  0.65],
        [200, 120, 0.55],
        [150,  90, 0.40],
      ]

      for (const [w, h, q] of attempts) {
        const result = _encode(img, w, h, q)
        if (result.length <= MAX_CHARS) {
          resolve(result)
          return
        }
      }

      // Absolute fallback — guaranteed tiny
      resolve(_encode(img, 100, 100, 0.25))
    }
    img.src = dataUrl
  })
}

function _encode(img, maxW, maxH, quality) {
  let w = img.naturalWidth
  let h = img.naturalHeight
  if (w > maxW) { h = Math.round(h * maxW / w); w = maxW }
  if (h > maxH) { w = Math.round(w * maxH / h); h = maxH }
  const canvas = document.createElement('canvas')
  canvas.width  = w
  canvas.height = h
  canvas.getContext('2d').drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', quality)
}

/**
 * Read a File, resize it, and return a base64 data URL — NO size limit.
 * Use this when the image will be uploaded to Google Drive (not stored in Sheets).
 *
 * @param {File}   file
 * @param {number} maxW     - max width  (default 1200)
 * @param {number} maxH     - max height (default 600)
 * @param {number} quality  - JPEG quality 0–1 (default 0.88)
 * @returns {Promise<string>}
 */
export function resizeToBase64(file, maxW = 1200, maxH = 600, quality = 0.88) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('FileReader failed'))
    reader.onload  = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error('Image load failed'))
      img.onload  = () => resolve(_encode(img, maxW, maxH, quality))
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Read a File and return a compressed base64 data URL ≤ 50 000 chars.
 *
 * @param {File}   file
 * @param {object} [opts]  - maxW, maxH, quality overrides
 * @returns {Promise<string>}
 */
export function fileToCompressedBase64(file, opts = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('FileReader failed'))
    reader.onload  = async (e) => {
      try {
        const compressed = await compressImage(
          e.target.result,
          opts.maxW    ?? 400,
          opts.maxH    ?? 400,
          opts.quality ?? 0.72,
        )
        resolve(compressed)
      } catch (err) {
        reject(err)
      }
    }
    reader.readAsDataURL(file)
  })
}
