import { defineConfig, UserConfig } from 'vite';
import * as path from 'node:path';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import eslintPlugin from '@nabla/vite-plugin-eslint';
import packageInfo from './package.json';
import { sentryVitePlugin } from '@sentry/vite-plugin';

const plugins: UserConfig['plugins'] = [
    react({
        babel: { plugins: ['styled-components'] },
    }),
    tsconfigPaths(),
    eslintPlugin({ eslintOptions: { cache: false } }),
];
const baseOptions: UserConfig = {
    plugins,
    resolve: {
        alias: {
            '@app': path.resolve(__dirname, './src'),
            // TODO: Remove from production build
            'react-dom$': 'react-dom/profiling',
        },
    },
    logLevel: 'error',
};

const devOptions: UserConfig = {
    clearScreen: false,
    server: {
        port: 1420,
        strictPort: true,
        watch: {
            ignored: ['**/src-tauri/**'],
        },
    },
};

export default defineConfig(({ command, mode }) => {
    if (command === 'serve') {
        return { ...devOptions, ...baseOptions };
    }
    return {
        ...baseOptions,
        build: {
            sourcemap: true,
        },
        plugins: [
            ...plugins,
            sentryVitePlugin({
                org: 'tari-labs',
                project: 'tari-universe',
                release: {
                    name: packageInfo.version,
                },
                reactComponentAnnotation: { enabled: true },
                authToken: process.env.SENTRY_AUTH_TOKEN,
                disable: mode === 'development',
                telemetry: false,
                sourcemaps: {
                    assets: ['./dist/**'],
                    ignore: [
                        'node_modules',
                        './dist/assets/textures/**',
                        './dist/assets/models/**',
                        './dist/assets/glApp.js',
                    ],
                },
            }),
        ],
    };
});
