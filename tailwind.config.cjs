/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        admin: {
          bg: '#F7F6F3',
          canvas: '#F7F6F3',
          card: '#FFFFFF',
          surface: '#FFFFFF',
          muted: '#F1EFEB',
          border: '#DED8D1',
          text: {
            primary: '#292623',
            secondary: '#625D57',
            muted: '#756F69',
            inverse: '#FFFFFF',
          },
          sidebar: {
            bg: '#F1EFEB',
            text: '#5F5A54',
            hover: '#E8E4DF',
            active: '#E2DDD7',
          },
          primary: {
            DEFAULT: 'rgb(var(--admin-primary-rgb) / <alpha-value>)',
            hover: 'rgb(var(--admin-primary-hover-rgb) / <alpha-value>)',
            light: 'rgb(var(--admin-primary-light-rgb) / <alpha-value>)',
            foreground: 'rgb(var(--admin-primary-foreground-rgb) / <alpha-value>)',
          },
          secondary: {
            DEFAULT: '#E2D8CE',
            hover: '#D5CAC0',
          },
          accent: {
            DEFAULT: '#C4956E',
            light: '#F8F0E8',
          },
          input: {
            border: '#D8D2CB',
            focus: 'rgb(var(--admin-primary-rgb) / <alpha-value>)',
          },
          status: {
            success: '#356342',
            warning: '#7A5D22',
            error: '#A23E3E',
            info: '#41677A',
          },
          disabled: {
            bg: '#E8E4DF',
            text: '#837D77',
          },
        },
      },
      fontFamily: {
        sans: ['Segoe UI Variable', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['SFMono-Regular', 'Cascadia Code', 'Consolas', 'monospace'],
      },
      screens: {
        xs: '360px',
        wide: '1440px',
      },
      spacing: {
        'admin-header': '4rem',
        'admin-sidebar': '16rem',
      },
      maxWidth: {
        'admin-content': '90rem',
      },
      borderRadius: {
        'admin-control': '0.5rem',
        'admin-panel': '0.75rem',
      },
      boxShadow: {
        'admin-panel': '0 1px 2px rgb(58 48 40 / 0.04)',
        'admin-popover': '0 12px 36px rgb(58 48 40 / 0.10)',
      },
      zIndex: {
        'admin-header': '20',
        'admin-sidebar': '40',
        'admin-overlay': '30',
        'admin-popover': '60',
        'admin-modal': '100',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.22s ease-out both',
        'fade-in': 'fadeIn 0.18s ease-out both',
        'slide-in-left': 'slideInLeft 0.2s ease-out both',
        'scale-in': 'scaleIn 0.18s cubic-bezier(0.16,1,0.3,1) both',
        'slide-down': 'slideDown 0.18s ease-out both',
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.98)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
