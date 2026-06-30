import { spawnSync } from 'child_process';
import os from 'os';

const isWin = os.platform() === 'win32';

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

function killTrackedPids(): void {
  for (const envKey of ['TEST_APP_PID', 'TEST_VITE_PID']) {
    const pid = process.env[envKey];
    if (pid) {
      killPid(Number(pid));
    }
  }
}

function killChildProcessTree(pid: number): void {
  if (isWin) {
    // /T flag kills the process tree
    try {
      spawnSync('taskkill', ['/F', '/T', '/PID', String(pid)], { stdio: 'pipe' });
    } catch {
      // ignore
    }
  } else {
    // Find and kill child processes using the parent PID
    try {
      const result = spawnSync('pgrep', ['-P', String(pid)], { stdio: 'pipe' });
      const childPids = result.stdout?.toString().trim().split('\n').filter(Boolean);
      for (const childPid of childPids) {
        killChildProcessTree(Number(childPid));
      }
      process.kill(pid, 'SIGTERM');
    } catch {
      // already exited
    }
  }
}

export default async function globalTeardown() {
  const appPid = process.env.TEST_APP_PID;
  if (appPid) {
    // Kill the app and its child processes (minotari_node, wallet, etc.)
    killChildProcessTree(Number(appPid));
  }
  killTrackedPids();
}
