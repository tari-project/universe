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
    },
    ignoreBinaries: ['commitlint'],
    ignoreDependencies: ['babel-plugin-styled-components', 'babel-plugin-react-compiler'], // needed by plugins
    ignoreExportsUsedInFile: true,
};

export default config;
