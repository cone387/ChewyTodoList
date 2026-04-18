/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './hooks/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
        status: {
          unassigned: '#94a3b8',
          todo: '#3b82f6',
          completed: '#22c55e',
          abandoned: '#ef4444',
        },
        priority: {
          low: '#94a3b8',
          medium: '#f59e0b',
          high: '#f97316',
          urgent: '#ef4444',
        },
      },
    },
  },
  plugins: [],
};
