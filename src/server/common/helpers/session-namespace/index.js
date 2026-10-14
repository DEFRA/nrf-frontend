/**
 * Creates the init, get, save and clear functions for one top-level session
 * key whose contents are checked against a closed Joi schema.
 * @param {object} params
 * @param {string} params.key - top-level session key
 * @param {import('joi').ObjectSchema} params.schema - schema for the stored object
 * @returns {{
 *   init: (request: import('@hapi/hapi').Request) => void,
 *   get: (request: import('@hapi/hapi').Request) => object | null,
 *   save: (request: import('@hapi/hapi').Request, data: object) => object | null,
 *   clear: (request: import('@hapi/hapi').Request) => void
 * }} namespace functions
 */
export const createSessionNamespace = ({ key, schema }) => {
  const get = (request) => request.yar.get(key)

  return {
    init: (request) => request.yar.set(key, {}),
    get,
    save: (request, data) => {
      const { error, value } = schema.validate({ ...get(request), ...data })
      if (error) {
        request.logger.error(
          error,
          `session namespace ${key}: invalid data on save`
        )
      }
      request.yar.set(key, value)
      return get(request)
    },
    clear: (request) => request.yar.clear(key)
  }
}
