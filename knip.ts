import type { KnipConfig } from 'knip';

const config: KnipConfig = {
    project: ['src/**/*.{js,ts,tsx}', 'scripts/**/*.{js,ts}'],
    rules: {
        files: 'error',
        dependencies: 'warn',
        unlisted: 'error',
        exports: 'warn',
        types: 'warn',
        duplicates: 'error',
        enumMembers: 'off',
        unresolved: 'warn',
    },
    ignore: ['playwright/**'],
    ignoreBinaries: ['commitlint', 'playwright'],
    ignoreDependencies: ['babel-plugin-styled-components', 'babel-plugin-react-compiler', '@tauri-apps/cli'],
    ignoreExportsUsedInFile: true,
};

export default config;
