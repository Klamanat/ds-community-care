// useLazyImage.js — Optimized image handling for Lighthouse
// Provides utilities for lazy loading images with proper aspect ratios

/**
 * Generate a srcSet string for responsive images.
 * @param {string} src - Original image URL
 * @param {number[]} widths - Widths to generate
 * @returns {string} srcSet string
 */
export function imgSrcSet(src, widths = [320, 640, 960, 1280]) {
  if (!src) return ''
  return widths.map(w => `${src}?w=${w} ${w}w`).join(', ')
}

/**
 * Get image dimensions from cache or defaults.
 * @param {string} key - Image identifier
 * @param {{ w: number, h: number }} [defaults]
 * @returns {{ w: number, h: number }}
 */
export function getImgDimensions(key, defaults = { w: 375, h: 150 }) {
  const DIMS = {
    'bday-header': { w: 750, h: 300 },
    'bday-hero': { w: 750, h: 400 },
    'icon-training': { w: 56, h: 56 },
    'icon-mental': { w: 56, h: 56 },
  }
  return DIMS[key] || defaults
}
