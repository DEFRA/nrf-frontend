import { requestToUseSession } from '../helpers/request-to-use-session/index.js'

/**
 * @param {import('@hapi/hapi').Request} request
 * @returns {{ originalReference?: string }} the saved answer, named as the form field
 */
export function getSessionData(request) {
  return {
    originalReference: requestToUseSession.get(request)?.originalNrlReference
  }
}
