import { requestToUseSession } from '../helpers/request-to-use-session/index.js'
import { getEnterAddressVariant } from '../helpers/get-enter-address-variant/index.js'
import {
  getDisplayName,
  getOrganisationHeadingData
} from '../../common/helpers/get-organisation-heading-data.js'

/**
 * @param {import('@hapi/hapi').Request} request
 * @returns {object} the persona snapshot and address saved when the address was confirmed, the signed-in user's own name and the organisation heading data
 */
export function getSessionData(request) {
  const { profile } = request.auth.credentials ?? {}
  const session = requestToUseSession.get(request)
  return {
    // The snapshot taken when the address was confirmed decides the persona;
    // the live relationship is only a fallback for sessions saved before the
    // snapshot existed.
    variant:
      session?.signin?.actualUserType ??
      getEnterAddressVariant({
        userRelationshipType: profile?.organisation?.userRelationshipType
      }),
    accountFullName: getDisplayName(profile),
    businessName: session?.signin?.organisation?.organisationName,
    address: session?.address,
    ...getOrganisationHeadingData(request)
  }
}
