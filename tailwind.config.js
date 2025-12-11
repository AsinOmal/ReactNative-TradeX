/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Primary
        primary: {
          DEFAULT: '#6366F1',
          light: '#818CF8',
          dark: '#4F46E5',
        },
        // Status colors
        profit: {
          DEFAULT: '#10B981',
          light: '#D1FAE5',
        },
        loss: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
        },
        // Dark theme
        dark: {
          bg: '#0A0A0A',
          surface: '#18181B',
          card: '#1F1F23',
          border: '#27272A',
        },
        // Light theme
        light: {
          bg: '#FAFAFA',
          surface: '#FFFFFF',
          card: '#F4F4F5',
          border: '#E4E4E7',
        },
      },
    },
  },
  plugins: [],
};
