import reactCompiler from 'eslint-plugin-react-compiler';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';
import i18next from 'eslint-plugin-i18next';

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
        files: ['src/**/*.{js,ts,jsx,tsx}', 'scripts/**/*.{js,ts,jsx,tsx}'],
        ignores: ['./**/*.config.{js,ts}'],
        plugins: { react, 'react-hooks': hooksPlugin, i18next },
        rules: {
            ...react.configs.recommended.rules,
            ...hooksPlugin.configs.recommended.rules,
            'no-console': [
                'warn',
                { allow: ['info', 'warn', 'debug', 'error', 'group', 'groupCollapsed', 'groupEnd'] },
            ],
            'no-unused-vars': 'off', // base rule must be disabled
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/no-explicit-any': 'warn',
            'react/prop-types': 'off',
            'react/jsx-uses-react': 'off',
            'react/react-in-jsx-scope': 'off',
            'i18next/no-literal-string': ['error', { markupOnly: true }],
        },
    },
    {
        files: ['src/hooks/airdrop/useWebsocket.ts'],
        rules: {
            'react-hooks/exhaustive-deps': 'off',
            'react-compiler/react-compiler': [
                'warn',
                {
                    'react-hooks/exhaustive-deps': 'off',
                },
            ],
        },
    },
    reactCompiler.configs.recommended,
];
