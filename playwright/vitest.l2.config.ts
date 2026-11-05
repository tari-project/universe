import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: { environment: 'node', include: ['playwright/helpers/l2/*.test.ts'] },
});
