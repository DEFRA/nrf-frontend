import {
  getDisplayName,
  getOrganisationHeadingData
} from './get-organisation-heading-data.js'

/**
 * @typedef {object} SignedInUser
 * @property {string} displayName
 * @property {string | null} orgOrUserName - the name for the organisation heading
 * @property {string | null} changeOrganisationUrl
 * @property {string} [currentRelationshipId]
 * @property {{ organisationId?: string, organisationName?: string, userRelationshipType: string, hasMultipleOrgPickerEntries: boolean, shouldShowCitizenName: boolean }} [organisation]
 */

/**
 * The signed-in user, built from the Defra ID profile written to the user
 * session at sign in. The profile holds no tokens, so none reach a view model.
 * @param {import('@hapi/hapi').Request} request
 * @returns {SignedInUser | undefined} undefined when the request is signed out
 */
export const getSignedInUser = (request) => {
  const profile = request.auth?.credentials?.profile
  if (!profile) {
    return undefined
  }

  return {
    ...profile,
    displayName: getDisplayName(profile),
    ...getOrganisationHeadingData(request)
  }
}
