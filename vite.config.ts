import * as path from 'node:path';
import { defineConfig, UserConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import eslintPlugin from '@nabla/vite-plugin-eslint';
import react from '@vitejs/plugin-react';

const compilerErrFiles = [];

const plugins: UserConfig['plugins'] = [
    react({
        babel: {
            plugins: [
                [
                    'babel-plugin-react-compiler',
                    {
                        logger: {
                            logEvent(filename, event) {
                                const shouldLog = event.kind === 'CompileError';
                                if (shouldLog) {
                                    if (!compilerErrFiles.includes(filename)) {
                                        compilerErrFiles.push(filename);
                                    }
                                    console.log(
                                        `\n==========================================================Compiler==========================================================`
                                    );
                                    const line = event?.detail?.loc?.start?.line;
                                    console.error(`[Compiler] ${event.kind}: ${filename}${line ? `:${line}` : ''}`);
                                    if (event.detail.severity) {
                                        console.error('[Compiler] Severity:', event.detail.severity);
                                    }
                                    if (event.detail.reason) {
                                        console.error('[Compiler] Reason:', event.detail.reason);
                                    }
                                    if (event.detail.description) {
                                        console.error('[Compiler] Description:', event.detail.description);
                                    }
                                    if (event.detail.suggestions) {
                                        console.error('[Compiler] Suggestions:', event.detail.suggestions);
                                    }

                                    console.log(
                                        `============================================================End============================================================\n`
                                    );
                                    if (compilerErrFiles.length) {
                                        console.log(
                                            `\n==========================================================Compiler Totals==========================================================`
                                        );
                                        console.log(`[Compiler] Total Errors: ${compilerErrFiles.length}`);

                                        compilerErrFiles.forEach((file) => {
                                            console.log(`[Compiler] files: ${file}`);
                                        });
                                        console.log(
                                            `============================================================Totals End============================================================\n`
                                        );
                                    }
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
