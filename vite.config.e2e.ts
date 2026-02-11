import { defineConfig, UserConfig } from 'vite';
import * as path from 'node:path';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

const ReactCompilerConfig = {
    sources: (filename: string) => {
        return filename.indexOf('src/App') !== -1;
    },
};

const plugins: UserConfig['plugins'] = [
    react({
        babel: {
            plugins: [
                [
                    'babel-plugin-styled-components',
                    {
                        displayName: true,
                        fileName: true,
                    },
                ],
                ['babel-plugin-react-compiler', ReactCompilerConfig],
            ],
        },
    }),
    tsconfigPaths(),
];

const shimDir = path.resolve(__dirname, './e2e/shims');

export default defineConfig({
    plugins,
    resolve: {
        alias: {
            '@app': path.resolve(__dirname, './src'),

            '@tauri-apps/api/core': path.resolve(shimDir, 'tauri-api-core.ts'),
            '@tauri-apps/api/event': path.resolve(shimDir, 'tauri-api-event.ts'),
            '@tauri-apps/api/window': path.resolve(shimDir, 'tauri-window.ts'),
            '@tauri-apps/api/webviewWindow': path.resolve(shimDir, 'tauri-webview-window.ts'),

            '@tauri-apps/plugin-clipboard-manager': path.resolve(shimDir, 'tauri-plugin-clipboard.ts'),
            '@tauri-apps/plugin-os': path.resolve(shimDir, 'tauri-plugin-os.ts'),
            '@tauri-apps/plugin-shell': path.resolve(shimDir, 'tauri-plugin-shell.ts'),
            '@tauri-apps/plugin-dialog': path.resolve(shimDir, 'tauri-plugin-dialog.ts'),
        },
    },
    logLevel: 'error',
    clearScreen: false,
    server: {
        port: 1420,
        strictPort: true,
        watch: {
            ignored: ['**/src-tauri/**'],
        },
    },
});
