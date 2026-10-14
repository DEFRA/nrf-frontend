/**
 * In-memory stand-in for a yar session. Unset keys read as null, like yar.
 * @param {Record<string, unknown>} [initial] - starting session contents
 * @returns {{ get: Function, set: Function, clear: Function }}
 */
export const createMockYar = (initial = {}) => {
  const store = new Map(Object.entries(initial))
  return {
    get: (key) => store.get(key) ?? null,
    set: (key, value) => store.set(key, value),
    clear: (key) => store.delete(key)
  }
}
