import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CONTROL_PREFIX, TOKEN_FIELD, controlDescriptors, handleHook, invokeControl, patchPaths } from '../scripts/adapter.mjs';
import { core } from '../scripts/engine.mjs';

const base = path.dirname(fileURLToPath(import.meta.url));
const HOOK = path.join(base, '../scripts/hook.mjs');
const FEATURE = 'specs/001-demo';

async function fixture(run, options = {}) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'codex-rework-test-'));
  const root = path.join(dir, 'repo');
  const state = path.join(dir, 'state');
  const old = process.env.CODEX_REWORK_DATA_DIR;
  process.env.CODEX_REWORK_DATA_DIR = state;
  for (const name of ['.specify', FEATURE + '/checklists', 'src', 'other', '.codex']) mkdirSync(path.join(root, name), { recursive: true });
  writeFileSync(path.join(root, '.specify/feature.json'), JSON.stringify({ feature_directory: FEATURE }));
  writeFileSync(path.join(root, FEATURE, 'spec.md'), '# Spec\nOriginal\n');
  writeFileSync(path.join(root, FEATURE, 'plan.md'), '# Plan\nOriginal\n');
  writeFileSync(path.join(root, FEATURE, 'tasks.md'), options.unimplemented ? '- [ ] T001 First\n' : '- [x] T001 First\n- [ ] T002 Second\n');
  writeFileSync(path.join(root, FEATURE, 'checklists/requirements.md'), '- [x] Ready\n');
  writeFileSync(path.join(root, 'src/app.mjs'), 'export const value = 1;\n');
  const event = (eventName, extra = {}, sid = 'session-A') => ({ session_id: sid, cwd: root, hook_event_name: eventName, ...extra });
  const prompt = (text = '修复现有功能', sid) => handleHook(event('UserPromptSubmit', { prompt: text }, sid));
  const pre = (tool_name, tool_input, sid, cwd = root) => handleHook({ ...event('PreToolUse', { tool_name, tool_input }, sid), cwd });
  const control = async (short, args = {}, sid) => {
    const name = 'speckit_rework_' + short;
    const grant = await pre(CONTROL_PREFIX + name, args, sid);
    assert.equal(grant.hookSpecificOutput?.permissionDecision, 'allow');
    const result = await invokeControl(name, grant.hookSpecificOutput.updatedInput);
    return { result, data: JSON.parse(result.content[0].text), grant };
  };
  const open = async (scope = ['src/*.mjs'], sid) => {
    await prompt('修复现有功能', sid);
    assert.equal((await control('select_feature', { featureDirectory: FEATURE }, sid)).data.ok, true);
    const assessed = await control('assess_impact', { affectedStages: [], summary: '仅修复实现，不影响已有规范、计划及任务定义。', scope }, sid);
    assert.equal(assessed.data.phase, 'implementation-open');
  };
  try { await run({ root, dir, state, event, prompt, pre, control, open }); }
  finally {
    if (old === undefined) delete process.env.CODEX_REWORK_DATA_DIR;
    else process.env.CODEX_REWORK_DATA_DIR = old;
    rmSync(dir, { recursive: true, force: true });
  }
}

function patch(...directives) { return ['*** Begin Patch', ...directives, '*** End Patch'].join('\n'); }
function isDenied(result) { return result.hookSpecificOutput?.permissionDecision === 'deny'; }

test('seven tool descriptors expose the original schemas plus an optional hook token', () => {
  const descriptors = controlDescriptors();
  assert.equal(descriptors.length, 7);
  for (const tool of descriptors) {
    assert.ok(tool.inputSchema.properties[TOKEN_FIELD]);
    assert.ok(!tool.inputSchema.required.includes(TOKEN_FIELD));
    assert.equal(tool.inputSchema.additionalProperties, false);
  }
});

test('patch parser checks add/update/delete and both rename endpoints', () => {
  assert.deepEqual(patchPaths(patch('*** Update File: src/a', '*** Move to: other/a', '@@', '-a', '+b', '*** Add File: src/b', '+x', '*** Delete File: src/c')), ['src/a', 'other/a', 'src/b', 'src/c']);
  assert.throws(() => patchPaths('not a patch'));
  assert.throws(() => patchPaths(patch('*** Unknown File: src/a')));
  assert.throws(() => patchPaths(patch('*** Add File: src\\a', '+x')));
});

test('ordinary modifications block edits until impact assessment; read-only planning remains available', () => fixture(async ({ prompt, pre }) => {
  await prompt();
  assert.ok(isDenied(await pre('apply_patch', { command: patch('*** Update File: src/app.mjs', '@@', '-old', '+new') })));
  assert.ok(!isDenied(await pre('update_plan', { plan: [] })));
}));

