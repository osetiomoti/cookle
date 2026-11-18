import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // くっくる カラーパレット（ふたりばのピンク系を継承）
        primary: {
          DEFAULT: '#FF6F91',
          50:  '#FFF0F3',
          100: '#FFE0E8',
          200: '#FFC2D1',
          300: '#FFA3B9',
          400: '#FF85A2',
          500: '#FF6F91', // メインカラー
          600: '#FF3D6B',
          700: '#FF0A44',
          800: '#D60034',
          900: '#A30027',
        },
        // アクセントカラー（料理・食欲を感じるオレンジ補色）
        accent: {
          DEFAULT: '#FF9A5C',
          light:   '#FFF0E6',
        },
        background: '#FFFFFF',
        surface: '#FFF8FA',
        card: '#FFFFFF',
      },
      fontFamily: {
        sans: ['var(--font-noto-sans-jp)', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        'card': '20px',
      },
      boxShadow: {
        'soft':    '0 10px 40px -10px rgba(0,0,0,0.08)',
        'soft-sm': '0 4px 20px -5px rgba(0,0,0,0.05)',
        'primary': '0 4px 20px -5px rgba(255,111,145,0.3)',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top':    'env(safe-area-inset-top)',
      },
      keyframes: {
        'slide-up': {
          '0%':   { transform: 'translateY(60px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'bounce-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'slide-up':    'slide-up 0.3s cubic-bezier(0.33, 1, 0.68, 1) both',
        'fade-in':     'fade-in 0.4s ease-out',
        'bounce-slow': 'bounce-slow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;

