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
        neutral: {
          light: "#F8F9FA",
          dark: "#212529",
        },
        background: {
          // Added background color
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
        h1: ["2.25rem", { lineHeight: "2.75rem" }],
        h2: ["1.875rem", { lineHeight: "2.25rem" }],
        h3: ["1.5rem", { lineHeight: "2rem" }],
        h4: ["1.25rem", { lineHeight: "1.75rem" }],
        h5: ["1rem", { lineHeight: "1.5rem" }],
        h6: ["0.875rem", { lineHeight: "1.25rem" }],
        body: ["1rem", { lineHeight: "1.5rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        xs: ["0.75rem", { lineHeight: "1rem" }],
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        DEFAULT:
          "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      },
      spacing: {
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "5": "20px",
        "6": "24px",
        "8": "32px",
        "10": "40px",
        "12": "48px",
      },
      // Additional enhancements for accessibility and design harmony
      backgroundImage: {
        "gradient-to-bottom":
          "linear-gradient(to bottom, rgba(142, 202, 230, 0.1), rgba(255, 209, 102, 0.1))",
      },
      animation: {
        spin: "spin 1s linear infinite",
      },
      keyframes: {
        spin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      borderWidth: {
        "3": "3px",
      },
    },
  },
  plugins: [],
  darkMode: "class",
};

export default config;
