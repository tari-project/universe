import { spawnSync } from 'child_process';
import os from 'os';

const isWin = os.platform() === 'win32';

const TARI_PROCESS_NAMES = ['minotari_node', 'minotari_wallet', 'mmproxy', 'xmrig'];

function trySpawn(cmd: string, args: string[]): void {
  try {
    spawnSync(cmd, args, { stdio: 'pipe', timeout: 10_000 });
  } catch {
    // ignore – process may not exist or already exited
  }
}

function killPid(pid: number): void {
  try {
    if (isWin) {
      spawnSync('taskkill', ['/F', '/PID', String(pid)], { stdio: 'pipe' });
    } else {
      process.kill(pid, 'SIGTERM');
    }
  } catch {
    // already exited
  }
}

function killEnvPids(): void {
  for (const envKey of ['TEST_APP_PID', 'TEST_VITE_PID']) {
    const pid = process.env[envKey];
    if (pid) {
      killPid(Number(pid));
    }
  }
}

function killOrphanedProcesses(): void {
  for (const name of TARI_PROCESS_NAMES) {
    if (isWin) {
      trySpawn('taskkill', ['/F', '/IM', `${name}.exe`]);
    } else {
      trySpawn('pkill', ['-f', name]);
    }
  }
}

export default async function globalTeardown() {
  killEnvPids();
  killOrphanedProcesses();
}
