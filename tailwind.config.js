import plugin from "tailwindcss/plugin";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // 8-point spacing system
      spacing: {
        0.5: "4px", // xs
        1: "8px", // sm
        2: "16px", // md
        3: "24px", // lg
        4: "32px", // xl
        6: "48px", // 2xl
        8: "64px", // 3xl
        12: "96px", // 4xl
      },
      // Typography hierarchy
      fontSize: {
        xs: ["12px", { lineHeight: "16px", letterSpacing: "0px" }],
        sm: ["14px", { lineHeight: "20px", letterSpacing: "0px" }],
        base: ["16px", { lineHeight: "24px", letterSpacing: "0px" }],
        lg: ["18px", { lineHeight: "28px", letterSpacing: "0px" }],
        xl: ["20px", { lineHeight: "28px", letterSpacing: "-0.2px" }],
        "2xl": ["24px", { lineHeight: "32px", letterSpacing: "-0.2px" }],
        "3xl": ["32px", { lineHeight: "40px", letterSpacing: "-0.3px" }],
        "4xl": ["48px", { lineHeight: "56px", letterSpacing: "-0.4px" }],
      },
      // Premium shadow system
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
        base: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
        md: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
        lg: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        xl: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
      },
      // Rounded corners - premium feel
      borderRadius: {
        none: "0",
        sm: "4px",
        base: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        full: "9999px",
      },
      // Semantic colors
      colors: {
        // Primary trust colors
        primary: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c3d66",
        },
        // Success (green)
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#145231",
        },
        // Warning (amber/orange)
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        // Error (red)
        error: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
        },
        // Info (indigo)
        info: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        // Neutral (gray)
        neutral: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
        },
        brand: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          900: "#134e4a",
        },
      },
      // Animation tokens
      animation: {
        "fade-in": "fadeIn 0.2s ease-in",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-subtle": "pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(4px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      // Transition utilities
      transitionDuration: {
        0: "0ms",
        75: "75ms",
        100: "100ms",
        150: "150ms",
        200: "200ms",
        300: "300ms",
        500: "500ms",
        700: "700ms",
        1000: "1000ms",
      },
    },
  },
  plugins: [
    plugin(function ({ addComponents, theme }) {
      addComponents({
        // Utility classes for consistent styling
        ".card": {
          "@apply bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm":
            {},
        },
        ".card-elevated": {
          "@apply bg-white dark:bg-neutral-900 rounded-lg shadow-md hover:shadow-lg transition-shadow":
            {},
        },
        ".card-hover": {
          "@apply hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 transition-all":
            {},
        },
        ".text-primary": {
          "@apply text-neutral-900 dark:text-white": {},
        },
        ".text-secondary": {
          "@apply text-neutral-600 dark:text-neutral-400": {},
        },
        ".text-tertiary": {
          "@apply text-neutral-500 dark:text-neutral-500": {},
        },
        ".badge": {
          "@apply inline-flex items-center px-2 py-1 rounded-full text-xs font-medium":
            {},
        },
        ".badge-success": {
          "@apply badge bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200":
            {},
        },
        ".badge-warning": {
          "@apply badge bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200":
            {},
        },
        ".badge-error": {
          "@apply badge bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200":
            {},
        },
        ".badge-info": {
          "@apply badge bg-info-100 text-info-800 dark:bg-info-900 dark:text-info-200":
            {},
        },
        ".badge-neutral": {
          "@apply badge bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200":
            {},
        },
        ".button-base": {
          "@apply inline-flex items-center justify-center px-3 py-2 rounded-md font-medium text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed":
            {},
        },
        ".button-primary": {
          "@apply button-base bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500":
            {},
        },
        ".button-secondary": {
          "@apply button-base bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 focus:ring-neutral-500":
            {},
        },
        ".button-ghost": {
          "@apply button-base bg-transparent text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:ring-neutral-500":
            {},
        },
      });
    }),
  ],
};
