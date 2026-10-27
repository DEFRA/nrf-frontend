import { EDP_NAME } from '../../../shared/edp.js'
import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as reviewQuoteDetailsPath } from '../review-quote-details/route-path.js'
import { acceptLevyOptions } from './options.js'

export const pageHeading = 'Do you accept this nature restoration levy amount?'

/**
 * Whole pound amounts are shown without pence.
 * @param {number} amount
 * @returns {string} e.g. £26,750 or £26,750.50
 */
const formatLevyAmount = (amount) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2
  }).format(amount)

/**
 * @param {{ levy?: { provisionalAmount: number, inflationAdjustedAmount: number } }} [data] - the request to use session data
 * @returns {object} view model for the do you accept this nature restoration levy amount page
 * @throws {Error} when the session holds no levy: the review page saves it before redirecting here
 */
export default function getViewModel(data) {
  if (!data?.levy) {
    throw new Error('No levy in the request to use session')
  }

  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    backLinkPath: reviewQuoteDetailsPath,
    edpName: EDP_NAME,
    provisionalAmount: formatLevyAmount(data.levy.provisionalAmount),
    inflationAdjustedAmount: formatLevyAmount(
      data.levy.inflationAdjustedAmount
    ),
    acceptLevyOptions
  }
}
