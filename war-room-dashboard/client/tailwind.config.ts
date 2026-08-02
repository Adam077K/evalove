import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#1e1e2e',
        mantle: '#181825',
        crust: '#11111b',
        surface0: '#313244',
        surface1: '#45475a',
        surface2: '#585b70',
        overlay0: '#6c7086',
        overlay1: '#7f849c',
        subtext0: '#a6adc8',
        subtext1: '#bac2de',
        text: '#cdd6f4',
        peach: '#fab387',
        green: '#a6e3a1',
        red: '#f38ba8',
        blue: '#89b4fa',
        yellow: '#f9e2af',
        mauve: '#cba6f7',
        teal: '#94e2d5',
        lavender: '#b4befe',
      },
      fontFamily: {
        mono: ['Geist Mono', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
