import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import eslintPlugin from '@nabla/vite-plugin-eslint';
import tsconfigPaths from 'vite-tsconfig-paths';
import * as path from 'node:path';

// https://vitejs.dev/config/

export default defineConfig(() => {
    return {
        // prevent vite from obscuring rust errors
        clearScreen: false,
        // Tauri expects a fixed port, fail if that port is not available
        server: {
            port: 1420,
            strictPort: true,
            watch: {
                // 3. tell vite to ignore watching `src-tauri`
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
    };
});
