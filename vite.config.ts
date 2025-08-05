import * as path from 'node:path';
import { defineConfig, UserConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import eslintPlugin from '@nabla/vite-plugin-eslint';
import react from '@vitejs/plugin-react';
import log from 'eslint-plugin-react/lib/util/log';

const plugins: UserConfig['plugins'] = [
    react({
        babel: {
            plugins: [
                [
                    'babel-plugin-react-compiler',
                    {
                        logger: {
                            logEvent(filename, event) {
                                const shouldLog =
                                    event.kind === 'CompileError' ||
                                    event.kind === 'PipelineError' ||
                                    event.kind === 'CompileSkip';
                                if (shouldLog) {
                                    console.log(`=============================Compiler=============================`);
                                    console.error(`[Compiler] ${event.kind}: ${filename}`);
                                    console.error(`[Compiler] Reason: ${event.detail.reason}`);

                                    if (event.detail.description) {
                                        console.error(`[Compiler] Details: ${event.detail.description}`);
                                    }

                                    if (event.detail.loc) {
                                        const { line, column } = event.detail.loc.start;
                                        console.error(`[Compiler] Location: Line ${line}, Column ${column}`);
                                    }

                                    if (event.detail.suggestions) {
                                        console.error('[Compiler] Suggestions:', event.detail.suggestions);
                                    }
                                    console.log(`=============================End=============================`);
                                }
                            },
                        },
                    },
                ],
                [
                    'babel-plugin-styled-components',
                    {
                        displayName: true,
                        fileName: true,
                    },
                ],
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