test('empty affected stages opens only the declared implementation scope', () => fixture(async ({ open, pre }) => {
  await open();
  assert.ok(!isDenied(await pre('apply_patch', { command: patch('*** Update File: src/app.mjs', '@@', '-old', '+new') })));
  assert.ok(isDenied(await pre('apply_patch', { command: patch('*** Add File: other/no.mjs', '+new') })));
  assert.ok(isDenied(await pre('apply_patch', { command: patch('*** Update File: ' + FEATURE + '/spec.md', '@@', '-old', '+new') })));
}));

test('multi-file patches and moves cannot smuggle an out-of-scope path', () => fixture(async ({ open, pre }) => {
  await open();
  assert.ok(isDenied(await pre('apply_patch', { command: patch('*** Add File: src/good.mjs', '+x', '*** Add File: other/bad.mjs', '+y') })));
  assert.ok(isDenied(await pre('apply_patch', { command: patch('*** Update File: src/app.mjs', '*** Move to: other/bad.mjs', '@@', '-old', '+new') })));
}));

test('relative patch paths use the actual session cwd, not the repository root', () => fixture(async ({ root, open, pre }) => {
  await open();
  assert.ok(!isDenied(await pre('apply_patch', { command: patch('*** Update File: app.mjs', '@@', '-old', '+new') }, undefined, path.join(root, 'src'))));
  assert.ok(isDenied(await pre('apply_patch', { command: patch('*** Add File: ../other/bad.mjs', '+x') }, undefined, path.join(root, 'src'))));
}));

test('repo-external writes and symlink escapes are denied', () => fixture(async ({ root, dir, open, pre }) => {
  await open(['src/**']);
  mkdirSync(path.join(dir, 'outside'));
  symlinkSync(path.join(dir, 'outside'), path.join(root, 'src/link'));
  assert.ok(isDenied(await pre('apply_patch', { command: patch('*** Add File: src/link/escape.mjs', '+x') })));
  assert.ok(isDenied(await pre('apply_patch', { command: patch('*** Add File: ' + path.join(dir, 'outside/escape.mjs'), '+x') })));
}));

test('a symlink resolving inside the repo but outside scope is also denied', () => fixture(async ({ root, open, pre }) => {
  await open(['src/**']);
  symlinkSync(path.join(root, 'other'), path.join(root, 'src/link'));
  assert.ok(isDenied(await pre('apply_patch', { command: patch('*** Add File: src/link/escape.mjs', '+x') })));
}));

test('broad scope cannot modify Spec Kit, Codex or Git executable infrastructure', () => fixture(async ({ open, pre }) => {
  await open(['**']);
  for (const file of ['.specify/feature.json', '.codex/config.toml', '.git/config', '.agents/plugins/marketplace.json']) {
    assert.ok(isDenied(await pre('apply_patch', { command: patch('*** Add File: ' + file, '+x') })), file);
  }
}));

test('shell edits, environment overrides, interactive sessions and unknown MCPs fail closed', () => fixture(async ({ open, pre }) => {
  await open();
  for (const input of [
    { command: 'echo x > src/app.mjs' },
    { command: 'python3 -c "print(1)"' },
    { command: 'bash' },
    { command: 'bash -c "echo ok"' },
    { command: 'printf ok', tty: true },
    { command: 'printf ok', env: { LD_PRELOAD: '/tmp/evil' } },
    { command: 'printf ok', shell: '/tmp/evil' },
  ]) assert.ok(isDenied(await pre('Bash', input)), JSON.stringify(input));
  assert.ok(isDenied(await pre('mcp__filesystem__write_file', { file_path: 'src/app.mjs', content: 'x' })));
  assert.ok(isDenied(await pre('spawn_agent', { message: 'edit files' })));
  assert.ok(!isDenied(await pre('Bash', { command: 'ls .' })));
  assert.ok(!isDenied(await pre('Bash', { command: 'printf ok > /dev/null' })));
  assert.ok(!isDenied(await pre('mcp__zotero__zotero_semantic_search', { query: 'test' })));
}));

