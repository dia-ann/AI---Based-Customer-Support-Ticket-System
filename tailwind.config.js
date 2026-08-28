/** @type {import('tailwindcss').Config} */
export default {
  content: ["./frontend/index.html", "./frontend/src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          500: "#3d6cf0",
          600: "#2c53d6",
          700: "#233fab",
        },
        status: {
          open: "#f59e0b",
          progress: "#3b82f6",
          resolved: "#10b981",
          closed: "#6b7280",
          breached: "#ef4444",
        },
        surface: {
          bg: "#0b0d13",
          sidebar: "#0f121a",
          card: "#141824",
          border: "#232838",
          hover: "#1b2030",
        },
        accent: {
          DEFAULT: "#f2b705",
          hover: "#d9a400",
        },
      },
    },
  },
  plugins: [],
};
