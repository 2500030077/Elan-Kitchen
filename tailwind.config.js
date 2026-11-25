/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: '#214E34', dark: '#153524', 50: '#EEF4F0', 100: '#D6E5DB', 200: '#ABCAB6' },
        ivory: { DEFAULT: '#FAF8F3', 200: '#F2EEE4', 300: '#E8E1D2' },
        gold: { DEFAULT: '#C6A66B', dark: '#8A6D32', light: '#EADBBB' },
        terracotta: { DEFAULT: '#C96D4B', dark: '#A4502F', light: '#F6E3DA' },
        charcoal: '#202620',
        muted: '#6B7280',
        danger: '#DC2626',
        success: '#16A34A',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: { card: '14px' },
      boxShadow: {
        soft: '0 1px 2px rgba(32,38,32,0.04), 0 4px 16px rgba(32,38,32,0.06)',
        lift: '0 2px 4px rgba(32,38,32,0.05), 0 12px 32px rgba(32,38,32,0.10)',
      },
      maxWidth: { site: '1240px' },
    },
  },
  plugins: [],
};
