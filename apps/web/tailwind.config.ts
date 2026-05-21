import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Prototype palette (preserved from index.html :root)
        white: '#ffffff',
        offwhite: '#fafafa',
        cream: '#ffffff',
        lilac: '#ece4ec',
        mint: '#dde8dd',
        yellow: {
          DEFAULT: '#f4e85c',
          pale: '#fdf9d8',
        },
        pinkHot: '#e07a8c',
        purpleSoft: '#ddd2e8',
        blush: '#f5ebee',
        peach: '#f5e8d4',
        ink: '#141414',
        border: '#ececec',
        sageDeep: '#5f7d62',
        goldDeep: '#a87e2e',
      },
      fontFamily: {
        serif: ['Fraunces', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        chip: '20px',
      },
      boxShadow: {
        soft: '0 24px 60px -16px rgba(0, 0, 0, 0.15)',
        card: '0 4px 12px rgba(0, 0, 0, 0.06)',
      },
      maxWidth: {
        container: '1320px',
      },
    },
  },
  plugins: [],
};

export default config;
