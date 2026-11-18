import { getPageTitle } from '../../common/helpers/page-title.js'
import { planningTypeOptions } from '../../quote/planning-type/options.js'
import { housingOptions } from '../../quote/confirm-housing/options.js'
import { acceptLevyOptions } from '../accept-levy/options.js'
import { changeAction } from '../helpers/change-action/index.js'
import { addressAnswerHtml } from '../helpers/address-answer-html/index.js'
import { getAddressForRelationship } from '../helpers/request-to-use-session/index.js'
import { routePath as acceptLevyPath } from '../accept-levy/route-path.js'
import { routePath as enterAddressPath } from '../enter-address/route-path.js'
import { routePath as readThisPath } from '../read-this/route-path.js'
import { routePath as reviewQuoteDetailsPath } from '../review-quote-details/route-path.js'
import { routePath as deleteQuotePath } from '../delete-quote/route-path.js'
import { confirmInformationOptions } from './options.js'

export const pageHeading = 'Check your answers'

// The user type is resolved from the Defra ID relationship when the address
// is confirmed; it cannot be changed from this page.
const userTypeLabels = {
  individual: 'Individual',
  employee: 'Employee',
  agent: 'Agent'
}

/**
 * Red line boundary answer, derived from the saved boundary rather than
 * boundaryEntryType. boundaryFilename is user-controlled: it only ever flows
 * into value.text, which govukSummaryList escapes (value.html would not be).
 * @param {object} quote - the quote session data
 * @returns {string} the row value for the red line boundary
 */
const boundaryAnswerText = (quote) => {
  if (quote?.boundaryFilename) {
    return quote.boundaryFilename
  }

  return quote?.boundaryGeojson ? 'Added' : 'Not added'
}

/**
 * The answers given in the request to use journey itself. The agent typed the
 * developer's full name on the enter address page; everyone else's name comes
 * from their Defra ID account. Omitted rather than shown blank: a name is
 * only missing when the Defra ID profile carries none, and an individual
 * never has a business name.
 * @param {object} params
 * @param {object} params.requestToUse - the request to use session data
 * @param {object} [params.address] - the saved enter address answers, already checked against the signed-in relationship
 * @param {string} [params.accountFullName] - the signed-in user's own name
 * @returns {Array<object>} summary list rows for the request to use answers
 */
const requestToUseRows = ({ requestToUse, address, accountFullName }) => {
  const variant = requestToUse?.signin?.actualUserType
  const isAgent = variant === 'agent'
  const fullName = isAgent ? address?.fullName : accountFullName
  const businessName = requestToUse?.signin?.organisation?.organisationName
  // An edit from this page opens the enter address and accept levy pages in
  // change mode, so their back links and submits return here rather than
  // walking the journey on.
  const changeEnterAddressPath = `${enterAddressPath}?change=true`
  const changeAcceptLevyPath = `${acceptLevyPath}?change=true`

  return [
    {
      key: { text: 'Accept levy amount' },
      value: {
        text: acceptLevyOptions.find(
          (option) => option.value === requestToUse?.acceptLevy
        )?.text
      },
      actions: changeAction(
        'whether you accept the levy amount',
        changeAcceptLevyPath
      )
    },
    {
      key: { text: 'Requesting to use the levy as' },
      value: { text: userTypeLabels[variant] }
    },
    ...(fullName
      ? [
          {
            key: { text: 'Full name' },
            value: { text: fullName },
            actions: changeAction('full name', changeEnterAddressPath)
          }
        ]
      : []),
    ...(businessName
      ? [
          {
            key: { text: 'Developer business name' },
            value: { text: businessName }
          }
        ]
      : []),
    {
      key: { text: 'Address' },
      value: { html: addressAnswerHtml(address) },
      actions: changeAction('address', changeEnterAddressPath)
    }
  ].filter((row) => row.value.text != null || row.value.html != null)
}

/**
 * The saved quote's own answers, read-only: changes go through the review
 * and amend page, linked below the list. Housing units only apply when the
 * development has housing.
 * @param {object} quote - the quote session data saved when the quote was created
 * @returns {Array<object>} summary list rows for the quote's development details
 */
const developmentDetailsRows = (quote) =>
  [
    {
      key: { text: 'Planning permission type' },
      value: {
        text: planningTypeOptions.find(
          (option) => option.value === quote?.planningType
        )?.text
      }
    },
    {
      key: { text: 'Housing' },
      value: {
        text: housingOptions.find((option) => option.value === quote?.isHousing)
          ?.text
      }
    },
    ...(quote?.isHousing === 'yes'
      ? [
          {
            key: { text: 'Number of housing units' },
            value: { text: quote?.housingUnits }
          }
        ]
      : []),
    {
      key: { text: 'Red line boundary' },
      value: { text: boundaryAnswerText(quote) }
    },
    {
      key: { text: 'Email address' },
      value: { text: quote?.email }
    }
  ].filter((row) => row.value.text != null)

/**
 * @param {import('../controller-get.js').ViewModelInput} [input]
 * @returns {object} view model for the check your answers page
 */
export default function getViewModel({ session, signedInUser } = {}) {
  const requestToUse = session?.requestToUse
  const address = getAddressForRelationship({
    requestToUse,
    currentRelationshipId: signedInUser?.currentRelationshipId
  })

  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    backLinkPath: readThisPath,
    rows: requestToUseRows({
      requestToUse,
      address,
      accountFullName: signedInUser?.displayName
    }),
    developmentDetailsRows: developmentDetailsRows(session?.quote),
    confirmInformationOptions,
    reviewQuotePath: reviewQuoteDetailsPath,
    deleteQuotePath
  }
}
