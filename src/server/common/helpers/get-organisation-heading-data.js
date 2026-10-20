import { CHANGE_ORGANISATION_PATH } from '../../auth/auth-urls.js'

/**
 * Builds the view data for the organisation heading component. Returns nothing
 * to show when the request is unauthenticated or the session has no organisation.
 * The change organisation link returns the user to the page they clicked it on.
 * @param {import('@hapi/hapi').Request} request
 * @returns {{ orgOrUserName: string | null, changeOrganisationUrl: string | null }}
 */
export const getOrganisationHeadingData = (request) => {
  const profile = request.auth?.credentials?.profile
  const {
    organisationName,
    hasMultipleOrgPickerEntries,
    shouldShowOrgOrUserName,
    shouldShowCitizenName
  } = profile?.organisation ?? {}

  const displayName =
    profile?.name ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ')

  let orgOrUserName = null
  if (shouldShowOrgOrUserName) {
    orgOrUserName = organisationName || displayName
  } else if (shouldShowCitizenName) {
    orgOrUserName = displayName
  }

  const returnPath = `${request.path}${request.url.search}`
  const changeOrganisationUrl = hasMultipleOrgPickerEntries
    ? `${CHANGE_ORGANISATION_PATH}?redirectTo=${encodeURIComponent(returnPath)}`
    : null

  return { orgOrUserName: orgOrUserName || null, changeOrganisationUrl }
}
