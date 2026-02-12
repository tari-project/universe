import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const isWin = os.platform() === 'win32';
const isMac = os.platform() === 'darwin';

const TARI_PROCESS_NAMES = ['minotari_node', 'minotari_wallet', 'mmproxy', 'xmrig'];
const CLEANUP_PORTS = [9515, 1420, 18142, 18143];

function tryExec(cmd: string): void {
  try {
    execSync(cmd, { stdio: 'pipe', timeout: 10_000 });
  } catch {
    // ignore – process may not exist or already exited
  }
}

function killPid(pid: number): void {
  try {
    if (isWin) {
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'pipe' });
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
      tryExec(`taskkill /F /IM ${name}.exe`);
    } else {
      tryExec(`pkill -f ${name}`);
    }
  }
}

function killPortOccupants(skipPorts: number[] = []): void {
  for (const port of CLEANUP_PORTS) {
    if (skipPorts.includes(port)) continue;
    if (isWin) {
      tryExec(
        `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port} ^| findstr LISTENING') do taskkill /F /PID %a`
      );
    } else {
      tryExec(`lsof -ti :${port} | xargs kill -9 2>/dev/null`);
    }
  }
}

function cleanDataDirectory(): void {
  let dataDir: string;
  if (isMac) {
    dataDir = path.join(os.homedir(), 'Library', 'Application Support', 'com.tari.universe.alpha');
  } else if (isWin) {
    dataDir = path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), 'AppData', 'Local'), 'com.tari.universe.alpha');
  } else {
    dataDir = path.join(os.homedir(), '.local', 'share', 'com.tari.universe.alpha');
  }

  if (fs.existsSync(dataDir)) {
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
}

export default async function globalTeardown() {
  killEnvPids();
  killOrphanedProcesses();
  killPortOccupants();

  if (process.env.E2E_CLEAN) {
    cleanDataDirectory();
  }
}
