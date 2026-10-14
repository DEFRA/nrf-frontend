import { createMockRequest } from './create-mock-request.js'
import { createMockYar } from './create-mock-yar.js'

/**
 * A mock request whose session starts with the given contents.
 * @param {object} [params]
 * @param {Record<string, unknown>} [params.session] - starting session contents
 * @param {object} [params.overrides] - extra request properties
 * @returns {object}
 */
export const createSessionRequest = ({ session = {}, ...overrides } = {}) =>
  createMockRequest({ yar: createMockYar(session), ...overrides })
