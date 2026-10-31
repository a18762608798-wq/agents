import { lstatSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { core, handlers, tools } from './engine.mjs';
import { argsHash, digest, withState } from './state.mjs';

// This Codex release retains the bundled server name in the canonical hook name.
export const CONTROL_PREFIX = 'mcp__speckit_rework__';
export const TOKEN_FIELD = '_codex_gate_token';
const PHASES = new Set(['needs-feature', 'impact-pending', 'spec-pending', 'plan-pending', 'tasks-pending', 'checklists-pending', 'implementation-open', 'closed', 'blocked']);
const READ_ONLY_LOCAL = new Set(['update_plan', 'view_image', 'request_user_input']);
const READ_ONLY_MCP = new Set([
  'mcp__context7__resolve_library_id', 'mcp__context7__resolve-library-id',
  'mcp__context7__query_docs', 'mcp__context7__query-docs',
  'mcp__zotero__zotero_semantic_search', 'mcp__zotero__zotero_search_items',
  'mcp__zotero__zotero_search_collections', 'mcp__zotero__zotero_get_item_metadata',
  'mcp__zotero__zotero_get_item_fulltext', 'mcp__zotero__zotero_get_item_children',
  'mcp__zotero__zotero_get_search_database_status',
]);

function projectRoot(cwd) {
  let dir = path.resolve(cwd);
  for (let depth = 0; depth < 64; depth++) {
    const root = core.findProjectRoot(dir);
    if (root) return realpathSync(root);
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function sessionEntry(state, event, root) {
  if (typeof event.session_id !== 'string' || !event.session_id || event.session_id.length > 200) {
    throw new Error('Missing or invalid Codex session_id');
  }
  const key = digest(`${event.session_id}\0${root}`);
  if (!Object.hasOwn(state.sessions, key)) {
    state.sessions[key] = { sessionId: event.session_id, root, txn: null, officialBypass: false };
  }
  const entry = state.sessions[key];
  if (!entry || entry.sessionId !== event.session_id || entry.root !== root) throw new Error('Session state identity mismatch');
  entry.updated = Date.now();
  return { key, entry };
}

function engineContext(entry) {
  return {
    cwd: entry.root,
    hasUI: false,
    sessionManager: {
      getSessionFile: () => undefined,
      getSessionId: () => entry.sessionId + ':' + digest(entry.root),
    },
  };
}

function hydrate(entry) {
  const ctx = engineContext(entry);
  const key = core.sessionKey(ctx);
  const old = core.getActiveTxn(key);
  if (old) core.deleteTxn(old);
  if (entry.txn) {
    const t = entry.txn;
    if (t.root !== entry.root || !PHASES.has(t.phase) || !Array.isArray(t.scope)
        || !t.scope.every(x => typeof x === 'string') || typeof t.featureDir !== 'string'
        || !Array.isArray(t.affectedStages) || !t.snapshots || !t.summaries) {
      throw new Error('Invalid persisted transaction; refusing writes');
    }
    core.touchTxn(key, structuredClone(t));
  }
  return ctx;
}

function save(entry, ctx) {
  entry.txn = structuredClone(core.getActiveTxn(core.sessionKey(ctx)) || null);
}

function contextOutput(eventName, text) {
  return text ? { hookSpecificOutput: { hookEventName: eventName, additionalContext: text } } : {};
}

export function deny(reason) {
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: '[speckit-rework] ' + reason,
    },
  };
}

async function stateContext(entry, ctx) {
  const e = { systemPromptOptions: { sections: {} } };
  await handlers.get('before_agent_start')(e, ctx);
  const context = e.systemPromptOptions.sections['speckit-rework-gate'] || '';
  return context && context + '\nCodex adapter: use the seven MCP speckit_rework_* controls. Their session token is injected by the trusted PreToolUse hook; never supply it yourself. During an active transaction, edits must use apply_patch; shell file writes, interactive execution, delegation, and unknown local/MCP tools are denied. Known read-only queries remain available. These hooks are guardrails, not an OS sandbox.';
}

export function patchPaths(command) {
  if (typeof command !== 'string' || command.includes('\0')) throw new Error('Missing or invalid apply_patch command');
  const lines = command.trim().split(/\r?\n/);
  if (lines[0] !== '*** Begin Patch' || lines.at(-1) !== '*** End Patch') throw new Error('Unrecognized patch framing');
  const paths = [];
  for (const line of lines.slice(1, -1)) {
    const match = /^\*\*\* (Add File|Update File|Delete File|Move to): (.+)$/.exec(line);
    if (match) {
      const file = match[2];
      if (!file.trim() || file !== file.trim() || file.includes('\\')) throw new Error('Ambiguous patch path');
      paths.push(file);
    } else if (/^\*\*\* /.test(line) && line !== '*** End of File') {
      throw new Error('Unknown patch directive');
    }
  }
  if (!paths.length) throw new Error('Patch has no file directives');
  return [...new Set(paths)];
}

function protectedInfrastructure(root, abs) {
  const rel = path.relative(root, abs).split(path.sep).join('/');
  return /^(?:\.git|\.codex)(?:\/|$)/.test(rel)
    || /^(?:\.agents\/plugins|\.claude-plugin)(?:\/|$)/.test(rel);
}

async function checkPath(entry, ctx, resource) {
  const lexical = path.resolve(resource);
  if (protectedInfrastructure(entry.root, lexical)) return 'Codex/Git executable infrastructure is read-only during rework';
  const realRel = core.realRelOf(entry.root, lexical);
  if (realRel && protectedInfrastructure(entry.root, path.join(entry.root, realRel))) return 'Path resolves to protected executable infrastructure';
  const result = await handlers.get('tool_call')({ toolName: 'write', input: { path: lexical } }, ctx);
  return result?.block ? result.reason : null;
}

async function checkShell(entry, ctx, input, cwd) {
  const command = input.command ?? input.cmd;
  if (typeof command !== 'string') return 'Missing shell command';
  if (input.tty || input.interactive) return 'Interactive shell sessions cannot be safely gated; use apply_patch for edits';
  if (input.env || input.shell) return 'Per-call environment/shell overrides are denied during rework';
  const executionCwd = path.resolve(cwd, input.cwd || input.workdir || '.');
  const analysis = core.analyzeShellWrites(command, 0, executionCwd);
  if (analysis.uncertain) return 'Cannot safely classify shell command: ' + analysis.reasons.join('; ');
  if (analysis.targets.length) return 'Shell file writes are disabled during a Codex rework transaction; use apply_patch so every path can be checked';
  const tokens = core.tokenizeShell(command).tokens;
  // Disallow interpreter/delegation/interactive escapes, even if the Pi lexer
  // classified an invocation without -c as harmless. No write_stdin hook exists.
  const unsafeWords = new Set(['sh', 'bash', 'dash', 'ksh', 'zsh', 'fish', 'eval', 'exec', 'source', 'sudo', 'doas', 'su', 'runuser', 'chroot', 'unshare', 'nsenter', 'setsid', 'nohup', 'flock', 'watch', 'busybox']);
  for (const token of tokens) {
    if (token.kind === 'word' && (unsafeWords.has(path.basename(token.value))
        || /^(?:--chdir|--root|--wd)(?:=|$)/.test(token.value))) {
      return 'Interpreter, persistent process, or cwd-changing wrapper denied during rework';
    }
  }
  // Even read-looking commands may contain background/group constructs. Keep
  // the narrow synchronous path; this is intentionally stricter than Pi.
  if (tokens.some(token => token.kind === 'op' && ['&', '(', ')'].includes(token.value))) return 'Background/group execution denied during rework';
  return null;
}

function controlTool(toolName) {
  if (!toolName.startsWith(CONTROL_PREFIX)) return null;
  const name = toolName.slice(CONTROL_PREFIX.length);
  return tools.has(name) ? name : null;
}

function issueCapability(state, entryKey, entry, name, args) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('Control arguments must be an object');
  if (Object.hasOwn(args, TOKEN_FIELD)) throw new Error('Do not supply the hook-managed session token');
  validateSchema(tools.get(name).parameters, args);
  const token = randomUUID();
  state.capabilities[token] = { entryKey, tool: name, argsHash: argsHash(args), expires: Date.now() + 300000 };
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
      updatedInput: { ...args, [TOKEN_FIELD]: token },
    },
  };
}

