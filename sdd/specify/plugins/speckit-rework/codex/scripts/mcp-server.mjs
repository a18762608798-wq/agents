// Dependency-free MCP stdio transport. Control logic lives in adapter.mjs.
import readline from 'node:readline';
import { readFileSync } from 'node:fs';
import { controlDescriptors, invokeControl } from './adapter.mjs';

function send(message) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', ...message }) + '\n');
}

async function dispatch(message) {
  if (!Object.hasOwn(message, 'id')) return; // initialized/cancelled notifications
  const { id, method, params = {} } = message;
  try {
    let result;
    if (method === 'initialize') {
      result = {
        protocolVersion: params.protocolVersion || '2025-11-25',
        capabilities: { tools: {} },
        serverInfo: { name: 'codex-speckit-rework', version: JSON.parse(readFileSync(new URL('../.codex-plugin/plugin.json', import.meta.url), 'utf8')).version },
        instructions: 'Spec Kit rework controls. Trust the speckit-rework plugin hooks in /hooks before use. Session binding is injected automatically; never invent the private token argument. Edits during rework must use apply_patch.',
      };
    } else if (method === 'ping') result = {};
    else if (method === 'tools/list') result = { tools: controlDescriptors() };
    else if (method === 'tools/call') {
      try { result = await invokeControl(params.name, params.arguments || {}); }
      catch (error) { result = { isError: true, content: [{ type: 'text', text: JSON.stringify({ ok: false, error: String(error.message || error) }) }] }; }
    } else if (method === 'resources/list') result = { resources: [] };
    else if (method === 'resources/templates/list') result = { resourceTemplates: [] };
    else if (method === 'prompts/list') result = { prompts: [] };
    else {
      send({ id, error: { code: -32601, message: 'Method not found: ' + method } });
      return;
    }
    send({ id, result });
  } catch (error) {
    send({ id, error: { code: -32603, message: String(error.message || error) } });
  }
}

let pending = Promise.resolve();
for await (const line of readline.createInterface({ input: process.stdin, crlfDelay: Infinity })) {
  if (!line.trim()) continue;
  let message;
  try { message = JSON.parse(line); }
  catch { send({ id: null, error: { code: -32700, message: 'Parse error' } }); continue; }
  // Serialize tools/call even before the cross-process state lock.
  pending = pending.then(() => dispatch(message));
  await pending;
}
