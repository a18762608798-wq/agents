import { readFileSync } from 'node:fs';

let event;
try {
  event = JSON.parse(readFileSync(0, 'utf8'));
  const { handleHook } = await import('./adapter.mjs');
  process.stdout.write(JSON.stringify(await handleHook(event)) + '\n');
} catch (error) {
  // Supported explicit denial, not an exception/exit-1 that Codex may ignore.
  const reason = '[speckit-rework] Hook failed closed: ' + String(error?.message || error);
  const result = event?.hook_event_name === 'PreToolUse' || !event
    ? { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } }
    : { continue: false, stopReason: reason, systemMessage: reason };
  process.stdout.write(JSON.stringify(result) + '\n');
}
