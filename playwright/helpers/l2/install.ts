// Standalone Node TypeScript entry point, shared by setup and CI.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export function readOotleRev(manifest: string): string {
    const rev = manifest.match(/^tari_ootle_wallet_sdk\s*=\s*\{[^}]*\brev\s*=\s*"([0-9a-f]{40})"/m)?.[1];
    if (!rev) throw new Error('Cannot find exact tari_ootle_wallet_sdk rev in src-tauri/Cargo.toml');
    return rev;
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
    const rev = readOotleRev(fs.readFileSync(path.join(root, 'src-tauri/Cargo.toml'), 'utf8'));
    if (process.argv.includes('--print-rev')) {
        console.log(rev);
    } else {
        const cache = path.join(path.resolve(root, process.env.L2_SWARM_CACHE || 'target/l2-swarm-cache'), rev);
        const binaries = path.join(cache, 'bin');
        const required = [
            'tari_swarm_daemon',
            'tari_validator_node',
            'tari_indexer',
            'tari_ootle_walletd',
            'minotari_node',
            'minotari_miner',
            'minotari_console_wallet',
        ];
        const marker = path.join(cache, 'installed-rev');
        if (
            !fs.existsSync(marker) ||
            fs.readFileSync(marker, 'utf8').trim() !== rev ||
            required.some((binary) => {
                try {
                    fs.accessSync(path.join(binaries, binary), fs.constants.X_OK);
                    return false;
                } catch {
                    return true;
                }
            })
        ) {
            const run = (command: string, args: string[], cwd = cache) => {
                const result = spawnSync(command, args, { cwd, stdio: 'inherit', env: process.env });
                if (result.status !== 0)
                    throw new Error(
                        `Cannot install L2 swarm at SDK rev ${rev}: ${command} failed (${result.error?.message ?? result.status}). Install Rust, pnpm, protobuf and the app's Linux build dependencies, then retry.`
                    );
            };
            fs.mkdirSync(binaries, { recursive: true });
            const source = path.join(cache, 'source');
            fs.mkdirSync(source, { recursive: true });
            const archive = path.join(cache, 'source.tar.gz');
            if (!fs.existsSync(path.join(source, 'Cargo.toml'))) {
                run('curl', [
                    '--fail',
                    '--location',
                    '--retry',
                    '3',
                    `https://api.github.com/repos/tari-project/tari-ootle/tarball/${rev}`,
                    '--output',
                    archive,
                ]);
                run('tar', ['-xzf', archive, '-C', source, '--strip-components=1']);
            }
            run('rustup', ['target', 'add', 'wasm32-unknown-unknown'], source);
            // The swarm embeds its web UI even for non-interactive operation.
            const webui = path.join(source, 'applications/tari_swarm_daemon/webui');
            run('npm', ['ci', '--ignore-scripts'], webui);
            run('npm', ['run', 'build'], webui);
            run(
                'cargo',
                [
                    'build',
                    '--release',
                    '--locked',
                    '--no-default-features',
                    '-p',
                    'tari_swarm_daemon',
                    '-p',
                    'tari_validator_node',
                    '-p',
                    'tari_indexer',
                    '-p',
                    'tari_ootle_walletd',
                ],
                source
            );
            for (const binary of required.slice(0, 4))
                fs.copyFileSync(path.join(source, 'target/release', binary), path.join(binaries, binary));
            // L1 binaries use the version required by this SDK checkout, not the host's installed version.
            const upstreamManifest = fs.readFileSync(path.join(source, 'Cargo.toml'), 'utf8');
            const l1Version = upstreamManifest.match(/^minotari_node_grpc_client\s*=\s*"([^"]+)"/m)?.[1];
            if (!l1Version) throw new Error(`Cannot identify the L1 binary version for SDK ${rev}`);
            // Tari publishes these prebuilt; the app runs the same esme build on localnet.
            const release = spawnSync(
                'curl',
                [
                    '--fail',
                    '--silent',
                    '--location',
                    '--retry',
                    '3',
                    `https://api.github.com/repos/tari-project/tari/releases/tags/v${l1Version}`,
                ],
                { encoding: 'utf8' }
            );
            if (release.status !== 0) throw new Error(`Cannot read the Tari v${l1Version} release`);
            const suite = (JSON.parse(release.stdout).assets as { name: string }[])
                .map((asset) => asset.name)
                .find((name) =>
                    new RegExp(
                        `^tari_suite-${l1Version.replace(/\./g, '\\.')}-esme-[0-9a-f]+-linux-x86_64\\.zip$`
                    ).test(name)
                );
            if (!suite) throw new Error(`No linux-x86_64 esme tari_suite asset in Tari v${l1Version}`);
            const download = `https://github.com/tari-project/tari/releases/download/v${l1Version}/${suite}`;
            const suiteZip = path.join(cache, suite);
            run('curl', ['--fail', '--location', '--retry', '3', download, '--output', suiteZip]);
            run('curl', [
                '--fail',
                '--location',
                '--retry',
                '3',
                `${download}.sha256`,
                '--output',
                `${suiteZip}.sha256`,
            ]);
            run('sha256sum', ['--check', `${suite}.sha256`]);
            run('unzip', ['-o', suiteZip, ...required.slice(4), '-d', binaries]);
            for (const binary of required.slice(4)) fs.chmodSync(path.join(binaries, binary), 0o755);
            fs.rmSync(suiteZip, { force: true });
            fs.rmSync(`${suiteZip}.sha256`, { force: true });
            fs.writeFileSync(marker, rev);
            fs.rmSync(source, { recursive: true, force: true });
            fs.rmSync(archive, { force: true });
        }
        console.log(`L2 swarm ${rev}: ${binaries}`);
    }
}
