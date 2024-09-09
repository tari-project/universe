import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';

import prettierConfig from 'eslint-config-prettier';
import prettierPluginConfig from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

import tsParser from '@typescript-eslint/parser';

export default [
    react.configs.flat.recommended,
    react.configs.flat['jsx-runtime'],
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    ...tseslint.configs.stylistic,
    prettierConfig,
    prettierPluginConfig,
    {
        settings: {
            react: {
                version: 'detect',
            },
        },
        languageOptions: {
            globals: { ...globals.browser },
            parser: tsParser,
            parserOptions: { ecmaFeatures: { jsx: true } },
        },
        files: ['src/**/*.{js,ts,jsx,tsx}'],
        ignores: ['./**/*.config.{js,ts}'],
        plugins: { react, 'react-hooks': hooksPlugin },
        rules: {
            ...react.configs.recommended.rules,
            ...hooksPlugin.configs.recommended.rules,
            'react/jsx-uses-react': 'off',
            'react/react-in-jsx-scope': 'off',
            'no-console': [
                'warn',
                { allow: ['info', 'warn', 'debug', 'error', 'group', 'groupCollapsed', 'groupEnd'] },
            ],
            'react/prop-types': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': 'warn',
        },
    },
];
