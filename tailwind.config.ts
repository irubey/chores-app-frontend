import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#8ECAE6",
          DEFAULT: "#219EBC",
          dark: "#023047",
        },
        secondary: {
          light: "#B8E0D2",
          DEFAULT: "#95D5B2",
          dark: "#74C69D",
        },
        accent: {
          light: "#FFD166",
          DEFAULT: "#EEB62B",
          dark: "#CB9D06",
        },
        background: {
          light: "#F8F9FA",
          dark: "#212529",
        },
        text: {
          primary: "#343A40",
          secondary: "#6C757D",
        },
      },
      fontFamily: {
        sans: ["Lato", "sans-serif"],
        heading: ["Playfair Display", "serif"],
      },
      fontSize: {
        h1: ["2.25rem", { lineHeight: "2.75rem", letterSpacing: "-0.02em" }],
        h2: ["1.875rem", { lineHeight: "2.25rem", letterSpacing: "-0.01em" }],
        h3: ["1.5rem", { lineHeight: "2rem" }],
        h4: ["1.25rem", { lineHeight: "1.75rem" }],
        h5: ["1rem", { lineHeight: "1.5rem" }],
        h6: ["0.875rem", { lineHeight: "1.25rem" }],
        body: ["1rem", { lineHeight: "1.5rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        xs: ["0.75rem", { lineHeight: "1rem" }],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-down": "slideDown 0.4s ease-out",
        "bounce-subtle": "bounce-subtle 1s ease-in-out infinite",
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
        "slide-in-bottom": "slide-in-bottom 0.3s ease-out",
        scale: "scale 0.2s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(-5%)" },
          "50%": { transform: "translateY(0)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-in-bottom": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scale: {
          "0%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)" },
        },
      },
      transitionProperty: {
        height: "height",
        spacing: "margin, padding",
      },
      spacing: {
        "4xs": "0.125rem", // 2px
        "3xs": "0.25rem", // 4px
        "2xs": "0.375rem", // 6px
        xs: "0.5rem", // 8px
        sm: "0.75rem", // 12px
        md: "1rem", // 16px
        lg: "1.25rem", // 20px
        xl: "1.5rem", // 24px
        "2xl": "2rem", // 32px
        "3xl": "2.5rem", // 40px
        "4xl": "3rem", // 48px
      },
      borderRadius: {
        xs: "0.125rem", // 2px
        sm: "0.25rem", // 4px
        DEFAULT: "0.375rem", // 6px
        md: "0.5rem", // 8px
        lg: "0.75rem", // 12px
        xl: "1rem", // 16px
        "2xl": "1.5rem", // 24px
        full: "9999px",
      },
      zIndex: {
        behind: "-1",
        default: "1",
        dropdown: "1000",
        sticky: "1020",
        fixed: "1030",
        "modal-backdrop": "1040",
        modal: "1050",
        popover: "1060",
        tooltip: "1070",
      },
    },
  },
  plugins: [],
  darkMode: "class",
};

export default config;
