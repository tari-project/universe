import * as path from 'node:path';
import { defineConfig, UserConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import eslintPlugin from '@nabla/vite-plugin-eslint';
import react from '@vitejs/plugin-react';

const compilerLogFiles = [];

function logEvent(filename, event) {
    const shouldLog = event.kind !== 'CompileSuccess';
    if (shouldLog) {
        if (!compilerLogFiles.includes(filename)) {
            compilerLogFiles.push(filename);
        }
        console.log(
            `\n==========================================================Compiler==========================================================`
        );
        const line = event?.detail?.loc?.start?.line;
        console.log(`[Compiler] ${event.kind}: ${filename}${line ? `:${line}` : ''}`);

        if (event.detail?.severity) {
            console.log('[Compiler] Severity:', event.detail.severity);
        }
        if (event.detail?.reason) {
            console.log('[Compiler] Reason:', event.detail.reason);
        }
        if (event.detail?.description) {
            console.log('[Compiler] Description:', event.detail.description);
        }
        if (event.detail?.suggestions) {
            console.log('[Compiler] Suggestions:', event.detail.suggestions);
        }

        console.log(
            `============================================================End============================================================\n`
        );
        if (compilerLogFiles.length) {
            console.log(
                `\n==========================================================Compiler Totals (${compilerLogFiles.length})==========================================================`
            );
            console.log(`[Compiler] Total Files: ${compilerLogFiles.length}`);

            compilerLogFiles.forEach((file) => {
                console.log(`[Compiler] files: ${file}`);
            });
            console.log(
                `============================================================Totals End============================================================\n`
            );
        }
    }
}

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
                [
                    'babel-plugin-react-compiler',
                    {
                        logger: {
                            logEvent(filename, event) {
                                logEvent(filename, event);
                            },
                        },
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
