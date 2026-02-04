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
    ignoreBinaries: ['commitlint'],
    ignoreDependencies: [
        'babel-plugin-styled-components',
        'babel-plugin-react-compiler',
        '@tauri-apps/cli',
        '@testing-library/react', // test infrastructure, will be used for component tests
    ],
    ignoreExportsUsedInFile: true,
};

export default config;
