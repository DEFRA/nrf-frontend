import { formatCurrency } from '@defra/nrf-library'
import { EDP_NAME } from '../../../shared/edp.js'
import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as checkYourAnswersPath } from '../check-your-answers/route-path.js'

export const pageHeading =
  'Details to read before you request to use the nature restoration levy'

// Literal path: the review details page is not built yet. Swap for a
// route-path.js import when it exists.
const reviewDetailsPath = '/request-to-use/review-details'

/**
 * @param {{ levy?: { provisionalAmount: number, inflationAdjustedAmount: number }, nrlReference?: string }} [data] - the request to use session data
 * @returns {object} view model for the details to read before you request to use the nature restoration levy page
 * @throws {Error} when the session holds no levy: the review and amend quote details page saves it before the user reaches this page
 */
export default function getViewModel(data) {
  if (!data?.levy) {
    throw new Error('No levy in the request to use session')
  }

  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    backLinkPath: reviewDetailsPath,
    continuePath: checkYourAnswersPath,
    edpName: EDP_NAME,
    nrlReference: data?.nrlReference,
    provisionalAmount: formatCurrency(data.levy.provisionalAmount, {
      hideZeroPence: true
    }),
    inflationAdjustedAmount: formatCurrency(data.levy.inflationAdjustedAmount, {
      hideZeroPence: true
    })
  }
}
