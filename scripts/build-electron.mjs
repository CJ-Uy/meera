import { build } from "esbuild";

const shared = {
	bundle: true,
	platform: "node",
	format: "cjs",
	target: "node22",
	external: ["electron"],
	sourcemap: true,
	logLevel: "info",
};

await Promise.all([
	build({
		...shared,
		entryPoints: ["electron/main.ts"],
		outfile: "dist-electron/main.cjs",
	}),
	build({
		...shared,
		entryPoints: ["electron/preload.ts"],
		outfile: "dist-electron/preload.cjs",
	}),
]);
