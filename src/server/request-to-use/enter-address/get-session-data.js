import { getOrganisationHeadingData } from '../../common/helpers/get-organisation-heading-data.js'

/**
 * @param {import('@hapi/hapi').Request} request
 * @returns {object} the signed-in user's name, organisation and organisation heading data
 */
export function getSessionData(request) {
  const { firstName, lastName, organisation } =
    request.auth.credentials?.profile ?? {}
  return {
    firstName,
    lastName,
    organisationName: organisation?.organisationName,
    userRelationshipType: organisation?.userRelationshipType,
    ...getOrganisationHeadingData(request)
  }
}
