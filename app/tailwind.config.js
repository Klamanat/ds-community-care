/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        indigo:  { DEFAULT: '#6366F1' },
        purple:  { DEFAULT: '#A855F7' },
        pink:    { DEFAULT: '#EC4899' },
        amber:   { DEFAULT: '#F59E0B' },
        coral:   '#FF6B6B',
        mint:    '#10B981',
        app: {
          bg:     '#F2F0FB',
          dark:   '#1A1235',
          mid:    '#52497A',
          light:  '#9B8FBB',
          border: '#E2DCFB',
        },
      },
      borderRadius: {
        sm:    '10px',
        md:    '14px',
        lg:    '18px',
        xl:    '24px',
        '2xl': '28px',
      },
      boxShadow: {
        app:      '0 4px 24px rgba(99,102,241,0.13)',
        'app-sm': '0 2px 10px rgba(99,102,241,0.09)',
        'app-lg': '0 8px 40px rgba(99,102,241,0.18)',
      },
      fontFamily: {
        sans: ['Sarabun', 'Noto Sans Thai', 'sans-serif'],
      },
      screens: {
        sm:  '600px',
        md:  '768px',
        lg:  '1100px',
        xl:  '1440px',
      },
    },
  },
}
