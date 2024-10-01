import * as fs from 'fs';
import * as path from 'path';

// Function to recursively find JSON files
function findJsonFiles(baseDirectory) {
    let jsonFiles = [];
    const files = fs.readdirSync(baseDirectory);
    files.forEach(file => {
        const fullPath = path.join(baseDirectory, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            jsonFiles = jsonFiles.concat(findJsonFiles(fullPath));
        } else if (file.endsWith('.json')) {
            jsonFiles.push(fullPath);
        }
    });
    return jsonFiles;
}

// Function to load a JSON file and return its content along with the file name
function loadJson(filePath) {
    return [JSON.parse(fs.readFileSync(filePath, 'utf-8')), path.basename(filePath)];
}

// Function to load keys from all English JSON files
function loadEnKeys(enJsonFiles) {
    let allKeys = new Set();
    enJsonFiles.forEach(jsonFile => {
        const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
        Object.keys(data).forEach(key => allKeys.add(key));
    });
    return allKeys;
}

// Function to compare the English keys with other locale keys
function compareKeys(enData, otherLocaleData) {
    const enKeys = new Set(Object.keys(enData));
    const otherKeys = new Set(Object.keys(otherLocaleData));

    const missingKeys = [...enKeys].filter(key => !otherKeys.has(key));
    const extraneousKeys = [...otherKeys].filter(key => !enKeys.has(key));

    return [missingKeys, extraneousKeys];
}

// Function to search for keys in files recursively under the search path
function searchForKeyInFiles(key, searchPath) {
    const files = findJsonFiles(searchPath);
    for (const file of files) {
        const contents = fs.readFileSync(file, 'utf-8');
        if (contents.includes(key)) {
            return true; // Key is found
        }
    }
    return false; // Key not found
}

// Function to write a CSV for English labels
function writeEnglishLabelsCsv(enData, outputFile) {
    const headers = `"label_key","value","json_file"\n`;
    let rows = '';
    Object.entries(enData).forEach(([label_key, value]) => {
        rows += `"${label_key}","${value.value}","${value.json_file}"\n`;
    });
    fs.writeFileSync(outputFile, headers + rows);
}

// Function to write a consolidated comparison CSV for all locales
function writeConsolidatedComparisonCsv(comparisonData, outputFile) {
    const headers = `"locale","status","label_key","json_file"\n`;
    let rows = '';
    Object.entries(comparisonData).forEach(([locale, data]) => {
        data.missingKeys.forEach(({ key, jsonFile }) => {
            rows += `"${locale}","missing","${key}","${jsonFile}"\n`;
        });
        data.extraneousKeys.forEach(({ key, jsonFile }) => {
            rows += `"${locale}","extraneous","${key}","${jsonFile}"\n`;
        });
    });
    fs.writeFileSync(outputFile, headers + rows);
}

// Function to write unused keys to a CSV file
function writeUnusedKeysToCsv(unusedKeys, outputFile) {
    const headers = `"unused_key"\n`;
    let rows = '';
    unusedKeys.forEach(key => {
        rows += `"${key}"\n`;
    });
    fs.writeFileSync(outputFile, headers + rows);
}

// Unused keys function
function findUnusedKeys(enLocalePath, searchBasePath, outputDir) {
    const enJsonFiles = findJsonFiles(enLocalePath);
    const allEnKeys = loadEnKeys(enJsonFiles);

    const unusedKeys = [];
    allEnKeys.forEach(key => {
        console.log(`Searching for key: ${key}`);
        if (!searchForKeyInFiles(key, searchBasePath)) {
            unusedKeys.push(key);
        }
    });

    if (outputDir) {
        const outputFile = path.join(outputDir, 'unused_keys.csv');
        writeUnusedKeysToCsv(unusedKeys, outputFile);
        console.log(`Unused keys written to ${outputFile}`);
    } else {
        console.log('Unused keys:');
        console.log(unusedKeys);
    }
}

// Key comparison function
function compareKeysInLocales(basePath, enPath, outputDir) {
    const enFiles = findJsonFiles(enPath);
    const allEnData = {};
    enFiles.forEach(enFile => {
        const [enData, jsonFile] = loadJson(enFile);
        Object.entries(enData).forEach(([key, value]) => {
            allEnData[key] = { value, json_file: jsonFile };
        });
    });

    if (outputDir) {
    const englishLabelsOutputFile = path.join(outputDir, 'english_labels.csv');
    writeEnglishLabelsCsv(allEnData, englishLabelsOutputFile);
    }

    const comparisonData = {};
    const otherLocales = fs.readdirSync(basePath).filter(
        d => fs.statSync(path.join(basePath, d)).isDirectory() && d !== 'en'
    );

    otherLocales.forEach(locale => {
        const localePath = path.join(basePath, locale);
        const localeFiles = findJsonFiles(localePath);
        const localeData = {};
        localeFiles.forEach(localeFile => {
            const [localeJsonData, jsonFile] = loadJson(localeFile);
            Object.entries(localeJsonData).forEach(([key, value]) => {
                localeData[key] = { value, json_file: jsonFile };
            });
        });

        const enKeys = new Set(Object.keys(allEnData));
        const localeKeys = new Set(Object.keys(localeData));
        const missingKeys = [...enKeys].filter(key => !localeKeys.has(key));
        const extraneousKeys = [...localeKeys].filter(key => !enKeys.has(key));

        comparisonData[locale] = {
            missingKeys: missingKeys.map(key => ({ key, jsonFile: allEnData[key].json_file })),
            extraneousKeys: extraneousKeys.map(key => ({ key, jsonFile: localeData[key].json_file }))
        };
    });

    if (outputDir) {
        const consolidatedOutputFile = path.join(outputDir, 'locale_key_comparison_consolidated.csv');
        writeConsolidatedComparisonCsv(comparisonData, consolidatedOutputFile);
    } else {
        console.log('Comparison data:');
        console.log(JSON.stringify(comparisonData, null, 2));
    }

    console.log(`Comparison CSV written to ${consolidatedOutputFile}`);
}

// Function to parse the arguments into key-value pairs
function parseArguments() {
    const args = process.argv.slice(2);
    const argMap = {};
    for (let i = 0; i < args.length; i += 2) {
        const key = args[i];
        const value = args[i + 1];
        if (key.startsWith('--')) {
            argMap[key.slice(2)] = value;
        }
    }
    return argMap;
}

// Main function to parse arguments and invoke appropriate functions
function main() {
    const args = parseArguments();
    const enLocalePath = args['en-locale-path'] || 'public/locales/en';
    const basePath = args['base-path'] || 'public/locales';
    const outputDir = args['output-dir'];
    const searchPath = args['search-path'] || 'src';


    compareKeysInLocales(basePath, enLocalePath, outputDir);
    findUnusedKeys(enLocalePath, searchPath, outputDir);

}

// Run the script
main();
