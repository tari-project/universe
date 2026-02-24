// Copyright 2022 The Tari Project
// SPDX-License-Identifier: BSD-3-Clauses

import { spawn, spawnSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';

const args = process.argv.slice(2);

const envName = process.env.TARI_NETWORK || 'esmeralda';
console.log(`Loading environment file: ./src-tauri/env.${envName}`);

const envPath = path.resolve(`./src-tauri/env.${envName}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.warn(`Could not load ${envPath}, falling back to default .env`);
    dotenv.config();
}

// Build process-wrapper before running tauri
// Use release profile if building for release, otherwise debug
const isRelease = args.includes('build') || args.includes('--release');

// Detect if we're building for universal-apple-darwin
const targetIdx = args.indexOf('--target');
const targetArg = targetIdx !== -1 ? args[targetIdx + 1] : null;
const isUniversal = targetArg === 'universal-apple-darwin';

if (isUniversal) {
    // Build for both architectures and create universal binary via lipo
    for (const arch of ['aarch64-apple-darwin', 'x86_64-apple-darwin']) {
        console.log(`Building process-wrapper (${isRelease ? 'release' : 'debug'}) for ${arch}...`);
        const archArgs = ['build', '-p', 'process-wrapper', '--target', arch];
        if (isRelease) archArgs.push('--release');
        const result = spawnSync('cargo', archArgs, { stdio: 'inherit', shell: true });
        if (result.status !== 0) {
            console.error(`Failed to build process-wrapper for ${arch}`);
            process.exit(result.status || 1);
        }
    }
} else {
    const cargoArgs = ['build', '-p', 'process-wrapper'];
    if (isRelease) {
        cargoArgs.push('--release');
    }

    console.log(`Building process-wrapper (${isRelease ? 'release' : 'debug'})...`);
    const cargoResult = spawnSync('cargo', cargoArgs, {
        stdio: 'inherit',
        shell: true,
    });

    if (cargoResult.status !== 0) {
        console.error('Failed to build process-wrapper');
        process.exit(cargoResult.status || 1);
    }
}

// Spawn the Tauri CLI binary (should be installed locally or globally)
const command = process.platform === 'win32' ? 'tauri.cmd' : 'tauri';

const child = spawn(command, args, {
    stdio: 'inherit',
    env: process.env,
    shell: true, // important for Windows
});

child.on('exit', (code) => process.exit(code));
