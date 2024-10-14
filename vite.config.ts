import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import eslintPlugin from '@nabla/vite-plugin-eslint';
import tsconfigPaths from 'vite-tsconfig-paths';
import * as path from 'node:path';

export default defineConfig({
    clearScreen: false,
    server: {
        port: 1420,
        strictPort: true,
        watch: {
            ignored: ['**/src-tauri/**'],
        },
    },
    plugins: [
        react({
            babel: { plugins: ['styled-components'] },
        }),
        tsconfigPaths(),
        eslintPlugin({ eslintOptions: { cache: false } }),
    ],
    resolve: {
        alias: {
            '@app': path.resolve(__dirname, './src'),
        },
    },
    logLevel: 'error',
});
