import { test, expect } from '../helpers/fixtures';
import { waitForMiningReady, clickStartMining, waitForMiningActive } from '../helpers/wait-for';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { getAppDataDir } from '../helpers/app-dirs';
import type { Page } from '@playwright/test';

/** The backend pid, from the file global-setup wrote (env as a fallback). */
function readAppPid(): number {
  try {
    const raw = fs.readFileSync(path.join(getAppDataDir(), 'test_app_pid'), 'utf-8').trim();
    const pid = Number(raw);
    if (pid > 0) return pid;
  } catch {
    // fall through to env
  }
  return Number(process.env.TEST_APP_PID);
}

/**
 * Shutdown — the LAST test in the suite. Exercises the QA "Closing/Quit
 * Miner" sweep: a graceful quit must stop every sidecar (minotari node +
 * merge-mining proxy, wallet, xmrig, tor, GPU miner), leaving nothing
 * orphaned. Because it quits the shared backend, nothing can run after it
 * (file name keeps it last; global teardown then finds nothing to do).
 *
 * Each sidecar runs under a `process-wrapper` that calls setpgid(0,0), so
 * the sidecars sit in their OWN process groups — the app's group only
 * holds the app and the wrappers. A process-group check would therefore
 * miss an orphaned miner. So instead we snapshot the app's whole descendant
 * tree (wrappers AND the real sidecars) while it's intact, then assert
 * every one of those exact processes is gone after the quit. Keying on the
 * recorded (pid, comm) pair also guards against PID reuse.
 */

interface Proc {
  pid: number;
  ppid: number;
  comm: string;
}

function snapshotProcs(): Proc[] {
  const out = execFileSync('ps', ['-o', 'pid=,ppid=,comm=', '-ax'], {
    encoding: 'utf-8',
    maxBuffer: 8 * 1024 * 1024,
  });
  const procs: Proc[] = [];
  for (const line of out.split('\n')) {
    const m = line.trim().match(/^(\d+)\s+(\d+)\s+(.*)$/);
    if (!m) continue;
    procs.push({ pid: Number(m[1]), ppid: Number(m[2]), comm: m[3] });
  }
  return procs;
}

/** All descendants of `rootPid` (children, grandchildren, ...) as pid→comm. */
function descendantsOf(rootPid: number): Map<number, string> {
  const procs = snapshotProcs();
  const childrenByParent = new Map<number, Proc[]>();
  for (const p of procs) {
    const arr = childrenByParent.get(p.ppid) ?? [];
    arr.push(p);
    childrenByParent.set(p.ppid, arr);
  }
  const found = new Map<number, string>();
  const queue = [rootPid];
  while (queue.length) {
    const pid = queue.shift()!;
    for (const child of childrenByParent.get(pid) ?? []) {
      if (found.has(child.pid)) continue;
      found.set(child.pid, child.comm);
      queue.push(child.pid);
    }
  }
  return found;
}

/** Current comm for a pid, or null if it is no longer running. */
function commOf(pid: number): string | null {
  try {
    const out = execFileSync('ps', ['-o', 'comm=', '-p', String(pid)], { encoding: 'utf-8' }).trim();
    return out || null;
  } catch {
    return null;
  }
}

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** Fire the app's graceful-quit command; the app exits mid-call, so the
 *  invoke never resolves — dispatch it without awaiting a response. */
async function quitApp(page: Page) {
  await page
    .evaluate(() => {
      const fn = (window as unknown as { __PLAYWRIGHT_INVOKE__?: (c: string) => Promise<unknown> })
        .__PLAYWRIGHT_INVOKE__;
      // Deliberately not awaited: exit_application calls app.exit(0).
      fn?.('exit_application');
    })
    .catch(() => {});
}

test.describe('Shutdown', () => {
  test('graceful quit stops the app and every sidecar', async ({ appPage: page }) => {
    test.skip(process.platform === 'win32', 'descendant reaping check is POSIX-only');
    test.setTimeout(300_000);

    const appPid = readAppPid();
    expect(appPid, 'app pid is recorded by global-setup').toBeGreaterThan(0);

    // --- Bring the sidecars up: mining guarantees xmrig alongside the
    //     node, proxy and wallet. ---
    await waitForMiningReady(page, 120_000);
    await clickStartMining(page);
    await waitForMiningActive(page, 120_000);

    // Snapshot the full tree while it is intact. Precondition: the app has
    // actually spawned sidecars (otherwise the test proves nothing).
    const tree = descendantsOf(appPid);
    expect(tree.size, `descendants of the app: ${[...tree.values()].join(', ')}`).toBeGreaterThan(0);

    // --- Graceful quit (the app's own shutdown path) ---
    await quitApp(page);

    // --- The app and every recorded descendant must exit ---
    const deadline = Date.now() + 120_000;
    let appGone = false;
    let leaks: string[] = [];
    while (Date.now() < deadline) {
      appGone = !isAlive(appPid);
      // A recorded pid leaks only if it is still alive AND still the same
      // process (its comm is unchanged) — this ignores PID reuse.
      leaks = [];
      for (const [pid, comm] of tree) {
        if (isAlive(pid) && commOf(pid) === comm) leaks.push(`${comm}(${pid})`);
      }
      if (appGone && leaks.length === 0) break;
      await new Promise((r) => setTimeout(r, 2_000));
    }

    expect(appGone, 'app process exited after graceful quit').toBe(true);
    expect(leaks.length, `orphaned processes after quit: ${leaks.join(', ')}`).toBe(0);
  });
});
