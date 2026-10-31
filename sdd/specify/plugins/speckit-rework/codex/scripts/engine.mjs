import registerGate, * as core from '../vendor/pi-speckit-rework-gate.ts';

const tools = new Map();
const handlers = new Map();
registerGate({
  registerTool: (tool) => tools.set(tool.name, tool),
  on: (event, handler) => handlers.set(event, handler),
});

export { core, tools, handlers };
