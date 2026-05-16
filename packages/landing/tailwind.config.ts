import type { Config } from "tailwindcss";

const config: Config = {
	content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
	theme: {
		extend: {
			colors: {
				background: "var(--background)",
				foreground: "var(--foreground)",
				card: "var(--card)",
				muted: "var(--muted)",
				"muted-foreground": "var(--muted-foreground)",
				border: "var(--border)",
				ink: "#10110d",
				paper: "#f2eadc",
				bone: "#fff8e9",
				copper: "#b87333",
				circuit: "#b7ff4a",
				oxide: "#24342a",
			},
			fontFamily: {
				display: ["Geist", "Geist Fallback", "sans-serif"],
				body: ["Geist", "Geist Fallback", "sans-serif"],
				mono: ["Geist", "Geist Fallback", "sans-serif"],
				pixel: ["VT323", "Geist Mono", "monospace"],
			},
			boxShadow: {
				"hard-ink": "10px 10px 0 #10110d",
			},
		},
	},
	plugins: [],
};

export default config;
