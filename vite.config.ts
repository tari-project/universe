import { defineConfig, UserConfig } from 'vite';
import * as path from 'node:path';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import eslintPlugin from '@nabla/vite-plugin-eslint';

const ReactCompilerConfig = {
    sources: (filename) => {
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
                        pure: true,
                        displayName: true,
                        meaninglessFileNames: ['index', 'styles', 'style'],
                    },
                ],
                ['babel-plugin-react-compiler', ReactCompilerConfig],
            ],
        },
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

export default defineConfig(({ command }) => {
    if (command === 'serve') {
        return { ...devOptions, ...baseOptions };
    }
    return {
        ...baseOptions,
        plugins,
        build: {
            sourcemap: true,
        },
    };
});
