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
          500: "#3b82f6", // Replace this hex with your custom Dwellix color
        },
      },
    },
  },
  plugins: [],
};

export default config;