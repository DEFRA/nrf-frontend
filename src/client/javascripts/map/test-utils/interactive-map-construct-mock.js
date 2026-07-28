/**
 * @param {Function} constructFn
 */
export function createInteractiveMapConstructMock(constructFn) {
  return new Proxy(function MockInteractiveMap() {}, {
    construct(_target, args) {
      return constructFn(...args)
    }
  })
}
