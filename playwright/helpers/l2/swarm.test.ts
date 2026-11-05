import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { readOotleRev } from './install';
import { projectRoot, instanceEndpoints, validatorIsActive, rpc, configureSwarm, run } from './swarm';

afterEach(() => vi.unstubAllGlobals());

describe('L2 swarm contract', () => {
    it('test_revision_sdk_pin_returns_exact_revision', () => {
        expect(
            readOotleRev(
                'tari_ootle_wallet_sdk = { git = "https://example.com/repo", rev = "0123456789012345678901234567890123456789" }'
            )
        ).toBe('0123456789012345678901234567890123456789');
    });
    it('test_revision_missing_sdk_pin_rejected', () => {
        expect(() => readOotleRev('tari_ootle_common_types = { rev = "abc" }')).toThrow(/tari_ootle_wallet_sdk/);
    });
    it('test_discovery_allocated_ports_used', () => {
        expect(
            instanceEndpoints([
                { instance_type: 'MinoTariNode', ports: { grpc: 12001, http_api: 18142 }, is_running: true },
                { instance_type: 'TariIndexer', ports: { api: 12008 }, is_running: true },
                { instance_type: 'TariWalletDaemon', ports: { jrpc: 12012 }, is_running: true },
                { instance_type: 'TariValidatorNode', ports: { jrpc: 12005 }, is_running: true },
            ])
        ).toEqual({
            baseNode: 'http://127.0.0.1:12001',
            indexer: 'http://127.0.0.1:12008',
            walletd: 'http://127.0.0.1:12012/json_rpc',
            validators: ['http://127.0.0.1:12005/json_rpc'],
        });
    });
    it('test_discovery_missing_running_service_rejected', () => {
        expect(() => instanceEndpoints([])).toThrow(/MinoTariNode/);
    });
    it('test_readiness_registered_committee_required', () => {
        const stats = {
            current_epoch: 3,
            start_epoch: 2,
            is_valid: true,
            is_initial_scanning_complete: true,
            committee_info: { epoch: 3 },
        };
        expect(validatorIsActive(stats)).toBe(true);
        expect(validatorIsActive({ ...stats, committee_info: null })).toBe(false);
        expect(validatorIsActive({ ...stats, committee_info: { epoch: 2 } })).toBe(false);
        expect(validatorIsActive({ ...stats, start_epoch: 4 })).toBe(false);
        expect(validatorIsActive({ ...stats, is_valid: false })).toBe(false);
    });
    it('test_rpc_server_error_is_not_success', async () => {
        vi.stubGlobal(
            'fetch',
            vi
                .fn()
                .mockResolvedValue(
                    new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, error: { code: -1, message: 'not ready' } }))
                )
        );
        await expect(rpc('http://127.0.0.1:1/json_rpc', 'mine', {})).rejects.toThrow(/mine.*RPC error -1/);
    });
});

it('test_installer_nonexecutable_cached_binary_fails_clearly', () => {
    fs.mkdirSync(path.join(projectRoot, 'target'), { recursive: true });
    const cache = fs.mkdtempSync(path.join(projectRoot, 'target/l2-install-test-'));
    try {
        const rev = readOotleRev(fs.readFileSync(path.join(projectRoot, 'src-tauri/Cargo.toml'), 'utf8'));
        const dir = path.join(cache, rev);
        fs.mkdirSync(path.join(dir, 'bin'), { recursive: true });
        fs.writeFileSync(path.join(dir, 'installed-rev'), rev);
        for (const binary of [
            'tari_swarm_daemon',
            'tari_validator_node',
            'tari_indexer',
            'tari_ootle_walletd',
            'minotari_node',
            'minotari_miner',
            'minotari_console_wallet',
        ]) {
            fs.writeFileSync(path.join(dir, 'bin', binary), '', { mode: 0o644 });
        }
        const result = spawnSync(
            process.execPath,
            ['--experimental-strip-types', path.join(projectRoot, 'playwright/helpers/l2/install.ts')],
            {
                env: { ...process.env, PATH: '', L2_SWARM_CACHE: cache },
                encoding: 'utf8',
            }
        );
        expect(result.status).not.toBe(0);
        expect(result.stderr).toContain(`Cannot install L2 swarm at SDK rev ${rev}`);
    } finally {
        fs.rmSync(cache, { recursive: true, force: true });
    }
});

