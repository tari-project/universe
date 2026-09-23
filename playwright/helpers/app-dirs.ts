import path from 'path';
import os from 'os';

// Dedicated test identifier — must match APPLICATION_FOLDER_ID under the
// test-mode feature and the identifier in src-tauri/tauri.test.conf.json.
// Never a real user profile, so it is safe to wipe between runs.
export const APP_ID = 'com.tari.universe.test';

export function getAppConfigDir(): string {
  switch (os.platform()) {
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Application Support', APP_ID);
    case 'win32':
      return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), APP_ID);
    default:
      return path.join(os.homedir(), '.config', APP_ID);
  }
}

/** Where the app writes runtime data (pid files, node/wallet DBs, logs). */
export function getAppDataDir(): string {
  switch (os.platform()) {
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Application Support', APP_ID);
    case 'win32':
      return path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), APP_ID);
    default:
      return path.join(os.homedir(), '.local', 'share', APP_ID);
  }
}

/** All per-identifier data roots the app writes to (config, data, cache, logs). */
export function getAppDataRoots(): string[] {
  const home = os.homedir();
  switch (os.platform()) {
    case 'darwin':
      return [
        path.join(home, 'Library', 'Application Support', APP_ID),
        path.join(home, 'Library', 'Caches', APP_ID),
        path.join(home, 'Library', 'Logs', APP_ID),
      ];
    case 'win32': {
      const roaming = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
      const local = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
      return [path.join(roaming, APP_ID), path.join(local, APP_ID)];
    }
    default:
      return [
        path.join(home, '.config', APP_ID),
        path.join(home, '.local', 'share', APP_ID),
        path.join(home, '.cache', APP_ID),
      ];
  }
}

/** The app's cache dir, where downloaded sidecar binaries live. */
export function getAppCacheDir(): string {
  const home = os.homedir();
  switch (os.platform()) {
    case 'darwin':
      return path.join(home, 'Library', 'Caches', APP_ID);
    case 'win32':
      return path.join(process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local'), APP_ID);
    default:
      return path.join(home, '.cache', APP_ID);
  }
}
