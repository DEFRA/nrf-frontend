import { requestToUseSession } from '../helpers/request-to-use-session/index.js'
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
  // The persona is the snapshot taken when the address was confirmed: the
  // resolved account type and organisation are written to the session once, so
  // this and any later page read them back without re-reading the claims.
  const { signin, address } = requestToUseSession.get(request) ?? {}
  return {
    variant: signin?.actualUserType,
    accountFullName: getDisplayName(profile),
    businessName: signin?.organisation?.organisationName,
    address,
    ...getOrganisationHeadingData(request)
  }
}
