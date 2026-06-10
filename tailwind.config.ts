import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif']
      },
      colors: {
        paper: 'hsl(var(--paper))',
        surface: 'hsl(var(--surface))',
        sidebar: 'hsl(var(--sidebar))',
        ink: 'hsl(var(--ink))',
        subtle: 'hsl(var(--subtle))',
        line: 'hsl(var(--line))',
        clay: {
          DEFAULT: 'hsl(var(--clay))',
          soft: 'hsl(var(--clay-soft))',
          ink: 'hsl(var(--clay-ink))'
        },
        userbubble: 'hsl(var(--user-bubble))'
      },
      maxWidth: { thread: '46rem' },
      keyframes: {
        blink: { '0%,100%': { opacity: '0.2' }, '50%': { opacity: '1' } },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        blink: 'blink 1.2s ease-in-out infinite',
        fadeUp: 'fadeUp 0.25s ease-out both'
      }
    }
  },
  plugins: []
};
export default config;
