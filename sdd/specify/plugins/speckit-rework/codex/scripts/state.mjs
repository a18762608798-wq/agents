import {
  chmodSync, closeSync, existsSync, lstatSync, mkdirSync, openSync,
  readFileSync, renameSync, unlinkSync, writeFileSync,
} from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';

export function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

export function argsHash(value) {
  return digest(JSON.stringify(canonical(value)));
}

export function dataDirectory() {
  return process.env.CODEX_REWORK_DATA_DIR
    || path.join(process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'local-plugin-state', 'speckit-rework');
}

function privateDirectory(dir) {
  if (existsSync(dir) && lstatSync(dir).isSymbolicLink()) throw new Error('State directory must not be a symlink');
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  chmodSync(dir, 0o700);
}

// All hook processes and the MCP server share this lock. Never guess that a lock
// is stale or delete somebody else's lock; a crash requires explicit recovery.
export async function withState(action) {
  const dir = dataDirectory();
  privateDirectory(dir);
  const lock = path.join(dir, 'state.lock');
  const deadline = Date.now() + 2500;
  let fd;
  for (;;) {
    try {
      fd = openSync(lock, 'wx', 0o600);
      break;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      if (Date.now() >= deadline) throw new Error('Rework state is locked; retry, or inspect the lock owner after a crash');
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 25);
    }
  }
  writeFileSync(fd, JSON.stringify({ pid: process.pid, nonce: randomUUID(), created: Date.now() }));
  const file = path.join(dir, 'state.json');
  let pending;
  try {
    if (existsSync(file) && lstatSync(file).isSymbolicLink()) throw new Error('State file must not be a symlink');
    const state = existsSync(file)
      ? JSON.parse(readFileSync(file, 'utf8'))
      : { version: 1, sessions: {}, capabilities: {} };
    if (state.version !== 1 || !state.sessions || !state.capabilities
        || Array.isArray(state.sessions) || Array.isArray(state.capabilities)) {
      throw new Error('Invalid rework state; refusing to silently reset it');
    }
    const now = Date.now();
    for (const [nonce, capability] of Object.entries(state.capabilities)) {
      if (!capability || capability.expires < now) delete state.capabilities[nonce];
    }
    const result = await action(state);
    pending = path.join(dir, `.state-${randomUUID()}.tmp`);
    writeFileSync(pending, JSON.stringify(state), { mode: 0o600 });
    renameSync(pending, file);
    pending = undefined;
    return result;
  } finally {
    if (pending && existsSync(pending)) unlinkSync(pending);
    closeSync(fd);
    unlinkSync(lock);
  }
}
