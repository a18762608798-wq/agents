// Minimal host-independent pieces used by the vendored Pi gate.
// The adapter serializes all mutations under its cross-process state lock.
export async function withFileMutationQueue(_file, action) {
  return action();
}

export const Type = {
  String: (options = {}) => ({ type: 'string', ...options }),
  Literal: (value) => ({ const: value, type: typeof value }),
  Union: (schemas) => ({ anyOf: schemas }),
  Array: (items, options = {}) => ({ type: 'array', items, ...options }),
  Object: (properties, options = {}) => ({
    type: 'object', properties, required: Object.keys(properties), ...options,
  }),
};
