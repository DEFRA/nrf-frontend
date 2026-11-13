import { requestToUseSession } from '../helpers/request-to-use-session/index.js'
import { getOrganisationHeadingData } from '../../common/helpers/get-organisation-heading-data.js'

/**
 * @param {import('@hapi/hapi').Request} request
 * @returns {object} the signed-in user's organisation, the saved enter address answers, the earlier answers that decide the back link and the organisation heading data
 */
export function getSessionData(request) {
  const { organisation } = request.auth.credentials?.profile ?? {}
  const session = requestToUseSession.get(request)
  return {
    organisationName: organisation?.organisationName,
    userRelationshipType: organisation?.userRelationshipType,
    fullName: session?.address?.fullName,
    addressLine1: session?.address?.addressLine1,
    addressLine2: session?.address?.addressLine2,
    townOrCity: session?.address?.townOrCity,
    county: session?.address?.county,
    postcode: session?.address?.postcode,
    variation: session?.variation,
    originalCommitted: session?.originalCommitted,
    ...getOrganisationHeadingData(request)
  }
}