export async function handleHook(event) {
  if (!event || typeof event.cwd !== 'string') throw new Error('Missing hook cwd');
  const root = projectRoot(event.cwd);
  if (!root) {
    if (event.hook_event_name === 'PreToolUse' && controlTool(event.tool_name || '')) return deny('Not a Spec Kit project');
    return {};
  }
  return withState(async state => {
    const { key, entry } = sessionEntry(state, event, root);
    const ctx = hydrate(entry);
    const eventName = event.hook_event_name;
    if (eventName === 'SessionStart') {
      // Same-session resume/compaction restores persisted state. A fork starts
      // fresh and will be re-assessed before its first write, never implicitly open.
      return contextOutput(eventName, await stateContext(entry, ctx));
    }
    if (eventName === 'UserPromptSubmit') {
      const prompt = typeof event.prompt === 'string' ? event.prompt : '';
      entry.officialBypass = core.OFFICIAL_RE.test(prompt);
      if (!entry.officialBypass) {
        const pointed = core.pointedEligibleFeature(entry.root);
        if (pointed) ensureRealFeaturePaths(entry.root, pointed.directory);
      }
      await handlers.get('input')({ text: prompt }, ctx);
      save(entry, ctx);
      return contextOutput(eventName, await stateContext(entry, ctx));
    }
    if (eventName !== 'PreToolUse') return {};
    const toolName = event.tool_name || '';
    const input = event.tool_input ?? {};
    const control = controlTool(toolName);
    if (control) return issueCapability(state, key, entry, control, input);
    if (entry.officialBypass) return {};
    const local = toolName.replace(/^functions\./, '');
    if (!entry.txn && !READ_ONLY_LOCAL.has(local) && !READ_ONLY_MCP.has(toolName)) {
      // Do not let a different prompt language or a fresh fork bypass assessment
      // before the first write to an already-implemented pointed feature.
      const pointed = core.pointedEligibleFeature(entry.root);
      if (pointed) ensureRealFeaturePaths(entry.root, pointed.directory);
      await handlers.get('input')({ text: '修改' }, ctx);
      save(entry, ctx);
    }
    if (!entry.txn) return {};
    let reason;
    if (local === 'apply_patch') {
      for (const resource of patchPaths(input.command)) {
        reason = await checkPath(entry, ctx, path.resolve(event.cwd, resource));
        if (reason) break;
      }
    } else if (local === 'Bash' || local === 'exec_command' || local === 'shell_command') {
      reason = await checkShell(entry, ctx, input, event.cwd);
    } else if (!READ_ONLY_LOCAL.has(local) && !READ_ONLY_MCP.has(toolName)) {
      reason = `Tool '${toolName}' is not on the read-only allowlist; arbitrary MCP writes, delegation and interactive channels are denied during rework`;
    }
    save(entry, ctx);
    return reason ? deny(reason) : contextOutput(eventName, await stateContext(entry, ctx));
  });
}

