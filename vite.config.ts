import { defineConfig, UserConfig } from 'vite';
import * as path from 'node:path';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import eslintPlugin from '@nabla/vite-plugin-eslint';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import packageInfo from './package.json';
import { invoke } from '@tauri-apps/api';

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

export default defineConfig(async ({ command, mode }) => {
    const appConfig: { allow_telemetry?: boolean } = await invoke('get_app_config');
    const allowTelemetry = appConfig?.allow_telemetry ?? false;

    if (command === 'serve') {
        return { ...devOptions, ...baseOptions };
    }
    return {
        ...baseOptions,
        plugins: [
            ...plugins,
            sentryVitePlugin({
                org: 'tari-labs',
                project: packageInfo.name,
                release: {
                    name: packageInfo.version,
                },
                reactComponentAnnotation: { enabled: true },
                authToken: process.env.SENTRY_AUTH_TOKEN,
                disable: mode === 'development' || !allowTelemetry,
                telemetry: false,
            }),
        ],
    };
});
