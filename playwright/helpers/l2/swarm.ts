import { spawn, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readOotleRev } from './install';

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export const swarmUrl = 'http://127.0.0.1:18080/json_rpc';
export const stateFile = path.join(projectRoot, 'playwright/test-results-l2/swarm.json');

export async function rpc<T>(
    url: string,
    method: string,
    params: unknown,
    timeout = 30_000,
    token?: string
): Promise<T> {
    const endpoint = new URL(url);
    if (endpoint.protocol !== 'http:' || endpoint.hostname !== '127.0.0.1' || endpoint.username || endpoint.password)
        throw new Error('L2 RPC requires a loopback HTTP endpoint');
    const response = await fetch(url, {
        redirect: 'error',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
        signal: AbortSignal.timeout(timeout),
    });
    if (!response.ok) throw new Error(`${method}: HTTP ${response.status} from ${url}`);
    const body = (await response.json()) as { result?: T; error?: { code?: number } };
    if (body.error) throw new Error(`${method}: RPC error ${body.error.code ?? 'unknown'}`);
    if (!('result' in body)) throw new Error(`${method}: invalid JSON-RPC response from ${url}`);
    return body.result as T;
}

interface Instance {
    instance_type: string;
    ports: Record<string, number>;
    is_running: boolean;
}
export function instanceEndpoints(instances: Instance[]) {
    const endpoint = (type: string, port: string) => {
        const instance = instances.find((i) => i.instance_type === type && i.is_running && i.ports[port]);
        if (!instance) throw new Error(`Swarm has no running ${type} with a ${port} port`);
        return `http://127.0.0.1:${instance.ports[port]}`;
    };
    // RemoteNodeAdapter's LocalNet wallet HTTP endpoint is fixed at 18142.
    // Allocate that port explicitly and reject a fallback allocation onto another chain.
    const baseNode = endpoint('MinoTariNode', 'grpc');
    const walletHttp = endpoint('MinoTariNode', 'http_api');
    if (walletHttp !== 'http://127.0.0.1:18142')
        throw new Error(`LocalNet wallet HTTP requires port 18142; swarm allocated ${walletHttp}`);
    return {
        baseNode,
        indexer: endpoint('TariIndexer', 'api'),
        walletd: `${endpoint('TariWalletDaemon', 'jrpc')}/json_rpc`,
        validators: instances
            .filter((i) => i.instance_type === 'TariValidatorNode' && i.is_running)
            .map((i) => `http://127.0.0.1:${i.ports.jrpc}/json_rpc`),
    };
}

export function validatorIsActive(stats: {
    current_epoch: number;
    start_epoch: number | null;
    is_valid: boolean;
    is_initial_scanning_complete: boolean;
    committee_info: { epoch: number } | null;
}): boolean {
    return (
        stats.is_valid &&
        stats.is_initial_scanning_complete &&
        stats.start_epoch !== null &&
        stats.start_epoch <= stats.current_epoch &&
        stats.committee_info?.epoch === stats.current_epoch
    );
}