export function validateSchema(schema, value, label = 'arguments') {
  if (schema.anyOf) {
    if (!schema.anyOf.some(variant => { try { validateSchema(variant, value, label); return true; } catch { return false; } })) throw new Error(label + ' has an invalid value');
    return;
  }
  if (Object.hasOwn(schema, 'const') && value !== schema.const) throw new Error(label + ' has an invalid value');
  if (schema.type === 'string' && typeof value !== 'string') throw new Error(label + ' must be a string');
  if (schema.type === 'array') {
    if (!Array.isArray(value)) throw new Error(label + ' must be an array');
    value.forEach((item, i) => validateSchema(schema.items, item, label + '[' + i + ']'));
  }
  if (schema.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(label + ' must be an object');
    for (const name of schema.required || []) if (!Object.hasOwn(value, name)) throw new Error(label + '.' + name + ' is required');
    for (const [name, item] of Object.entries(value)) {
      if (!Object.hasOwn(schema.properties, name)) {
        if (schema.additionalProperties === false) throw new Error('Unexpected argument: ' + name);
      } else validateSchema(schema.properties[name], item, label + '.' + name);
    }
  }
}

function ensureRealFeaturePaths(root, featureDir) {
  if (!featureDir || !/^specs\/[^/]+$/.test(featureDir)) throw new Error('Invalid feature directory');
  const abs = path.join(root, featureDir);
  let scanned = 0;
  const check = (file, depth = 0) => {
    if (++scanned > 10000) throw new Error('Feature directory exceeds the safe scan limit');
    if (depth > 32) throw new Error('Feature directory is too deeply nested');
    let st;
    try { st = lstatSync(file); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
    if (st.isSymbolicLink()) throw new Error('Symlinks in feature artifacts/infrastructure are not supported');
    const rel = path.relative(realpathSync(root), realpathSync(file));
    if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error('Feature path escapes the repository');
    if (st.isDirectory()) for (const name of readdirSync(file)) check(path.join(file, name), depth + 1);
  };
  check(abs);
  const infra = path.join(root, '.specify');
  if (lstatSync(infra).isSymbolicLink()) throw new Error('.specify must not be a symlink');
  const pointer = path.join(infra, 'feature.json');
  try { if (lstatSync(pointer).isSymbolicLink()) throw new Error('Feature pointer must not be a symlink'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}

export async function invokeControl(name, arguments_) {
  if (!tools.has(name)) throw new Error('Unknown rework tool');
  const { [TOKEN_FIELD]: token, ...args } = arguments_ || {};
  if (typeof token !== 'string') throw new Error('Missing session binding: review/trust the speckit-rework hooks in /hooks; never invent a token');
  validateSchema(tools.get(name).parameters, args);
  return withState(async state => {
    const capability = state.capabilities[token];
    if (!capability || capability.expires < Date.now() || capability.tool !== name || capability.argsHash !== argsHash(args)) throw new Error('Invalid, expired or replayed session binding');
    delete state.capabilities[token];
    const entry = state.sessions[capability.entryKey];
    if (!entry) throw new Error('Session state no longer exists');
    const ctx = hydrate(entry);
    if (entry.txn?.phase === 'blocked' && !['speckit_rework_reset', 'speckit_rework_list_features'].includes(name)) {
      return { content: [{ type: 'text', text: JSON.stringify({ ok: false, error: 'Transaction blocked: call speckit_rework_reset explicitly before selecting or editing again' }) }], isError: true };
    }
    const featureDir = name === 'speckit_rework_select_feature' ? args.featureDirectory : entry.txn?.featureDir;
    if (featureDir) ensureRealFeaturePaths(entry.root, featureDir);
    if (name === 'speckit_rework_assess_impact' && args.scope.some(glob => glob.split(/[\\/]/).includes('..'))) throw new Error('Parent traversal in scope is not supported');
    if (name === 'speckit_rework_close' && entry.txn) {
      for (const [rel, hash] of Object.entries(entry.txn.snapshots)) {
        if (core.hashPath(path.join(entry.root, rel)) !== hash) {
          return { content: [{ type: 'text', text: JSON.stringify({ ok: false, error: 'Artifact changed after its gate: ' + rel }) }], isError: true };
        }
      }
    }
    const result = await tools.get(name).execute(randomUUID(), args, undefined, undefined, ctx);
    save(entry, ctx);
    return { content: result.content, isError: result.details?.ok === false };
  });
}

export function controlDescriptors() {
  return [...tools.values()].map(tool => ({
    name: tool.name,
    description: tool.description + ' Session identity is injected by the trusted Codex hook; do not supply the private token argument.',
    inputSchema: {
      ...tool.parameters,
      properties: {
        ...tool.parameters.properties,
        [TOKEN_FIELD]: { type: 'string', description: 'Private transport field injected by the trusted hook; omit this argument.' },
      },
    },
    annotations: { readOnlyHint: tool.name === 'speckit_rework_list_features', destructiveHint: false, openWorldHint: false },
  }));
}