test('task text is frozen; complete_task changes only the selected checkbox', () => fixture(async ({ root, open, pre, control }) => {
  await open();
  const file = path.join(root, FEATURE, 'tasks.md');
  const original = readFileSync(file, 'utf8');
  assert.ok(isDenied(await pre('apply_patch', { command: patch('*** Update File: ' + FEATURE + '/tasks.md', '@@', '-old', '+new') })));
  assert.equal((await control('complete_task', { taskId: 'T002' })).data.ok, true);
  assert.equal(readFileSync(file, 'utf8'), original.replace('- [ ] T002', '- [x] T002'));
  assert.equal((await control('close', { summary: '完成修复' })).data.phase, 'closed');
  assert.ok(isDenied(await pre('apply_patch', { command: patch('*** Add File: src/after.mjs', '+x') })));
}));

test('stage dependencies and update/no-change evidence are enforced in order', () => fixture(async ({ root, prompt, control, pre }) => {
  await prompt();
  await control('select_feature', { featureDirectory: FEATURE });
  const impact = await control('assess_impact', { affectedStages: ['spec'], summary: '规范变更影响所有下游阶段。', scope: ['src/*.mjs'] });
  assert.deepEqual(impact.data.affectedStages, ['spec', 'plan', 'tasks', 'checklists']);
  assert.equal((await control('gate', { stage: 'spec', decision: 'update', summary: '需要更新' })).data.ok, false);
  writeFileSync(path.join(root, FEATURE, 'spec.md'), '# Updated spec\n');
  assert.equal((await control('gate', { stage: 'spec', decision: 'no-change', summary: '错误声明' })).data.ok, false);
  assert.equal((await control('gate', { stage: 'spec', decision: 'update', summary: '规范已更新' })).data.phase, 'plan-pending');
  for (const stage of ['plan', 'tasks', 'checklists']) {
    assert.equal((await control('gate', { stage, decision: 'no-change', summary: '已检查，无需修改' })).data.ok, true);
  }
  assert.ok(!isDenied(await pre('apply_patch', { command: patch('*** Add File: src/final.mjs', '+x') })));
}));

test('out-of-order gate blocks durably, and select cannot replace an explicit reset', () => fixture(async ({ prompt, control, pre }) => {
  await prompt();
  await control('select_feature', { featureDirectory: FEATURE });
  await control('assess_impact', { affectedStages: ['plan'], summary: '计划及下游受影响。', scope: ['src/*.mjs'] });
  assert.equal((await control('gate', { stage: 'tasks', decision: 'no-change', summary: '错误顺序' })).data.ok, false);
  assert.equal((await control('select_feature', { featureDirectory: FEATURE })).data.ok, false);
  await prompt('继续修复，不要重置');
  assert.ok(isDenied(await pre('apply_patch', { command: patch('*** Add File: src/no.mjs', '+x') })));
  assert.equal((await control('reset', { reason: '恢复门禁顺序错误，重新评估。' })).data.ok, true);
  assert.equal((await control('select_feature', { featureDirectory: FEATURE })).data.ok, true);
}));

test('incomplete checklists refuse implementation', () => fixture(async ({ root, prompt, control }) => {
  await prompt();
  await control('select_feature', { featureDirectory: FEATURE });
  await control('assess_impact', { affectedStages: ['checklists'], summary: '需要核验清单。', scope: ['src/*.mjs'] });
  writeFileSync(path.join(root, FEATURE, 'checklists/requirements.md'), '- [ ] Unresolved\n');
  assert.equal((await control('gate', { stage: 'checklists', decision: 'no-change', summary: '核验清单' })).data.ok, false);
}));

test('control capabilities are required, bound to arguments, and one-use', () => fixture(async ({ pre }) => {
  const name = 'speckit_rework_list_features';
  await assert.rejects(invokeControl(name, {}), /Missing session binding/);
  const grant = await pre(CONTROL_PREFIX + name, {});
  const args = grant.hookSpecificOutput.updatedInput;
  assert.equal(JSON.parse((await invokeControl(name, args)).content[0].text).ok, true);
  await assert.rejects(invokeControl(name, args), /replayed/);
  const select = 'speckit_rework_select_feature';
  const second = await pre(CONTROL_PREFIX + select, { featureDirectory: FEATURE });
  await assert.rejects(invokeControl(select, { ...second.hookSpecificOutput.updatedInput, featureDirectory: 'specs/evil' }), /binding/);
  await assert.rejects(pre(CONTROL_PREFIX + name, { [TOKEN_FIELD]: 'fake' }), /Do not supply/);
}));

