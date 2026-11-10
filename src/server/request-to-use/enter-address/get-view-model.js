import { getPageTitle } from '../../common/helpers/page-title.js'
import { getPreSignInBackLinkPath } from '../helpers/get-pre-sign-in-back-link-path/index.js'
import { getEnterAddressVariant } from './get-variant.js'

export const pageHeadingIndividual = 'What is your address?'

const guidanceByVariant = {
  agent:
    "If you are an agent requesting to use the nature restoration levy on behalf of someone else, enter the developer's full name and address.",
  individual:
    'If you are requesting to use the nature restoration levy for yourself, enter your own address.',
  organisation:
    'If you are an employee, volunteer or contractor of the business or organisation that is requesting to use the nature restoration levy, enter the address for the business or organisation.'
}

const headingTemplatesByVariant = {
  agent: 'What are the details for {organisationName}?',
  individual: pageHeadingIndividual,
  organisation: 'What is the address for {organisationName}?'
}

/**
 * @param {object} [data] - the signed-in user's organisation, the saved enter address answers and the earlier answers that decide the back link
 * @returns {object} template data
 */
export default function getViewModel(data = {}) {
  const variant = getEnterAddressVariant(data)
  const pageHeading = headingTemplatesByVariant[variant].replace(
    '{organisationName}',
    data.organisationName ?? ''
  )

  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    guidanceText: guidanceByVariant[variant],
    // The defra-account pages redirect a signed-in user straight back here,
    // so Back targets the last question before the sign-in funnel.
    backLinkPath: getPreSignInBackLinkPath(data),
    formVariant: variant,
    orgOrUserName: data.orgOrUserName,
    changeOrganisationUrl: data.changeOrganisationUrl
  }
}
