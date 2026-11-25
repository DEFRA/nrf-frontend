import { requestToUseSession } from '../helpers/request-to-use-session/index.js'

/**
 * Saves the original committed answer. Answering no discards the original
 * NRL reference, which no longer applies.
 * @param {import('@hapi/hapi').Request} request
 * @param {{ originalCommitted: string }} payload - the validated payload
 * @returns {object | null} the merged session data
 */
export const saveOriginalCommitted = (request, payload) =>
  requestToUseSession.save(request, {
    ...payload,
    ...(payload.originalCommitted === 'no' && {
      originalNrlReference: undefined
    })
  })
