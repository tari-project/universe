/**
 * Minimal MCP streamable-HTTP client for exercising the in-app MCP server
 * the way a real agent would: raw HTTP against http://127.0.0.1:<port>/mcp
 * with a bearer token. This runs in the TEST PROCESS (node), not the page —
 * the whole point of the MCP feature is an external client, so this is the
 * user-realistic path, not a backend shortcut.
 *
 * The server (rmcp StreamableHttpService) answers POSTs either as JSON or
 * as an SSE stream carrying JSON-RPC messages. Responses are read
 * incrementally and resolve on the message matching the request id, so a
 * long-lived stream (e.g. while a send awaits in-app approval) cannot hang
 * the reader past its answer.
 */

export interface ToolResult {
  isError: boolean;
  text: string;
}

/**
 * Poll until the MCP server is actually accepting connections on `port`.
 * The in-app UI status text ("running on port N") flips when the config
 * updates, which can lead the real socket by a beat — on a loaded runner
 * that gap is enough for an immediate client call to hit ECONNREFUSED. Any
 * HTTP response (even a 401) means the listener is up; only a
 * connection-level error keeps us waiting.
 */
export async function waitForMcpUp(port: number, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fetch(`http://127.0.0.1:${port}/mcp`, { method: 'POST' });
      return; // connected — the socket is listening
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`MCP server did not start listening on port ${port} within ${timeoutMs}ms`);
}

/** Poll until the MCP server on `port` stops accepting connections. */
export async function waitForMcpDown(port: number, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fetch(`http://127.0.0.1:${port}/mcp`, { method: 'POST' });
      await new Promise((r) => setTimeout(r, 500)); // still up
    } catch {
      return; // connection refused — the listener is gone
    }
  }
  throw new Error(`MCP server still listening on port ${port} after ${timeoutMs}ms`);
}

export class McpClient {
  private sessionId: string | null = null;
  private nextId = 1;

  constructor(
    private baseUrl: string,
    private token?: string
  ) {}

  private headers(): Record<string, string> {
    const h: Record<string, string> = {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
    };
    if (this.token) h.authorization = `Bearer ${this.token}`;
    if (this.sessionId) h['mcp-session-id'] = this.sessionId;
    return h;
  }

  /** Raw POST — exposed so tests can assert auth failures (401s). */
  async rawPost(body: unknown): Promise<Response> {
    return fetch(`${this.baseUrl}/mcp`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
  }

  /** Read an SSE body incrementally until the message with `id` arrives. */
  private async readSseUntil(res: Response, id: number, timeoutMs: number): Promise<unknown> {
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const deadline = Date.now() + timeoutMs;
    try {
      for (;;) {
        if (Date.now() > deadline) throw new Error(`SSE response for id ${id} timed out after ${timeoutMs}ms`);
        const { done, value } = await reader.read();
        if (value) buffer += decoder.decode(value, { stream: true });
        // Process only COMPLETE lines this pass; keep the trailing partial
        // line in `buffer` for the next chunk. Re-splitting the whole
        // accumulated buffer every read (without consuming it) would be
        // O(N^2) and re-parse already-seen events.
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          let msg: { id?: number; error?: unknown; result?: unknown };
          try {
            msg = JSON.parse(trimmed.slice(5).trim());
          } catch {
            continue; // malformed event line — skip it
          }
          if (msg.id === id) {
            if (msg.error) throw new Error(`MCP error: ${JSON.stringify(msg.error)}`);
            return msg.result;
          }
        }
        if (done) throw new Error(`SSE stream ended without a response for id ${id}`);
      }
    } finally {
      reader.cancel().catch(() => {});
    }
  }

  private async rpc(method: string, params?: unknown, timeoutMs = 30_000): Promise<unknown> {
    const id = this.nextId++;
    const res = await this.rawPost({ jsonrpc: '2.0', id, method, params });
    if (!res.ok) {
      throw new Error(`MCP ${method} failed: HTTP ${res.status}`);
    }
    const sid = res.headers.get('mcp-session-id');
    if (sid) this.sessionId = sid;

    const ctype = res.headers.get('content-type') ?? '';
    if (ctype.includes('text/event-stream')) {
      return this.readSseUntil(res, id, timeoutMs);
    }
    const json = (await res.json()) as { error?: unknown; result?: unknown };
    if (json?.error) throw new Error(`MCP error: ${JSON.stringify(json.error)}`);
    return json?.result;
  }

  async initialize(): Promise<void> {
    await this.rpc('initialize', {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: { name: 'playwright-suite', version: '1.0.0' },
    });
    // Fire-and-forget per spec: notifications get 202 Accepted, no body.
    await fetch(`${this.baseUrl}/mcp`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
    });
  }

  async listTools(): Promise<string[]> {
    const result = (await this.rpc('tools/list')) as { tools?: { name: string }[] };
    return (result.tools ?? []).map((t) => t.name);
  }

  /**
   * Call a tool. Handler errors (e.g. "Read tier is disabled") surface as
   * isError=true with the message in `text` — they are tool results, not
   * transport failures.
   */
  async callTool(name: string, args: Record<string, unknown> = {}, timeoutMs = 30_000): Promise<ToolResult> {
    const result = (await this.rpc('tools/call', { name, arguments: args }, timeoutMs)) as {
      isError?: boolean;
      content?: { text?: string }[];
    };
    const text = (result.content ?? [])
      .map((c) => c.text ?? '')
      .filter(Boolean)
      .join('\n');
    return { isError: !!result.isError, text };
  }
}
