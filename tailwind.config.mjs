/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,ts}'],
  theme: {
    extend: {
      colors: {
        miku: '#39C5BB',
        alert: '#FF0055',
        void: '#000000',
        paper: '#FAFAFA',
      },
      fontFamily: {
        wide: ['Syncopate', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        jp: ['Noto Serif JP', 'serif'],
      },
      boxShadow: {
        'hard-miku': '8px 8px 0px 0px #39C5BB',
        'hard-alert': '8px 8px 0px 0px #FF0055',
        'hard-black': '8px 8px 0px 0px #000000',
        'hard-white': '8px 8px 0px 0px #FFFFFF',
      },
    },
  },
  plugins: [],
};
