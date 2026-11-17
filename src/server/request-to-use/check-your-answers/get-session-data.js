import { requestToUseSession } from '../helpers/request-to-use-session/index.js'
import { getQuoteDataFromCache } from '../../quote/helpers/quote-session-cache/index.js'
import { getDisplayName } from '../../common/helpers/get-organisation-heading-data.js'

/**
 * The saved quote's details, merged with the request to use answers the
 * summary rows are built from: the accept levy answer, the persona snapshot
 * and address saved when the address was confirmed, and the signed-in user's
 * own name for the rows an individual or employee cannot have typed.
 * @param {import('@hapi/hapi').Request} request
 * @returns {object} the quote session data merged with the request to use session data
 */
export function getSessionData(request) {
  const { profile } = request.auth.credentials ?? {}
  const { signin, address, acceptLevy } = requestToUseSession.get(request) ?? {}

  return {
    ...getQuoteDataFromCache(request),
    acceptLevy,
    variant: signin?.actualUserType,
    accountFullName: getDisplayName(profile),
    businessName: signin?.organisation?.organisationName,
    address
  }
}
