/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        // Neutral palette (X-like dark)
        neutral: {
          50: '#000000',
          100: '#070707',
          200: '#0F0F0F',
          300: '#171717',
          400: '#262626',
          500: '#6B7280',
          600: '#9CA3AF',
          700: '#D1D5DB',
          800: '#E5E7EB',
          900: '#FFFFFF',
        },
        // Primary accent (X-like blue)
        primary: {
          50: '#E8F5FE',
          100: '#D6EFFE',
          200: '#A7DEFD',
          300: '#77CCFC',
          400: '#47BAFB',
          500: '#1D9BF0',
          600: '#1A8CD8',
          700: '#177BC0',
          800: '#13689F',
          900: '#0F4E77',
        },
        // Signal colors (discrete, not rainbow)
        signal: {
          high: '#059669', // emerald-600
          good: '#3B5BDB', // primary
          moderate: '#D97706', // amber-600
          low: '#DC2626', // red-600
        },
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        base: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
        DEFAULT: '0 1px 2px rgba(0, 0, 0, 0.04)',
        md: '0 2px 4px rgba(0, 0, 0, 0.06)',
        primary: '0 1px 2px rgba(59, 91, 219, 0.12)',
        'primary-hover': '0 2px 4px rgba(59, 91, 219, 0.16)',
      },
      fontSize: {
        // Display
        'display': ['32px', { lineHeight: '38px', fontWeight: '600', letterSpacing: '-0.01em' }],
        'display-lg': ['40px', { lineHeight: '48px', fontWeight: '600', letterSpacing: '-0.01em' }],
        // Heading 1
        'h1': ['24px', { lineHeight: '30px', fontWeight: '600', letterSpacing: '-0.01em' }],
        'h1-lg': ['28px', { lineHeight: '36px', fontWeight: '600', letterSpacing: '-0.01em' }],
        // Heading 2
        'h2': ['18px', { lineHeight: '24px', fontWeight: '500' }],
        'h2-lg': ['20px', { lineHeight: '28px', fontWeight: '500' }],
        // Body Large
        'body-lg': ['15px', { lineHeight: '22px', fontWeight: '400' }],
        'body-lg-desktop': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        // Body
        'body': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-desktop': ['15px', { lineHeight: '22px', fontWeight: '400' }],
        // Body Small
        'body-sm': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'body-sm-desktop': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        // Caption
        'caption': ['12px', { lineHeight: '16px', fontWeight: '400' }],
      },
      transitionDuration: {
        fast: '100ms',
        base: '150ms',
        slow: '300ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}

