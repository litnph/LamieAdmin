/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        admin: {
          bg: 'rgb(var(--admin-canvas-rgb) / <alpha-value>)',
          canvas: 'rgb(var(--admin-canvas-rgb) / <alpha-value>)',
          card: 'rgb(var(--admin-surface-rgb) / <alpha-value>)',
          surface: 'rgb(var(--admin-surface-rgb) / <alpha-value>)',
          muted: 'rgb(var(--admin-muted-rgb) / <alpha-value>)',
          border: 'rgb(var(--admin-border-rgb) / <alpha-value>)',
          table: {
            head: 'rgb(var(--admin-table-head-rgb) / <alpha-value>)',
          },
          text: {
            primary: 'rgb(var(--admin-text-primary-rgb) / <alpha-value>)',
            secondary: 'rgb(var(--admin-text-secondary-rgb) / <alpha-value>)',
            muted: 'rgb(var(--admin-text-muted-rgb) / <alpha-value>)',
            inverse: 'rgb(var(--admin-text-inverse-rgb) / <alpha-value>)',
          },
          sidebar: {
            bg: 'rgb(var(--admin-sidebar-bg-rgb) / <alpha-value>)',
            text: 'rgb(var(--admin-sidebar-text-rgb) / <alpha-value>)',
            muted: 'rgb(var(--admin-sidebar-muted-rgb) / <alpha-value>)',
            border: 'rgb(var(--admin-sidebar-border-rgb) / <alpha-value>)',
            hover: 'rgb(var(--admin-sidebar-hover-rgb) / <alpha-value>)',
            active: 'rgb(var(--admin-sidebar-active-rgb) / <alpha-value>)',
            'active-text': 'rgb(var(--admin-sidebar-active-text-rgb) / <alpha-value>)',
          },
          primary: {
            DEFAULT: 'rgb(var(--admin-primary-rgb) / <alpha-value>)',
            hover: 'rgb(var(--admin-primary-hover-rgb) / <alpha-value>)',
            light: 'rgb(var(--admin-primary-light-rgb) / <alpha-value>)',
            foreground: 'rgb(var(--admin-primary-foreground-rgb) / <alpha-value>)',
          },
          secondary: {
            DEFAULT: 'rgb(var(--admin-secondary-rgb) / <alpha-value>)',
            hover: 'rgb(var(--admin-secondary-hover-rgb) / <alpha-value>)',
          },
          accent: {
            DEFAULT: 'rgb(var(--admin-accent-rgb) / <alpha-value>)',
            light: 'rgb(var(--admin-accent-light-rgb) / <alpha-value>)',
          },
          input: {
            border: 'rgb(var(--admin-input-border-rgb) / <alpha-value>)',
            focus: 'rgb(var(--admin-primary-rgb) / <alpha-value>)',
          },
          status: {
            success: 'rgb(var(--admin-status-success-rgb) / <alpha-value>)',
            warning: 'rgb(var(--admin-status-warning-rgb) / <alpha-value>)',
            error: 'rgb(var(--admin-status-error-rgb) / <alpha-value>)',
            info: 'rgb(var(--admin-status-info-rgb) / <alpha-value>)',
            'success-bg': 'rgb(var(--admin-status-success-bg-rgb) / <alpha-value>)',
            'warning-bg': 'rgb(var(--admin-status-warning-bg-rgb) / <alpha-value>)',
            'error-bg': 'rgb(var(--admin-status-error-bg-rgb) / <alpha-value>)',
            'info-bg': 'rgb(var(--admin-status-info-bg-rgb) / <alpha-value>)',
          },
          disabled: {
            bg: 'rgb(var(--admin-disabled-bg-rgb) / <alpha-value>)',
            text: 'rgb(var(--admin-disabled-text-rgb) / <alpha-value>)',
          },
        },
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'Segoe UI', 'Arial', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['SFMono-Regular', 'Cascadia Code', 'Consolas', 'monospace'],
      },
      screens: {
        xs: '360px',
        wide: '1440px',
      },
      spacing: {
        'admin-header': '4rem',
        'admin-sidebar': '14rem',
      },
      maxWidth: {
        'admin-content': '90rem',
      },
      borderRadius: {
        'admin-control': 'var(--admin-control-radius)',
        'admin-panel': 'var(--admin-panel-radius)',
      },
      boxShadow: {
        'admin-panel': 'var(--admin-panel-shadow)',
        'admin-popover': 'var(--admin-popover-shadow)',
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
