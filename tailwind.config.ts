import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dwellix: {
          50: '#fff0ed',
          100: '#ffe0d9',
          500: '#FF5A3D',
          600: '#e54c30',
        },
      },
    },
  },
  plugins: [],
};

export default config;