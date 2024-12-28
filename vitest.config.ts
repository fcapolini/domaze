import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "scripts/*"],
    coverage: {
      include: ["src/**"],
      provider: 'v8', // Use c8 for coverage
      reporter: ['text', 'lcov'], // Generate lcov report for Coveralls
    },
  },
});
