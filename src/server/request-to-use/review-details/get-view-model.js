import { getPageTitle } from '../../common/helpers/page-title.js'
import { CHANGE_ORGANISATION_PATH } from '../../auth/auth-urls.js'
import { changeAction } from '../helpers/change-action/index.js'
import { addressAnswerHtml } from '../helpers/address-answer-html/index.js'
import { routePath as enterAddressPath } from '../enter-address/route-path.js'
import { routePath as readThisPath } from '../read-this/route-path.js'
import { routePath } from './route-path.js'

export const pageHeadingAgent = 'Review and confirm the developer details'
export const pageHeadingPersonal = 'Review and confirm your details'

// The business name is the organisation from the sign-in snapshot: changing it
// means re-picking the organisation, exactly like the change organisation link
// in the organisation heading.
const changeBusinessNameUrl = `${CHANGE_ORGANISATION_PATH}?redirectTo=${encodeURIComponent(routePath)}`

/**
 * An agent reviews the developer's details; an individual or an employee
 * reviews their own. The agent's full name and business name can be changed;
 * the individual's and employee's name and the employee's business name come
 * from the Defra ID account and cannot.
 * @param {object} [data] - the persona snapshot, the saved enter address answers, the signed-in user's own name and the organisation heading data
 * @param {object} [_query] - unused: the parsed request query
 * @returns {object} view model for the review and confirm the developer details page
 */
export default function getViewModel(data = {}, _query = {}) {
  const isAgent = data?.variant === 'agent'
  const pageHeading = isAgent ? pageHeadingAgent : pageHeadingPersonal

  // The agent typed the developer's full name on the enter address page;
  // everyone else's name comes from their Defra ID account.
  const fullName = isAgent ? data?.address?.fullName : data?.accountFullName
  const businessName = data?.businessName

  // Change actions open the enter address page, whose only next page is this
  // one, so amending an answer returns here.
  const rows = [
    // Omitted rather than shown blank: an individual never has a business name
    // and a name is only missing when the Defra ID profile carries none.
    ...(fullName
      ? [
          {
            key: { text: 'Full name' },
            value: { text: fullName },
            ...(isAgent && {
              actions: changeAction(
                "the developer's full name",
                enterAddressPath
              )
            })
          }
        ]
      : []),
    ...(businessName
      ? [
          {
            key: { text: 'Business name' },
            value: { text: businessName },
            ...(isAgent && {
              actions: changeAction('the business name', changeBusinessNameUrl)
            })
          }
        ]
      : []),
    {
      key: { text: 'Address' },
      value: { html: addressAnswerHtml(data?.address) },
      actions: changeAction(
        isAgent ? "the developer's address" : 'your address',
        enterAddressPath
      )
    }
  ]

  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    sectionHeading: isAgent ? 'Developer details' : 'Your details',
    backLinkPath: enterAddressPath,
    continuePath: readThisPath,
    rows,
    orgOrUserName: data?.orgOrUserName,
    changeOrganisationUrl: data?.changeOrganisationUrl
  }
}
