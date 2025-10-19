import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
	test: {
		deps: {
			optimizer: {
				ssr: {
					include: ["@remix-run/cloudflare"],
				},
			},
		},
		include: ["test/**/*.test.ts"],
		poolOptions: {
			singleWorker: true,
			workers: {
				wrangler: { configPath: "./wrangler.jsonc" },
			},
		},
	},
});


================================================================================
Content from: vitest.config (2).ts
================================================================================

import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// Node.js environment
		environment: "node",
		include: ["cli/**/*.test.ts"],
	},
});
