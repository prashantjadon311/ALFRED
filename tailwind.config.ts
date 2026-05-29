import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#5955D1",
          soft: "#EEEDFB"
        },
        success: "#22C55E",
        danger: "#EF4444",
        warning: "#F59E0B",
        muted: "#8B90A1",
        surface: {
          light: "#F6F7FB",
          card: "#FFFFFF",
          border: "#E6E8EF",
          dark: "#0F1117",
          darkCard: "#171A23",
          darkElevated: "#1F2330",
          darkBorder: "#2A2F3D"
        }
      },
      borderRadius: {
        card: "16px",
        input: "10px",
        button: "8px",
        panel: "24px"
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.06)",
        glow: "0 0 0 1px rgba(89,85,209,.28), 0 20px 70px rgba(89,85,209,.22)",
        "node-active": "0 0 24px rgba(89,85,209,.42), 0 0 0 1px rgba(89,85,209,.65)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        pulseNode: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(89,85,209,.38)" },
          "50%": { boxShadow: "0 0 0 10px rgba(89,85,209,0)" }
        }
      },
      animation: {
        shimmer: "shimmer 1.8s linear infinite",
        "pulse-node": "pulseNode 1.5s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
