import { requestToUseSession } from '../helpers/request-to-use-session/index.js'

/**
 * @param {import('@hapi/hapi').Request} request
 * @returns {{ defraAccountUserType?: string, variation?: string, originalCommitted?: string }} the saved answer, named as the form field, plus the earlier answers that decide the back link
 */
export function getSessionData(request) {
  const session = requestToUseSession.get(request)

  return {
    defraAccountUserType: session?.defraId?.userType,
    variation: session?.variation,
    originalCommitted: session?.originalCommitted
  }
}
