import { spawn, spawnSync } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath } from 'url';

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

function preSeedConfig(configDir?: string): void {
  const targetDir = configDir ?? getConfigDir();
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`Pre-seeding config directory: ${targetDir}`);

  fs.writeFileSync(path.join(targetDir, 'config_pools.json'), JSON.stringify(getPoolsConfig()));
  fs.writeFileSync(path.join(targetDir, 'config_core.json'), JSON.stringify(getCoreConfig()));
  fs.writeFileSync(path.join(targetDir, 'config_mining.json'), JSON.stringify(getMiningConfig()));
  console.log('Config files written: config_pools.json, config_core.json, config_mining.json');
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
  const skipBackend = !!process.env.SKIP_BACKEND;

  if (!skipBackend && !process.env.SKIP_BUILD) {
    console.log('Building Tauri app with test-mode feature (TARI_NETWORK=localnet)...');
    const buildEnv: Record<string, string> = {
      ...process.env as Record<string, string>,
      CARGO_TERM_COLOR: 'always',
      TARI_NETWORK: 'localnet',
    };
    // Using spawnSync with explicit args array to avoid shell injection
    const result = spawnSync('cargo', ['tauri', 'build', '--debug', '--no-bundle', '--features', 'test-mode'], {
      cwd: projectRoot,
      stdio: 'inherit',
      env: buildEnv,
    });
    if (result.status !== 0) {
      throw new Error(`Build failed with exit code ${result.status}`);
    }
  }

  console.log('Starting Vite dev server for Playwright...');
  const viteProcess = spawn('npx', ['vite', '--config', 'vite.config.playwright.ts'], {
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
    preSeedConfig();

    const binaryPath = process.env.TARI_UNIVERSE_BINARY || getBinaryPath(projectRoot);
    if (!fs.existsSync(binaryPath)) {
      throw new Error(
        `Binary not found at: ${binaryPath}\n` +
          'Run without SKIP_BUILD to build it, or set TARI_UNIVERSE_BINARY to the correct path.'
      );
    }

    console.log(`Launching Tauri backend: ${binaryPath} --headless`);
    const appProcess = spawn(binaryPath, ['--headless'], {
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
  console.log('Tauri backend ready. Playwright environment is up.');
}
