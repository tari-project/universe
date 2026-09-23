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

/**
 * Kill the app and everything it spawned (minotari_node, wallet, xmrig, ...).
 * The app is spawned detached (own process group) on POSIX, so signalling
 * the group (-pid) reaches children even after they reparent. Windows uses
 * taskkill /T for the tree.
 */
function killAppTree(pid: number): void {
  if (isWin) {
    try {
      spawnSync('taskkill', ['/F', '/T', '/PID', String(pid)], { stdio: 'pipe' });
    } catch {
      // ignore
    }
    return;
  }
  try {
    process.kill(-pid, 'SIGTERM');
  } catch {
    // group gone (or app was not spawned detached) — try the pid directly
    killPid(pid);
  }
  // Give the group a moment to exit gracefully, then force-kill leftovers.
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      process.kill(-pid, 0); // probe: throws once the group is gone
    } catch {
      return;
    }
    spawnSync('sleep', ['0.5']);
  }
  try {
    process.kill(-pid, 'SIGKILL');
  } catch {
    // gone
  }
}

export default async function globalTeardown() {
  const appPid = process.env.TEST_APP_PID;
  if (appPid) {
    killAppTree(Number(appPid));
  }
  const vitePid = process.env.TEST_VITE_PID;
  if (vitePid) {
    killPid(Number(vitePid));
  }
}
