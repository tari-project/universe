import { spawn, spawnSync } from 'child_process';
import { createHash } from 'crypto';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { APP_ID, getAppConfigDir, getAppDataRoots, getAppCacheDir } from './app-dirs';
import { TEST_WALLET } from './test-wallet';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getBinaryPath(projectRoot: string): string {
  // cargo tauri build outputs to <project_root>/target, not src-tauri/target
  const debugDirs = [
    path.join(projectRoot, 'target', 'debug'),
    path.join(projectRoot, 'src-tauri', 'target', 'debug'),
  ];

  const candidates: string[] = [];
  for (const debugDir of debugDirs) {
    switch (os.platform()) {
      case 'win32':
        candidates.push(path.join(debugDir, 'tari-universe.exe'));
        candidates.push(path.join(debugDir, 'Tari Universe (Alpha).exe'));
        break;
      case 'darwin':
        candidates.push(path.join(debugDir, 'tari-universe'));
        candidates.push(path.join(debugDir, 'Tari Universe (Alpha)'));
        break;
      default:
        candidates.push(path.join(debugDir, 'tari-universe'));
        candidates.push(path.join(debugDir, 'Tari Universe (Alpha)'));
        break;
    }
  }

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0];
}

/**
 * Wipe all test-app data (chain DB, wallet DB, configs, logs) so every run
 * starts from a clean, deterministic state. Guarded by the dedicated test
 * identifier — this never touches a real Tari Universe profile.
 * Set KEEP_TEST_DATA=1 to skip (e.g. when iterating on a long-synced chain).
 */
function wipeTestData(): void {
  if (process.env.KEEP_TEST_DATA) {
    console.log('KEEP_TEST_DATA set: keeping existing test data.');
    return;
  }
  const cacheDir = getAppCacheDir();
  for (const dir of getAppDataRoots()) {
    if (!fs.existsSync(dir)) continue;
    if (path.resolve(dir) === path.resolve(cacheDir)) {
      // Keep downloaded sidecar binaries (node, wallet, xmrig, ...) —
      // re-downloading them every run is slow and a network flake source.
      // Wipe everything else in the cache dir.
      for (const entry of fs.readdirSync(dir)) {
        if (entry === 'binaries') continue;
        fs.rmSync(path.join(dir, entry), { recursive: true, force: true });
      }
      console.log(`Wiped test cache dir (kept binaries/): ${dir}`);
    } else {
      console.log(`Wiping test data dir: ${dir}`);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
}

function getConfigDir(): string {
  return path.join(getAppConfigDir(), 'app_configs', 'localnet');
}

function getPoolsConfig() {
  return {
    version_counter: 1,
    gpu_pool_enabled: false,
    current_gpu_pool: 'LuckyPoolC29',
    gpu_pools: {},
    cpu_pool_enabled: false,
    current_cpu_pool: 'LuckyPoolRANDOMX',
    cpu_pools: {},
  };
}

function getCoreConfig() {
  return {
    version_counter: 2,
    use_tor: false,
    allow_telemetry: false,
    node_type: 'Local',
    auto_update: false,
    pre_release: false,
    should_auto_launch: false,
    remote_base_node_address: 'http://127.0.0.1:18142',
  };
}

function getMiningConfig() {
  return {
    version_counter: 2,
    cpu_mining_enabled: true,
    gpu_mining_enabled: false,
    mine_on_app_start: false,
  };
}

function getWalletConfig() {
  return {
    version_counter: 2,
    tari_wallets: [TEST_WALLET.walletId],
    monero_address: '49aN3cwox5jCz9grdZmd5KTYggXrtVKRAdpr4wTba27HBxw4d29qfMj6rMNPNgAPhPgEyXEGWiNyZYLAKdPjn7CUPybeYYA',
    wxtm_addresses: {},
    monero_address_is_generated: true,
    keyring_accessed: false,
    wallet_migration_nonce: 1,
    external_tari_addresses_book: {},
    selected_external_tari_address: null,
    tari_wallet_details: {
      id: TEST_WALLET.walletId,
      tari_address: TEST_WALLET.address,
      wallet_birthday: 1532,
      spend_public_key_hex: TEST_WALLET.spendKeyHex,
      view_private_key_hex: TEST_WALLET.viewKeyHex,
    },
    pin_locker_state: {
      pin_locked: false,
      failed_pin_attempts: 0,
      last_failed_pin_attempt: null,
    },
    seed_backed_up: false,
    last_known_balance: 0,
    security_warning_dismissed: true,
  };
}

function preSeedConfig(configDir?: string): void {
  const targetDir = configDir ?? getConfigDir();
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`Pre-seeding config directory: ${targetDir}`);

  fs.writeFileSync(path.join(targetDir, 'config_pools.json'), JSON.stringify(getPoolsConfig()));
  fs.writeFileSync(path.join(targetDir, 'config_core.json'), JSON.stringify(getCoreConfig()));
  fs.writeFileSync(path.join(targetDir, 'config_mining.json'), JSON.stringify(getMiningConfig()));
  fs.writeFileSync(path.join(targetDir, 'config_wallet.json'), JSON.stringify(getWalletConfig()));
  console.log('Config files written: config_pools.json, config_core.json, config_mining.json, config_wallet.json');
}

/**
 * Mirrors the filename hashing used by file_credential_store.rs:
 *   SHA-256 of "{service}_{user}", first 16 bytes as hex -> "{hash}.bin"
 */
function credentialFilename(service: string, user: string): string {
  const combined = `${service}_${user}`;
  const hash = createHash('sha256').update(combined).digest('hex').slice(0, 32);
  return `${hash}.bin`;
}

function preSeedCredentials(): void {
  const credentialDir = path.join(getAppConfigDir(), 'credentials');
  fs.mkdirSync(credentialDir, { recursive: true });

  // The file-backed credential store hashes service+user to generate filenames.
  // service = APP_ID (the test profile identifier / APPLICATION_FOLDER_ID)
  // username = "inner_wallet_credentials_localnet_{walletId}"
  const service = APP_ID;
  const user = `inner_wallet_credentials_localnet_${TEST_WALLET.walletId}`;
  const filename = credentialFilename(service, user);
  const cborBytes = Buffer.from(TEST_WALLET.cborHex, 'hex');
  fs.writeFileSync(path.join(credentialDir, filename), cborBytes);
  console.log(`Credential file written: ${filename} (${cborBytes.length} bytes)`);
}

async function waitForPort(port: number, timeout: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`http://localhost:${port}`);
      if (res.ok || res.status < 500) return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`Port ${port} not available after ${timeout}ms`);
}

