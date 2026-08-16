export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      spacing: {
        // Baked-in base spacing + the notch/home-indicator inset, so these
        // are additive (never replace a base padding with 0 on older
        // non-notched phones the way a bare env() value would).
        'safe-t': 'calc(env(safe-area-inset-top) + 1rem)',
        'safe-b': 'calc(env(safe-area-inset-bottom) + 1rem)',
        'safe-l': 'calc(env(safe-area-inset-left) + 1rem)',
        'safe-r': 'calc(env(safe-area-inset-right) + 1rem)',
      },
      height: {
        dvh: '100dvh',
      },
      minHeight: {
        dvh: '100dvh',
      },
      boxShadow: {
        soft: '0 4px 20px -4px rgb(14 165 233 / 0.15)',
      },
    },
  },
  plugins: [],
}
