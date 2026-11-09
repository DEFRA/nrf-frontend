import { requestToUseSession } from '../helpers/request-to-use-session/index.js'
import { getOrganisationHeadingData } from '../../common/helpers/get-organisation-heading-data.js'

/**
 * @param {import('@hapi/hapi').Request} request
 * @returns {object} the signed-in user's name, organisation, organisation heading data and the earlier answers that decide the back link
 */
export function getSessionData(request) {
  const { firstName, lastName, organisation } =
    request.auth.credentials?.profile ?? {}
  const session = requestToUseSession.get(request)
  return {
    firstName,
    lastName,
    organisationName: organisation?.organisationName,
    userRelationshipType: organisation?.userRelationshipType,
    variation: session?.variation,
    originalCommitted: session?.originalCommitted,
    ...getOrganisationHeadingData(request)
  }
}
