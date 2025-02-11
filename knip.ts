import type { KnipConfig } from 'knip';

const config: KnipConfig = {
    project: ['src/**/*.{js,ts,tsx}', 'scripts/**/*.{js,ts}'],
    rules: {
        files: 'error',
        dependencies: 'warn',
        unlisted: 'warn',
        exports: 'warn',
        types: 'warn',
        duplicates: 'error',
    },
    ignoreBinaries: ['commitlint'],
    ignoreDependencies: ['prettier-eslint', 'babel-plugin-styled-components'],
    ignoreExportsUsedInFile: true,
};

export default config;
