// test_mcp.mjs — prueba MCPVault sobre stdio
import { spawn } from "node:child_process"
const vaultPath = process.argv[2] || "."
const child = spawn("cmd", ["/c", "npx", "-y", "@bitbonsai/mcpvault@latest", vaultPath, "--read-only"],
  { stdio: ["pipe", "pipe", "inherit"] })
let buf = ""
const pending = new Map()
let id = 0
child.stdout.on("data", (d) => {
  buf += d.toString()
  let i
  while ((i = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1)
    if (!line) continue
    let m; try { m = JSON.parse(line) } catch { continue }
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) }
  }
})
function call(method, params = {}) {
  const reqId = ++id
  return new Promise((res) => { pending.set(reqId, res)
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: reqId, method, params }) + "\n") })
}
async function main() {
  await call("initialize", { protocolVersion: "2024-11-05", capabilities: {},
    clientInfo: { name: "test", version: "1.0.0" } })
  await call("notifications/initialized", {})
  const tools = await call("tools/list", {})
  console.log("Herramientas:", (tools.result?.tools || []).map((t) => t.name).join(", "))
  const stats = await call("tools/call", { name: "get_vault_stats", arguments: { recentCount: 3 } })
  console.log("Stats:", JSON.stringify(stats.result))
  child.kill(); process.exit(0)
}
setTimeout(() => { child.kill(); process.exit(1) }, 120000)
main()