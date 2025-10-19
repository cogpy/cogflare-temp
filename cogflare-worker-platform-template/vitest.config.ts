import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
	test: {
		include: ["test/**/*.test.ts"],
		poolOptions: {
			workers: {
				wrangler: { configPath: "./wrangler.json" },
			},
		},
		globals: true,
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
