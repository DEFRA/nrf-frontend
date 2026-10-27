import { getPageTitle } from '../../common/helpers/page-title.js'
import { getDefraAccountUrl } from '../../auth/get-defra-account-url.js'

export const pageHeadingIndividual = 'What is your address?'
export const pageHeadingOrg = 'What is the business or organisation address?'

const representedRelationshipTypes = new Set(['Agent', 'Employee'])

/**
 * @param {object} [data] - the signed-in user's name, organisation and organisation heading data
 * @returns {object} template data
 */
export default function getViewModel(data = {}) {
  const hasOrganisation = representedRelationshipTypes.has(
    data.userRelationshipType
  )
  const pageHeading = hasOrganisation ? pageHeadingOrg : pageHeadingIndividual

  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    fullName: [data.firstName, data.lastName].filter(Boolean).join(' '),
    orgOrUserName: data.orgOrUserName,
    changeOrganisationUrl: data.changeOrganisationUrl,
    representing: hasOrganisation
      ? {
          organisationName: data.organisationName,
          relationship: data.userRelationshipType?.toLowerCase()
        }
      : null,
    defraAccountUrl: getDefraAccountUrl()
  }
}
