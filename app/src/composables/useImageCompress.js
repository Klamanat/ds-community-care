/**
 * Compress an image data URL to a smaller JPEG data URL.
 * Resizes to fit within maxW × maxH, then encodes as JPEG at given quality.
 *
 * Target: ≤ 50 000 chars (Google Sheets cell limit).
 * A 300×300 JPEG at quality 0.65 is typically ~15 000–30 000 chars as base64.
 *
 * @param {string} dataUrl   - original data URL (from FileReader.readAsDataURL)
 * @param {number} maxW      - max width in px  (default 300)
 * @param {number} maxH      - max height in px (default 300)
 * @param {number} quality   - JPEG quality 0–1 (default 0.65)
 * @returns {Promise<string>} compressed data URL
 */
export function compressImage(dataUrl, maxW = 300, maxH = 300, quality = 0.65) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onerror = () => reject(new Error('Image load failed'))
    img.onload = () => {
      let w = img.naturalWidth
      let h = img.naturalHeight

      // Scale down proportionally
      if (w > maxW) { h = Math.round(h * maxW / w); w = maxW }
      if (h > maxH) { w = Math.round(w * maxH / h); h = maxH }

      const canvas = document.createElement('canvas')
      canvas.width  = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)

      const result = canvas.toDataURL('image/jpeg', quality)

      // Safety check: if still too large, try lower quality once
      if (result.length > 50000) {
        resolve(canvas.toDataURL('image/jpeg', 0.4))
      } else {
        resolve(result)
      }
    }
    img.src = dataUrl
  })
}

/**
 * Read a File object and return a compressed base64 data URL.
 *
 * @param {File} file
 * @param {object} [opts]
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
          opts.maxW    ?? 300,
          opts.maxH    ?? 300,
          opts.quality ?? 0.65,
        )
        resolve(compressed)
      } catch (err) {
        reject(err)
      }
    }
    reader.readAsDataURL(file)
  })
}
