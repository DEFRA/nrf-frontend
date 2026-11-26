import { requestToUseSession } from '../helpers/request-to-use-session/index.js'

/**
 * Saves the amendment answer. Answering no discards the original permission
 * answers, which no longer apply.
 * @param {import('@hapi/hapi').Request} request
 * @param {{ variation: string }} payload - the validated payload
 * @returns {object | null} the merged session data
 */
export const saveVariation = (request, payload) =>
  requestToUseSession.save(request, {
    ...payload,
    ...(payload.variation === 'no' && {
      originalCommitted: undefined,
      originalNrlReference: undefined
    })
  })
