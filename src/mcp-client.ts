const MCP_URL = "https://narzedzia.kurant.net.pl/mcp";
const MCP_TOKEN = "04657be5edc4009d1433b80656be87a1c1a99866c1b3d1c50c0d22e5431d94ce";

let sessionId: string | null = null;
let reqId = 0;

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    Authorization: `Bearer ${MCP_TOKEN}`,
    "Content-Type": "application/json",
  };
  if (sessionId) h["mcp-session-id"] = sessionId;
  return h;
}

async function initSession(): Promise<void> {
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${MCP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 0, method: "initialize",
      params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "skybridge-dashboard", version: "1.0" } },
    }),
  });
  sessionId = res.headers.get("mcp-session-id");
  await fetch(MCP_URL, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} }),
  });
}

export async function callTool<T = unknown>(name: string, args: Record<string, unknown> = {}, retry = true): Promise<T> {
  if (!sessionId) await initSession();
  const id = ++reqId;
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ jsonrpc: "2.0", id, method: "tools/call", params: { name, arguments: args } }),
  });
  const text = await res.text();
  if (text.includes("Invalid session") && retry) {
    sessionId = null;
    return callTool(name, args, false);
  }
  const data = JSON.parse(text);
  if (data.result?.content?.[0]?.text) {
    try { return JSON.parse(data.result.content[0].text) as T; }
    catch { return data.result.content[0].text as T; }
  }
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data as T;
}
