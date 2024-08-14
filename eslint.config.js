import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
    react.configs.flat.recommended,
    react.configs.flat['jsx-runtime'],
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            globals: { ...globals.browser },
        },
        files: ['src/**/*.{js,ts,jsx,tsx}'],
        ignores: ['./**/*.config.{js,ts}'],
        plugins: { react },
        rules: {
            'react/jsx-uses-react': 'off',
            'react/react-in-jsx-scope': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
        },
    },
    prettierConfig,
];
