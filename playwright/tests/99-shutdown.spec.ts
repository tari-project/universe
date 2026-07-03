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
 * merge-mining proxy, wallet, xmrig, tor, GPU miner), not leave them
 * orphaned. Because this kills the shared backend, nothing can run after
 * it (file name keeps it last; global teardown then finds nothing to do).
 *
 * The app is spawned detached in global-setup, so it leads its own process
 * group and every sidecar inherits that pgid (this is exactly what lets
 * teardown reap the whole tree with one group-signal). So "did the quit
 * clean up?" = "is the app's process group empty afterwards?" — a
 * name-agnostic check that survives child reparenting.
 */

interface Proc {
  pid: number;
  pgid: number;
  comm: string;
}

/** Processes currently in the given process group (POSIX). */
function groupMembers(pgid: number): Proc[] {
  const out = execFileSync('ps', ['-o', 'pid=,pgid=,comm=', '-ax'], {
    encoding: 'utf-8',
    maxBuffer: 8 * 1024 * 1024,
  });
  const procs: Proc[] = [];
  for (const line of out.split('\n')) {
    const m = line.trim().match(/^(\d+)\s+(\d+)\s+(.*)$/);
    if (!m) continue;
    const p = { pid: Number(m[1]), pgid: Number(m[2]), comm: m[3] };
    if (p.pgid === pgid) procs.push(p);
  }
  return procs;
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
 *  invoke never resolves — don't await a response, just dispatch it. */
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
    test.skip(process.platform === 'win32', 'process-group reaping is POSIX-only');
    test.setTimeout(300_000);

    const appPid = readAppPid();
    expect(appPid, 'app pid is recorded by global-setup').toBeGreaterThan(0);
    // Detached spawn makes the app its own group leader: pgid == its pid.
    const pgid = appPid;

    // --- Bring the sidecars up: mining guarantees xmrig alongside the
    //     node, proxy and wallet. ---
    await waitForMiningReady(page, 120_000);
    await clickStartMining(page);
    await waitForMiningActive(page, 120_000);

    // Precondition: the app has spawned sidecars in its group. If this is
    // empty the test proves nothing, so assert real children exist first.
    const before = groupMembers(pgid).filter((p) => p.pid !== appPid);
    expect(before.length, `sidecars in the app group: ${before.map((p) => p.comm).join(', ')}`).toBeGreaterThan(0);

    // --- Graceful quit (the app's own shutdown path) ---
    await quitApp(page);

    // --- The app process and every sidecar must be gone ---
    const deadline = Date.now() + 120_000;
    let lingering: Proc[] = [];
    let appGone = false;
    while (Date.now() < deadline) {
      appGone = !isAlive(appPid);
      lingering = groupMembers(pgid).filter((p) => p.pid !== appPid);
      if (appGone && lingering.length === 0) break;
      await new Promise((r) => setTimeout(r, 2_000));
    }

    expect(appGone, 'app process exited after graceful quit').toBe(true);
    expect(
      lingering.length,
      `orphaned sidecars after quit: ${lingering.map((p) => `${p.comm}(${p.pid})`).join(', ')}`
    ).toBe(0);
  });
});
