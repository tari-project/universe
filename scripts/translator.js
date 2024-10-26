#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import process from 'process';

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
    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    const basePath = path.join(__dirname, '..', 'public', 'locales');
    let fileNames = [];

    try {
        const localesDirs = await fs.promises.readdir(basePath, { withFileTypes: true });

        localesDirs.forEach((dir) => {
            if (dir.isDirectory()) {
                const fileNamePath = path.join(basePath, dir.name, `${scopeFileName}.json`);
                fileNames.push(fileNamePath);
            }
        });
    } catch (err) {
        console.error('Error reading directory:', err);
    }

    return fileNames;
}

/**
 * Updates translation files by setting a nested value in JSON files
 * located in the 'public/locales' directory. It takes a file name and a key-value
 * pair as arguments, where the key is a dot-separated string representing the
 * nested property to update, and the value is the new value to set.
 *
 * Usage:
 *   `npm run translate <fileName> <key="value">`
 *
 * Arguments:
 *   *fileName* - The name of the scope file to search for (without extension).
 *   *key="value"* - The key-value pair to set in the translation files.
 *
 * Example:
 *   `npm run translate common greeting.hello="Hello, world!"`
 */
async function main() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.error('Usage: npm run translate <fileName> <key="value">');
        process.exit(1);
    }

    const fileName = args[0];
    const translation = args[1].split('=');

    if (translation.length !== 2) {
        console.error('Translation argument must be in the format key=value');
        process.exit(1);
    }

    const localesFilesPaths = await getLocalesFilePaths(fileName);

    for (const filePath of localesFilesPaths) {
        try {
            const file = await fs.promises.readFile(filePath);
            const translations = JSON.parse(file);

            setNestedValue(translations, translation[0], translation[1]);

            await fs.promises.writeFile(filePath, JSON.stringify(translations, null, 2));
        } catch (err) {
            console.error('Error processing file:', filePath, err);
        }
    }
}

main();
