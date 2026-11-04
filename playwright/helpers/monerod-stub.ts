import http from 'http';
import fs from 'fs';
import path from 'path';
import type { AddressInfo } from 'net';
import { fileURLToPath } from 'url';

/**
 * In-process monerod stand-in for the localnet merge-mining proxy, so the
 * suite needs no outbound Monero access. It serves one real block template
 * captured from mainnet (fixtures/monero-block-template.json). That works
 * because localnet Tari difficulty is 1 and max_randomx_seed_height is
 * u64::MAX: the proxy mines at min(monero, tari) difficulty, so the fixed
 * template and seed_hash keep producing valid Tari blocks for the whole run.
 */

const fixturePath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'monero-block-template.json');
const template = JSON.parse(fs.readFileSync(fixturePath, 'utf8')).result as { height: number; prev_hash: string };
const height = template.height;

const RESULTS: Record<string, unknown> = {
  get_block_template: template,
  // Monero RPC version 3.14 encoded as (major << 16) | minor.
  get_version: { version: (3 << 16) | 14, release: true, status: 'OK', untrusted: false },
  get_info: {
    height,
    target_height: height,
    top_block_hash: template.prev_hash,
    nettype: 'mainnet',
    synchronized: true,
    status: 'OK',
    untrusted: false,
  },
  get_height: { height, hash: template.prev_hash, status: 'OK', untrusted: false },
  get_block_count: { count: height, status: 'OK', untrusted: false },
  submit_block: { status: 'OK' },
};
// monerod also accepts the legacy names; xmrig's daemon mode asks for getblocktemplate.
RESULTS.getblocktemplate = RESULTS.get_block_template;
RESULTS.submitblock = RESULTS.submit_block;
RESULTS.getblockcount = RESULTS.get_block_count;

// Playwright runs globalSetup and globalTeardown in the same runner process,
// but the static and dynamic imports can load separate module instances, so
// the handle lives on globalThis rather than in module scope.
const KEY = Symbol.for('tari.playwright.monerodStub');
const state = globalThis as unknown as Record<symbol, http.Server | undefined>;

// Always send Content-Length, as monerod does. Without it Node falls back to
// Transfer-Encoding: chunked, which the proxy copies onto its own response next
// to a Content-Length it adds; that malformed reply is dropped (empty reply), so
// the proxy never passes its health check.
function send(res: http.ServerResponse, status: number, body: unknown): void {
  const payload = Buffer.from(JSON.stringify(body));
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': payload.length });
  res.end(payload);
}

function handleJsonRpc(raw: string, res: http.ServerResponse): void {
  let req: { id?: unknown; method?: unknown };
  try {
    req = JSON.parse(raw);
  } catch {
    send(res, 200, { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
    return;
  }
  const id = req.id ?? null;
  const method = String(req.method);
  if (Object.hasOwn(RESULTS, method)) {
    send(res, 200, { jsonrpc: '2.0', id, result: RESULTS[method] });
    return;
  }
  console.warn(`[monerod-stub] unknown JSON-RPC method: ${method}`);
  send(res, 200, { jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } });
}

function handle(req: http.IncomingMessage, res: http.ServerResponse): void {
  const chunks: Buffer[] = [];
  req.on('data', (c: Buffer) => chunks.push(c));
  req.on('end', () => {
    const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
    if (pathname === '/json_rpc') {
      // The proxy's availability probe is a bodyless GET; any response counts.
      if (req.method === 'POST') handleJsonRpc(Buffer.concat(chunks).toString('utf8'), res);
      else send(res, 200, { status: 'OK' });
    } else if (pathname === '/getheight' || pathname === '/get_height') {
      send(res, 200, { height, status: 'OK' });
    } else {
      send(res, 404, { error: 'not found' });
    }
  });
}

/** Start the stub on 127.0.0.1 with an OS-assigned port; resolves to its base URL. */
export function startMonerodStub(): Promise<string> {
  const existing = state[KEY];
  if (existing?.listening) return Promise.resolve(`http://127.0.0.1:${(existing.address() as AddressInfo).port}`);

  const server = http.createServer(handle);
  // Track it before listening so stopMonerodStub can close it even if start times out.
  state[KEY] = server;
  return new Promise((resolve, reject) => {
    // Global setup surfaces these errors as-is, so the prefix lives here.
    const timeout = new Error('monerod stub failed to start: not listening after 5000ms');
    const timer = setTimeout(() => reject(timeout), 5_000);
    server.once('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`monerod stub failed to start: ${err.message}`, { cause: err }));
    });
    server.listen(0, '127.0.0.1', () => {
      clearTimeout(timer);
      resolve(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
    });
  });
}

/** Close the stub and its keep-alive connections. No-op if it isn't running. */
export async function stopMonerodStub(): Promise<void> {
  const server = state[KEY];
  if (!server) return;
  delete state[KEY];
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
}
