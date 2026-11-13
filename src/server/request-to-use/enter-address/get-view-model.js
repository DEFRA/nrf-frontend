import { getPageTitle } from '../../common/helpers/page-title.js'
import { getPreSignInBackLinkPath } from '../helpers/get-pre-sign-in-back-link-path/index.js'
import { getEnterAddressVariant } from '../helpers/get-enter-address-variant/index.js'

export const pageHeadingIndividual = 'What is your address?'

const guidanceByVariant = {
  agent:
    "If you are an agent requesting to use the nature restoration levy on behalf of someone else, enter the developer's full name and address.",
  individual:
    'If you are requesting to use the nature restoration levy for yourself, enter your own address.',
  employee:
    'If you are an employee, volunteer or contractor of the business or organisation that is requesting to use the nature restoration levy, enter the address for the business or organisation.'
}

const headingTemplatesByVariant = {
  agent: 'What are the details for {organisationName}?',
  individual: pageHeadingIndividual,
  employee: 'What is the address for {organisationName}?'
}

// Defenders for the rare case where the variant implies an organisation but
// the Defra ID profile carries no organisation name.
const headingWithoutOrganisationByVariant = {
  agent: 'What are the details for the business or organisation?',
  employee: 'What is the address for the business or organisation?'
}

/**
 * @param {object} [data] - the signed-in user's organisation, the saved enter address answers and the earlier answers that decide the back link
 * @returns {object} template data
 */
export default function getViewModel(data = {}) {
  const variant = getEnterAddressVariant(data)
  // A function replacer so `$&` and friends in an organisation name are not
  // treated as replacement patterns.
  const pageHeading = data.organisationName
    ? headingTemplatesByVariant[variant].replace(
        '{organisationName}',
        () => data.organisationName
      )
    : (headingWithoutOrganisationByVariant[variant] ?? pageHeadingIndividual)

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
