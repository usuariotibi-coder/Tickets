import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          "600": "#CD0037",
          "700": "#A8002E",
          dark: "#140316",
          light: "#D6D2DA",
        },
      },
    },
  },
  plugins: [],
};

export default config;