it('test_config_noninteractive_walletd_uses_fixture_password', () => {
    expect(configureSwarm('network = "localnet"\n[settings]\n[webserver]\n')).toContain(
        '[settings]\noverride_keyring_password = "playwright-localnet-only"\n'
    );
    expect(() => configureSwarm('network = "localnet"')).toThrow(/settings/);
});

it('test_discovery_wallet_http_port_mismatch_rejected', () => {
    expect(() =>
        instanceEndpoints([
            { instance_type: 'MinoTariNode', ports: { grpc: 18101, http_api: 18102 }, is_running: true },
            { instance_type: 'TariIndexer', ports: { api: 18108 }, is_running: true },
            { instance_type: 'TariWalletDaemon', ports: { jrpc: 18112 }, is_running: true },
        ])
    ).toThrow(/18142/);
});

it('test_installer_relative_cache_downloads_into_the_cache', () => {
    fs.mkdirSync(path.join(projectRoot, 'target'), { recursive: true });
    const cache = fs.mkdtempSync(path.join(projectRoot, 'target/l2-relative-cache-test-'));
    try {
        const rev = readOotleRev(fs.readFileSync(path.join(projectRoot, 'src-tauri/Cargo.toml'), 'utf8'));
        const commands = path.join(cache, 'commands');
        fs.mkdirSync(commands);
        // Stop after the download so the check needs neither network access nor a Rust build.
        fs.writeFileSync(
            path.join(commands, 'curl'),
            `#!${process.execPath}\nimport fs from 'node:fs'; fs.writeFileSync(process.argv[process.argv.indexOf('--output') + 1], 'downloaded'); process.exit(17);\n`,
            { mode: 0o755 }
        );
        const result = spawnSync(
            process.execPath,
            ['--experimental-strip-types', path.join(projectRoot, 'playwright/helpers/l2/install.ts')],
            {
                cwd: path.join(projectRoot, 'playwright'),
                env: { ...process.env, PATH: commands, L2_SWARM_CACHE: path.relative(projectRoot, cache) },
                encoding: 'utf8',
            }
        );
        expect(result.status).not.toBe(0);
        expect(fs.readFileSync(path.join(cache, rev, 'source.tar.gz'), 'utf8')).toBe('downloaded');
    } finally {
        fs.rmSync(cache, { recursive: true, force: true });
    }
});

it('test_rpc_rejects_remote_endpoints_before_sending_secrets', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    for (const url of [
        'https://example.com/json_rpc',
        'http://127.0.0.1.example.com/json_rpc',
        'http://user:password@127.0.0.1/json_rpc',
    ]) {
        await expect(rpc(url, 'auth.request', {}, 1000, 'fixture-token')).rejects.toThrow(/loopback/);
    }
    expect(fetch).not.toHaveBeenCalled();
});

it('test_rpc_errors_do_not_serialize_server_secrets', async () => {
    const secret = 'fixture-secret-private-key';
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: -1, message: secret } })));
    vi.stubGlobal('fetch', fetch);
    const error = await rpc('http://127.0.0.1:18080/json_rpc', 'mine', {}).catch((error: Error) => error);
    expect(String(error)).toContain('RPC error -1');
    expect(String(error) + JSON.stringify(error)).not.toContain(secret);
    expect(fetch.mock.calls[0][1].redirect).toBe('error');
});

it('test_setup_command_timeout_stops_a_stalled_child', () => {
    expect(() => run(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], projectRoot, 100)).toThrow(
        /failed:.*ETIMEDOUT/
    );
});
