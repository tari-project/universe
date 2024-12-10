#!/usr/bin/env node

// Copyright 2022 The Tari Project
// SPDX-License-Identifier: BSD-3-Clauses

import fs from 'fs';
import path from 'path';
import process from 'process';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const BASE_PATH = path.join(__dirname, '..', 'public', 'locales');

/**
 * Recursively merges properties of two objects.
 *
 * @param {Object} target - The target object to merge properties into.
 * @param {Object} source - The source object to merge properties from.
 * @returns {Object} - The merged object.
 */
function mergeDeep(target, source) {
    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            // If the property is an object, call mergeDeep recursively
            if (typeof source[key] === 'object' && source[key] !== null) {
                // Create an empty object if the target key doesn't exist
                if (!target[key]) {
                    target[key] = {};
                }
                mergeDeep(target[key], source[key]); // Recursive merge
            } else {
                // Otherwise, just assign the value
                target[key] = source[key];
            }
        }
    }
    return target;
}

/**
 * Sets a nested value in an object based on a dot-separated key string.
 *
 * @param {Object} obj - The object to update.
 * @param {string} key - The dot-separated key string (e.g., "key_1.key_2.key_3").
 * @param {any} value - The new value to set.
 * @returns {Object} - The updated object.
 */
function setNestedValue(obj, key, value) {
    const keys = key.split('.');
    let current = {};

    for (let i = keys.length; i; i--) {
        if (i === keys.length) {
            current = { [keys[i - 1]]: value };
        } else {
            current = { [keys[i - 1]]: current };
        }
    }
    mergeDeep(obj, current);
}

/**
 * Retrieves the file paths of locale files based on the provided scope file name.
 *
 * @param {string} scopeFileName - The name of the scope file to search for.
 * @returns {Promise<string[]>} - A promise that resolves to an array of file paths.
 */
async function getLocalesFilePaths(scopeFileName) {
    let fileNames = [];

    try {
        const localesDirs = await fs.promises.readdir(BASE_PATH, { withFileTypes: true });

        localesDirs.forEach((dir) => {
            if (dir.isDirectory()) {
                const fileNamePath = path.join(BASE_PATH, dir.name, `${scopeFileName}.json`);
                fileNames.push(fileNamePath);
            }
        });
    } catch (err) {
        console.error('Error reading directory:', err);
    }

    return fileNames;
}

/**
 * Sorts the keys of an object alphabetically.
 *
 * @param {Object} obj - The object to sort.
 * @returns {Object} - The sorted object.
 */
function sortObjectKeys(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(sortObjectKeys);

    const sortedObj = {};
    Object.keys(obj)
        .sort()
        .forEach((key) => {
            sortedObj[key] = sortObjectKeys(obj[key]);
        });

    return sortedObj;
}

/**
 * Updates translation files by setting a nested value in JSON files
 * located in the 'public/locales' directory. It takes a file name and an optional key-value
 * pair as arguments. The key is a dot-separated string representing the nested property to update,
 * and the value is the new value to set.
 *
 * If only the file name is provided, the script will clean up and format the translation files
 * by merging them with the default English translations and sorting the keys.
 *
 * Usage:
 *   `npm run translate <fileName> [<key="value">]`
 *
 * Arguments:
 *   *fileName* - The name of the scope file to search for (without extension).
 *   *key="value"* (optional) - The key-value pair to set in the translation files.
 *
 * Examples:
 *   `npm run translate common` - Cleans up and formats the translation files for the 'common' scope.
 *   `npm run translate common greeting.hello="Hello, world!"` - Sets the value of 'greeting.hello' to "Hello, world!" in the 'common' scope.
 */
async function main() {
    const args = process.argv.slice(2);
    const fileName = args[0];

    if (args.length === 1) {
        console.info(`Cleaning up locales files for "${fileName}"...`);
    }

    if (!args.length) {
        console.error(`
            Usage:
            npm run translate <fileName> - to prettify and create english templates for all locales
            npm run translate <fileName> <key="value"> - create translations template based on en
        `);
        process.exit(1);
    }
    const localesFilesPaths = await getLocalesFilePaths(fileName);

    const enTranslationFile = path.join(BASE_PATH, 'en', `${fileName}.json`);
    const enTranslations = await fs.promises.readFile(enTranslationFile);

    for (const filePath of localesFilesPaths) {
        try {
            // Ensure the locale file exists
            try {
                await fs.promises.access(filePath, fs.constants.F_OK);
            } catch (_err) {
                await fs.promises.writeFile(filePath, JSON.stringify({}, null, 2));
            }

            // Read the current translation file
            const file = await fs.promises.readFile(filePath, 'utf8');

            const translations = JSON.parse(file);
            const translationsWithDefaults = mergeDeep(JSON.parse(enTranslations), translations);
            if (args.length > 1) {
                const translation = args[1].split('=');
                setNestedValue(translationsWithDefaults, translation[0], translation[1]);
            }

            const sortedTranslations = sortObjectKeys(translationsWithDefaults);

            await fs.promises.writeFile(filePath, JSON.stringify(sortedTranslations, null, 2));
        } catch (err) {
            console.error('Error processing file:', filePath, err);
        }
    }

    console.info('Translation update complete!');
}

main();
