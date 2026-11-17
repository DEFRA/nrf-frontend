import { getPageTitle } from '../../common/helpers/page-title.js'
import { planningTypeOptions } from '../../quote/planning-type/options.js'
import { housingOptions } from '../../quote/confirm-housing/options.js'
import { acceptLevyOptions } from '../accept-levy/options.js'
import { changeAction } from '../helpers/change-action/index.js'
import { addressAnswerHtml } from '../helpers/address-answer-html/index.js'
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
 * @param {object} data - the quote session data
 * @returns {string} the row value for the red line boundary
 */
const boundaryAnswerText = (data) => {
  if (data?.boundaryFilename) {
    return data.boundaryFilename
  }

  return data?.boundaryGeojson ? 'Added' : 'Not added'
}

/**
 * The answers given in the request to use journey itself. The agent typed the
 * developer's full name on the enter address page; everyone else's name comes
 * from their Defra ID account. Omitted rather than shown blank: a name is
 * only missing when the Defra ID profile carries none, and an individual
 * never has a business name.
 * @param {object} data - the request to use session data merged with the signed-in user's own name
 * @returns {Array<object>} summary list rows for the request to use answers
 */
const requestToUseRows = (data) => {
  const isAgent = data?.variant === 'agent'
  const fullName = isAgent ? data?.address?.fullName : data?.accountFullName
  const businessName = data?.businessName

  return [
    {
      key: { text: 'Accept levy amount' },
      value: {
        text: acceptLevyOptions.find(
          (option) => option.value === data?.acceptLevy
        )?.text
      },
      actions: changeAction(
        'whether you accept the levy amount',
        acceptLevyPath
      )
    },
    {
      key: { text: 'Requesting to use the levy as' },
      value: { text: userTypeLabels[data?.variant] }
    },
    ...(fullName
      ? [
          {
            key: { text: 'Full name' },
            value: { text: fullName },
            actions: changeAction('full name', enterAddressPath)
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
      value: { html: addressAnswerHtml(data?.address) },
      actions: changeAction('address', enterAddressPath)
    }
  ].filter((row) => row.value.text != null || row.value.html != null)
}

/**
 * The saved quote's own answers, read-only: changes go through the review
 * and amend page, linked below the list. Housing units only apply when the
 * development has housing.
 * @param {object} data - the quote session data saved when the quote was created
 * @returns {Array<object>} summary list rows for the quote's development details
 */
const developmentDetailsRows = (data) =>
  [
    {
      key: { text: 'Planning permission type' },
      value: {
        text: planningTypeOptions.find(
          (option) => option.value === data?.planningType
        )?.text
      }
    },
    {
      key: { text: 'Housing' },
      value: {
        text: housingOptions.find((option) => option.value === data?.isHousing)
          ?.text
      }
    },
    ...(data?.isHousing === 'yes'
      ? [
          {
            key: { text: 'Number of housing units' },
            value: { text: data?.housingUnits }
          }
        ]
      : []),
    {
      key: { text: 'Red line boundary' },
      value: { text: boundaryAnswerText(data) }
    },
    {
      key: { text: 'Email address' },
      value: { text: data?.email }
    }
  ].filter((row) => row.value.text != null)

/**
 * @param {object} [data] - the quote session data merged with the request to
 * use session data (see get-session-data.js)
 * @param {object} [_query] - unused: the parsed request query
 * @returns {object} view model for the check your answers page
 */
export default function getViewModel(data = {}, _query = {}) {
  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    backLinkPath: readThisPath,
    rows: requestToUseRows(data),
    developmentDetailsRows: developmentDetailsRows(data),
    confirmInformationOptions,
    reviewQuotePath: reviewQuoteDetailsPath,
    deleteQuotePath
  }
}
