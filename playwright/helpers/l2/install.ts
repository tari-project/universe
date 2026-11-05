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
            // The miner is not published on crates.io. Resolve the matching Tari source
            // commit from the published node crate instead of guessing a release tag.
            const nodeArchive = path.join(cache, 'minotari-node.tar.gz');
            run('curl', [
                '--fail',
                '--location',
                '--retry',
                '3',
                `https://crates.io/api/v1/crates/minotari_node/${l1Version}/download`,
                '--output',
                nodeArchive,
            ]);
            const metadata = spawnSync(
                'tar',
                ['-xOf', nodeArchive, `minotari_node-${l1Version}/.cargo_vcs_info.json`],
                { encoding: 'utf8' }
            );
            if (metadata.status !== 0) throw new Error(`Cannot read Tari source provenance for ${l1Version}`);
            const l1Rev: string = JSON.parse(metadata.stdout).git.sha1;
            if (!/^[0-9a-f]{40}$/.test(l1Rev)) throw new Error(`Invalid Tari source rev for ${l1Version}`);
            const l1Source = path.join(cache, 'l1-source');
            const l1Archive = path.join(cache, 'tari.tar.gz');
            if (!fs.existsSync(path.join(l1Source, 'Cargo.toml'))) {
                fs.mkdirSync(l1Source, { recursive: true });
                run('curl', [
                    '--fail',
                    '--location',
                    '--retry',
                    '3',
                    `https://api.github.com/repos/tari-project/tari/tarball/${l1Rev}`,
                    '--output',
                    l1Archive,
                ]);
                run('tar', ['-xzf', l1Archive, '-C', l1Source, '--strip-components=1']);
            }
            run(
                'cargo',
                [
                    'build',
                    '--release',
                    '--locked',
                    '-p',
                    'minotari_node',
                    '-p',
                    'minotari_miner',
                    '-p',
                    'minotari_console_wallet',
                ],
                l1Source
            );
            for (const binary of required.slice(4))
                fs.copyFileSync(path.join(l1Source, 'target/release', binary), path.join(binaries, binary));
            fs.rmSync(l1Source, { recursive: true, force: true });
            fs.rmSync(l1Archive, { force: true });
            fs.rmSync(nodeArchive, { force: true });
            fs.writeFileSync(marker, rev);
            fs.rmSync(source, { recursive: true, force: true });
            fs.rmSync(archive, { force: true });
        }
        console.log(`L2 swarm ${rev}: ${binaries}`);
    }
}
