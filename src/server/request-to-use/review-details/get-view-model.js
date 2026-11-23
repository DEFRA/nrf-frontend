import { getPageTitle } from '../../common/helpers/page-title.js'
import { changeAction } from '../helpers/change-action/index.js'
import { addressAnswerHtml } from '../helpers/address-answer-html/index.js'
import { getAddressForRelationship } from '../helpers/request-to-use-session/index.js'
import { routePath as enterAddressPath } from '../enter-address/route-path.js'
import { routePath as readThisPath } from '../read-this/route-path.js'

export const pageHeadingAgent = 'Review and confirm the developer details'
export const pageHeadingPersonal = 'Review and confirm your details'

/**
 * An agent reviews the developer's details; an individual or an employee
 * reviews their own. Only the agent's full name has a change link — the
 * developer typed it on the enter address page; every other name and
 * business name comes from the Defra ID account or the organisation
 * picked at sign in.
 * The persona is the snapshot taken when the address was confirmed: the
 * resolved account type and organisation are written to the session once, so
 * this and any later page read them back without re-reading the claims.
 * @param {import('../controller-get.js').ViewModelInput} [input]
 * @returns {object} view model for the review and confirm the developer details page
 */
export default function getViewModel({ session, signedInUser } = {}) {
  const { signin } = session?.requestToUse ?? {}
  const address = getAddressForRelationship({
    requestToUse: session?.requestToUse,
    currentRelationshipId: signedInUser?.currentRelationshipId
  })
  const isAgent = signin?.actualUserType === 'agent'
  const pageHeading = isAgent ? pageHeadingAgent : pageHeadingPersonal

  // The agent typed the developer's full name on the enter address page;
  // everyone else's name comes from their Defra ID account.
  const fullName = isAgent ? address?.fullName : signedInUser?.displayName
  const businessName = signin?.organisation?.organisationName

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
            value: { text: businessName }
          }
        ]
      : []),
    {
      key: { text: 'Address' },
      value: { html: addressAnswerHtml(address) },
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
    rows
  }
}
