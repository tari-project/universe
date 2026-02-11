import { spawn, execSync } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getBinaryPath(projectRoot: string): string {
  const debugDir = path.join(projectRoot, 'src-tauri', 'target', 'debug');

  const candidates: string[] = [];
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
      break;
  }

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0];
}

function getConfigDir(): string {
  const appId = 'com.tari.universe.alpha';
  switch (os.platform()) {
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Application Support', appId, 'app_configs', 'localnet');
    case 'win32':
      return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), appId, 'app_configs', 'localnet');
    default:
      return path.join(os.homedir(), '.config', appId, 'app_configs', 'localnet');
  }
}

function getDataDir(): string {
  const appId = 'com.tari.universe.alpha';
  switch (os.platform()) {
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Application Support', appId);
    case 'win32':
      return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), appId);
    default:
      return path.join(os.homedir(), '.config', appId);
  }
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
  };
}

function preSeedConfig(configDir?: string): void {
  const targetDir = configDir ?? getConfigDir();
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`Pre-seeding config directory: ${targetDir}`);

  fs.writeFileSync(path.join(targetDir, 'config_pools.json'), JSON.stringify(getPoolsConfig()));
  fs.writeFileSync(path.join(targetDir, 'config_core.json'), JSON.stringify(getCoreConfig()));
  fs.writeFileSync(path.join(targetDir, 'config_mining.json'), JSON.stringify(getMiningConfig()));
  console.log('Config files written: config_pools.json, config_core.json, config_mining.json');
}

function cleanDataDirectory(): void {
  const dataDir = getDataDir();
  if (fs.existsSync(dataDir)) {
    console.log(`E2E_CLEAN set — removing data directory: ${dataDir}`);
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
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
  const projectRoot = path.resolve(__dirname, '../..');
  const skipBackend = !!process.env.E2E_SKIP_BACKEND;

  if (process.env.E2E_CLEAN) {
    cleanDataDirectory();
  }

  if (!skipBackend && !process.env.SKIP_BUILD) {
    console.log('Building Tauri app with test-mode feature (TARI_NETWORK=localnet)...');
    const buildEnv: Record<string, string> = {
      ...process.env as Record<string, string>,
      CARGO_TERM_COLOR: 'always',
      TARI_NETWORK: 'localnet',
    };
    const placeholders: Record<string, string> = {
      AIRDROP_BASE_URL: 'http://localhost:0',
      AIRDROP_API_BASE_URL: 'http://localhost:0',
      AIRDROP_WEBSOCKET_CRYPTO_KEY: 'e2e-placeholder-key',
      TELEMETRY_API_URL: 'http://localhost:0',
      EXCHANGE_ID: 'tari',
      BRIDGE_BACKEND_API_URL: 'http://localhost:0',
      BRIDGE_WALLET_CONNECT_PROJECT_ID: 'e2e-placeholder',
    };
    for (const [key, val] of Object.entries(placeholders)) {
      if (!buildEnv[key]) buildEnv[key] = val;
    }
    execSync('cargo tauri build --debug --no-bundle --features test-mode', {
      cwd: projectRoot,
      stdio: 'inherit',
      env: buildEnv,
    });
  }

  console.log('Starting Vite E2E dev server...');
  const viteProcess = spawn('npx', ['vite', '--config', 'vite.config.e2e.ts'], {
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

  const e2eFlag = process.env.E2E_MODE === 'mock' ? '--e2e-mock' : '--e2e';

  if (skipBackend) {
    console.log('E2E_SKIP_BACKEND set: assuming backend is already running.');
  } else {
    preSeedConfig();

    const binaryPath = process.env.TARI_UNIVERSE_BINARY || getBinaryPath(projectRoot);
    if (!fs.existsSync(binaryPath)) {
      throw new Error(
        `Binary not found at: ${binaryPath}\n` +
          'Run without SKIP_BUILD to build it, or set TARI_UNIVERSE_BINARY to the correct path.'
      );
    }

    console.log(`Launching Tauri backend: ${binaryPath} ${e2eFlag}`);
    const appProcess = spawn(binaryPath, [e2eFlag], {
      stdio: 'pipe',
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
  console.log('Tauri backend ready. E2E environment is up.');
}
