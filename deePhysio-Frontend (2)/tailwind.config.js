/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'tiny': ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
        'xs': ['0.9375rem', { lineHeight: '1.375rem' }],  // 15px
        'sm': ['1rem', { lineHeight: '1.5rem' }],         // 16px
        'base': ['1rem', { lineHeight: '1.5rem' }],        // 16px (Uniform Global Standard)
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],    // 18px
        'xl': ['1.25rem', { lineHeight: '1.875rem' }],    // 20px
        '2xl': ['1.5rem', { lineHeight: '2.125rem' }],    // 24px
        '3xl': ['1.875rem', { lineHeight: '2.375rem' }],  // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],     // 36px
      },
      colors: {
        clinicPrimary: {
          DEFAULT: "#2EA7B8",
          light: "#EAF6F8",
          dark: "#1E6C77",
        },
        clinicSecondary: {
          DEFAULT: "#F59E0B",
          light: "#FFFBEB",
          dark: "#B45309",
        },
        clinicDark: "#0F172A",
        clinicLight: "#F8FAFC",
        clinicHover: "#0a3d62",
        clinicBorder: "rgba(0, 0, 0, 0.05)",
        surface: {
          DEFAULT: '#ffffff',
          glass: 'rgba(255, 255, 255, 0.7)',
        }
      },
      boxShadow: {
        'sm': 'rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px',
        'DEFAULT': 'rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px',
        'md': 'rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px',
        'lg': 'rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px',
        'xl': 'rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px',
        '2xl': 'rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px',
        'google': 'rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px',
        'premium': 'rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'soft': 'rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.03)',
      },
      borderRadius: {
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      animation: {
        'shimmer': 'shimmer 2s infinite linear',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'pulse-subtle': 'pulseSubtle 2s infinite ease-in-out',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        }
      }
    },
  },
  plugins: [],
}
