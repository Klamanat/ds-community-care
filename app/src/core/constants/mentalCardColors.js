// Shared color presets for Mental Health advisor cards
export const CARD_COLORS = [
  { key: 'gold',   label: 'ทอง',    css: 'linear-gradient(135deg,#FBBF24,#FDE68A)', border: '#D97706', ctaBg: 'linear-gradient(135deg,#92400E,#B45309)', ctaText: '#FEF3C7' },
  { key: 'pink',   label: 'ชมพู',   css: 'linear-gradient(135deg,#F9A8D4,#EC4899)', border: '#DB2777', ctaBg: 'linear-gradient(135deg,#9D174D,#BE185D)', ctaText: '#FDF2F8' },
  { key: 'green',  label: 'เขียว',  css: 'linear-gradient(135deg,#6EE7B7,#10B981)', border: '#059669', ctaBg: 'linear-gradient(135deg,#065F46,#047857)', ctaText: '#ECFDF5' },
  { key: 'purple', label: 'ม่วง',   css: 'linear-gradient(135deg,#C4B5FD,#7C3AED)', border: '#6D28D9', ctaBg: 'linear-gradient(135deg,#4C1D95,#5B21B6)', ctaText: '#F5F3FF' },
  { key: 'blue',   label: 'ฟ้า',    css: 'linear-gradient(135deg,#93C5FD,#3B82F6)', border: '#2563EB', ctaBg: 'linear-gradient(135deg,#1E3A8A,#1D4ED8)', ctaText: '#EFF6FF' },
  { key: 'orange', label: 'ส้ม',    css: 'linear-gradient(135deg,#FED7AA,#F97316)', border: '#EA580C', ctaBg: 'linear-gradient(135deg,#7C2D12,#9A3412)', ctaText: '#FFF7ED' },
  { key: 'red',    label: 'แดง',    css: 'linear-gradient(135deg,#FCA5A5,#EF4444)', border: '#DC2626', ctaBg: 'linear-gradient(135deg,#7F1D1D,#991B1B)', ctaText: '#FEF2F2' },
  { key: 'teal',   label: 'เทียล',  css: 'linear-gradient(135deg,#99F6E4,#0D9488)', border: '#0F766E', ctaBg: 'linear-gradient(135deg,#134E4A,#0F766E)', ctaText: '#F0FDFA' },
]

export const CARD_COLOR_MAP = Object.fromEntries(CARD_COLORS.map(c => [c.key, c]))

// Generate stable random emoji positions based on a seed string (e.g. advisor id/name)
export function emojiPositions(seedStr, count = 12) {
  let s = (seedStr || 'x').split('').reduce((a, c) => a + c.charCodeAt(0), 73)
  const rand = () => {
    s = (Math.imul(s, 1664525) + 1013904223) | 0
    return (s >>> 0) / 4294967296
  }
  return Array.from({ length: count }, () => ({
    left:   +(rand() * 100).toFixed(1),
    top:    +(rand() * 100).toFixed(1),
    rotate: Math.round(rand() * 60 - 30),
    scale:  +(0.75 + rand() * 0.6).toFixed(2),
  }))
}