export async function until<T>(label: string, probe: () => Promise<T | undefined>, timeout = 180_000): Promise<T> {
    const deadline = Date.now() + timeout;
    let lastError: unknown;
    while (Date.now() < deadline) {
        try {
            const result = await probe();
            if (result !== undefined) return result;
        } catch (error) {
            lastError = error;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new Error(`${label} timed out after ${timeout}ms. Last error: ${String(lastError)}`);
}

export function run(command: string, args: string[], cwd = projectRoot, timeout?: number): void {
    const result = spawnSync(command, args, {
        cwd,
        stdio: 'inherit',
        env: process.env,
        timeout,
        killSignal: 'SIGKILL',
    });
    if (result.status !== 0)
        throw new Error(`L2 setup: ${command} ${args.join(' ')} failed: ${result.error?.message ?? result.status}`);
}

export function installSwarm(): string {
    run('node', ['--experimental-strip-types', path.join(projectRoot, 'playwright/helpers/l2/install.ts')]);
    const rev = readOotleRev(fs.readFileSync(path.join(projectRoot, 'src-tauri/Cargo.toml'), 'utf8'));
    return path.join(path.resolve(projectRoot, process.env.L2_SWARM_CACHE || 'target/l2-swarm-cache'), rev, 'bin');
}

export function configureSwarm(config: string): string {
    if (!/^\[settings\]$/m.test(config)) throw new Error('Swarm init config has no settings table');
    return config.replace(/^\[settings\]$/m, '[settings]\noverride_keyring_password = "playwright-localnet-only"');
}

export async function startSwarm(): Promise<ReturnType<typeof instanceEndpoints>> {
    if (process.platform !== 'linux') throw new Error('The L2 swarm harness currently requires Linux');
    const binaries = installSwarm();
    const data = path.join(projectRoot, 'playwright/test-results-l2/swarm');
    fs.mkdirSync(data, { recursive: true });
    const daemon = path.join(binaries, 'tari_swarm_daemon');
    const args = ['--base-dir', data, '--network', 'localnet'];
    run(daemon, [
        ...args,
        'init',
        '--no-compile',
        '--binaries-root',
        binaries,
        '--start-port',
        '18140',
        '--webui-listen-address',
        '127.0.0.1:18080',
        '--wallet-daemon-auth',
        'none',
    ]);
    const configFile = path.join(data, 'config.toml');
    fs.writeFileSync(configFile, configureSwarm(fs.readFileSync(configFile, 'utf8')));
    const logFd = fs.openSync(path.join(data, 'stdout.log'), 'a');
    const child = spawn(daemon, [...args, 'start', '--no-compile', '--binaries-root', binaries], {
        detached: true,
        stdio: ['ignore', logFd, logFd],
        env: process.env,
    });
    if (child.pid) process.env.TEST_L2_SWARM_PID = String(child.pid);
    let spawnError: Error | undefined;
    child.on('error', (error) => {
        spawnError = error;
    });
    fs.closeSync(logFd);
    const endpoints = await until(
        'Swarm services and active validator committee',
        async () => {
            if (spawnError) throw spawnError;
            if (child.exitCode !== null) throw new Error(`Swarm exited ${child.exitCode}; see ${data}/stdout.log`);
            const { instances } = await rpc<{ instances: Instance[] }>(swarmUrl, 'list_instances', {});
            const endpoints = instanceEndpoints(instances);
            if (!endpoints.validators.length) return;
            const response = await fetch(`${endpoints.indexer}/network`, { signal: AbortSignal.timeout(5000) });
            if (!response.ok) throw new Error(`Indexer /network: HTTP ${response.status}`);
            const network = await response.json();
            if (network !== 'localnet' && network?.network !== 'localnet')
                throw new Error(`Indexer is not localnet: ${JSON.stringify(network)}`);
            for (const validator of endpoints.validators) {
                const stats = await rpc<Parameters<typeof validatorIsActive>[0]>(
                    validator,
                    'get_epoch_manager_stats',
                    {}
                );
                if (!validatorIsActive(stats)) return;
            }
            return endpoints;
        },
        600_000
    );
    fs.writeFileSync(stateFile, JSON.stringify(endpoints));
    return endpoints;
}

export function swarmState(): ReturnType<typeof instanceEndpoints> {
    return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
}

export async function mine(blocks: number): Promise<void> {
    await rpc(swarmUrl, 'mine', { num_blocks: blocks }, 180_000);
}

export async function stopSwarm(): Promise<void> {
    const pid = Number(process.env.TEST_L2_SWARM_PID);
    if (!Number.isSafeInteger(pid) || pid <= 0) return;
    try {
        process.kill(-pid, 'SIGINT');
    } catch {
        return;
    }
    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
        try {
            process.kill(-pid, 0);
        } catch {
            return;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    try {
        process.kill(-pid, 'SIGKILL');
    } catch {
        /* exited */
    }
}