test('state persists across hook processes; a new fork does not inherit an open scope', () => fixture(async ({ root, open, pre }) => {
  await open();
  const input = { session_id: 'session-A', cwd: root, hook_event_name: 'PreToolUse', tool_name: 'apply_patch', tool_input: { command: patch('*** Add File: src/allowed.mjs', '+x') } };
  const subprocess = spawnSync(process.execPath, [HOOK], { input: JSON.stringify(input), encoding: 'utf8', env: process.env });
  assert.equal(subprocess.status, 0, subprocess.stderr);
  assert.ok(!isDenied(JSON.parse(subprocess.stdout)));
  assert.ok(isDenied(await pre('apply_patch', { command: patch('*** Add File: src/fork.mjs', '+x') }, 'fork-B')));
}));

test('mentioning /speckit does not bypass; a genuine command does, only until the next prompt', () => fixture(async ({ prompt, pre }) => {
  await prompt();
  await prompt('请说明 /speckit.plan，但继续修复当前功能');
  assert.ok(isDenied(await pre('apply_patch', { command: patch('*** Add File: src/no.mjs', '+x') })));
  await prompt('/speckit.plan 正常规划');
  assert.ok(!isDenied(await pre('apply_patch', { command: patch('*** Add File: src/normal.mjs', '+x') })));
  await prompt('继续修复已有实现');
  assert.ok(isDenied(await pre('apply_patch', { command: patch('*** Add File: src/no-again.mjs', '+x') })));
}));

test('normal never-implemented feature flow is not treated as rework', () => fixture(async ({ prompt, pre }) => {
  await prompt('实现新功能');
  assert.ok(!isDenied(await pre('apply_patch', { command: patch('*** Add File: src/new.mjs', '+x') })));
}, { unimplemented: true }));

test('close refuses artifacts edited behind the gate', () => fixture(async ({ root, open, control }) => {
  await open();
  writeFileSync(path.join(root, FEATURE, 'spec.md'), 'unexpected change\n');
  assert.equal((await control('close', { summary: '不应关闭' })).data.ok, false);
}));

test('symlinked feature pointer is refused before control-tool writes', () => fixture(async ({ root, dir, pre }) => {
  const pointer = path.join(root, '.specify/feature.json');
  rmSync(pointer);
  writeFileSync(path.join(dir, 'external.json'), '{}');
  symlinkSync(path.join(dir, 'external.json'), pointer);
  const name = 'speckit_rework_select_feature';
  const grant = await pre(CONTROL_PREFIX + name, { featureDirectory: FEATURE });
  await assert.rejects(invokeControl(name, grant.hookSpecificOutput.updatedInput), /symlink/);
  assert.equal(readFileSync(path.join(dir, 'external.json'), 'utf8'), '{}');
}));

test('corrupt persisted state produces an explicit PreToolUse denial, not a fail-open exit', () => fixture(async ({ root, state, prompt }) => {
  await prompt();
  writeFileSync(path.join(state, 'state.json'), '{corrupt');
  const result = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ session_id: 'session-A', cwd: root, hook_event_name: 'PreToolUse', tool_name: 'apply_patch', tool_input: { command: patch('*** Add File: src/no.mjs', '+x') } }), encoding: 'utf8', env: process.env });
  assert.equal(result.status, 0);
  assert.ok(isDenied(JSON.parse(result.stdout)));
}));

test('a cyclic artifact symlink is rejected before automatic snapshot traversal', () => fixture(async ({ root, prompt }) => {
  symlinkSync(path.join(root, FEATURE), path.join(root, FEATURE, 'contracts'));
  await assert.rejects(prompt(), /Symlinks/);
}));

test('session B cannot reuse session A implementation scope', () => fixture(async ({ open, pre }) => {
  await open(['src/*.mjs'], 'session-A');
  const command = patch('*** Add File: src/isolated.mjs', '+x');
  assert.ok(!isDenied(await pre('apply_patch', { command }, 'session-A')));
  assert.ok(isDenied(await pre('apply_patch', { command }, 'session-B')));
}));

test('missing hooks cannot be worked around with a fabricated MCP token', () => fixture(async () => {
  await assert.rejects(invokeControl('speckit_rework_list_features', { [TOKEN_FIELD]: 'fabricated' }), /binding/);
}));

test('the original shell analyzer still detects representative write bypasses', () => {
  for (const command of ['echo x >src/a', 'printf x | /usr/bin/tee /tmp/evil', 'dd if=/dev/zero of=/tmp/evil', 'mv src/a /tmp/evil']) {
    assert.ok(core.analyzeShellWrites(command).targets.length > 0, command);
  }
  for (const command of ['python3 -c "open(\"x\",\"w\")"', 'env TMPDIR=/tmp/evil cat file', 'sed -n "w /tmp/evil" file', 'xargs tee']) {
    assert.equal(core.analyzeShellWrites(command).uncertain, true, command);
  }
});
