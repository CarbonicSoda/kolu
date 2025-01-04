import { defineConfig } from "vite";

export default defineConfig({
	server: {
		port: 5200,
	},
	build: {
		target: "esnext",
		outDir: "docs",
	},
});