async function waitForWebSocket(port: number, timeout: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`http://localhost:${port}/remote_ui_info`);
      if (res.ok || res.status < 500) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`WebSocket on port ${port} not available after ${timeout}ms`);
}

export default async function globalSetup() {
  // Playwright does NOT run globalTeardown when globalSetup throws, so any
  // failure after spawning processes must clean them up here before rethrow.
  try {
    await runGlobalSetup();
  } catch (err) {
    const { default: globalTeardown } = await import('./global-teardown');
    await globalTeardown().catch(() => {});
    throw err;
  }
}

async function runGlobalSetup() {
  const projectRoot = path.resolve(__dirname, '../..');
  const skipBackend = !!process.env.SKIP_BACKEND;

  const network = process.env.TARI_NETWORK || 'localnet';
  if (network !== 'localnet') {
    throw new Error(
      `TEST_WALLET contains localnet-only keys. Refusing to run on TARI_NETWORK="${network}". ` +
        'Set TARI_NETWORK=localnet or unset it.'
    );
  }

  if (!skipBackend && !process.env.SKIP_BUILD) {
    console.log('Building Tauri app with test-mode feature (TARI_NETWORK=localnet)...');
    const buildEnv: Record<string, string> = {
      ...process.env as Record<string, string>,
      CARGO_TERM_COLOR: 'always',
      TARI_NETWORK: 'localnet',
    };
    // Using spawnSync with explicit args array to avoid shell injection
    const result = spawnSync(
      'cargo',
      [
        'tauri',
        'build',
        '--debug',
        '--no-bundle',
        '--features',
        'test-mode',
        '--config',
        'src-tauri/tauri.test.conf.json',
      ],
      {
        cwd: projectRoot,
        stdio: 'inherit',
        env: buildEnv,
      }
    );
    if (result.status !== 0) {
      throw new Error(`Build failed with exit code ${result.status}`);
    }
  }

  console.log('Starting Vite dev server for Playwright...');
  const viteProcess = spawn('pnpm', ['exec', 'vite', '--config', 'vite.config.playwright.ts'], {
    cwd: projectRoot,
    stdio: 'pipe',
    env: { ...process.env },
  });

  process.env.TEST_VITE_PID = String(viteProcess.pid);

  viteProcess.stdout?.on('data', (d: Buffer) => {
    const msg = d.toString();
    if (msg.includes('ready') || msg.includes('error') || msg.includes('Local')) {
      process.stdout.write(`[vite] ${msg}`);
    }
  });
  viteProcess.stderr?.on('data', (d: Buffer) => process.stderr.write(`[vite] ${d}`));

  viteProcess.on('error', (err) => {
    console.error(`Failed to start Vite: ${err.message}`);
  });

  console.log('Waiting for Vite dev server on port 1420...');
  await waitForPort(1420, 30_000);
  console.log('Vite dev server ready.');

  if (skipBackend) {
    console.log('SKIP_BACKEND set: assuming backend is already running.');
  } else {
    wipeTestData();
    preSeedConfig();
    preSeedCredentials();

    const binaryPath = process.env.TARI_UNIVERSE_BINARY || getBinaryPath(projectRoot);
    if (!fs.existsSync(binaryPath)) {
      throw new Error(
        `Binary not found at: ${binaryPath}\n` +
          'Run without SKIP_BUILD to build it, or set TARI_UNIVERSE_BINARY to the correct path.'
      );
    }

    console.log(`Launching Tauri backend: ${binaryPath} --headless`);
    // detached: own process group on POSIX, so teardown can kill the whole
    // tree (minotari_node, wallet, xmrig, ...) with one group signal even
    // if children reparented.
    const appProcess = spawn(binaryPath, ['--headless'], {
      stdio: 'pipe',
      detached: os.platform() !== 'win32',
      env: { ...process.env, RUST_LOG: 'info', TARI_NETWORK: 'localnet' },
    });

    process.env.TEST_APP_PID = String(appProcess.pid);

    appProcess.stdout?.on('data', (d: Buffer) => {
      process.stdout.write(`[tauri] ${d}`);
    });
    appProcess.stderr?.on('data', (d: Buffer) => process.stderr.write(`[tauri] ${d}`));

    await new Promise<void>((resolve, reject) => {
      appProcess.on('error', (err) => reject(new Error(`Failed to start Tauri: ${err.message}`)));
      setTimeout(resolve, 2000);
    });
  }

  console.log('Waiting for Tauri remote-ui WebSocket on port 9515...');
  await waitForWebSocket(9515, 120_000);
  console.log('Tauri backend ready. Playwright environment is up.');
}
