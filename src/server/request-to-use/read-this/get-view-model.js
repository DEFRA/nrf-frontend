import { formatCurrency } from '@defra/nrf-library'
import { EDP_NAME } from '../../../shared/edp.js'
import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as checkYourAnswersPath } from '../check-your-answers/route-path.js'
import { routePath as reviewDetailsPath } from '../review-details/route-path.js'

export const pageHeading =
  'Details to read before you request to use the nature restoration levy'

/**
 * @param {import('../controller-get.js').ViewModelInput} [input]
 * @returns {object} view model for the details to read before you request to use the nature restoration levy page
 * @throws {Error} when the session holds no levy: the review and amend quote details page saves it before the user reaches this page
 */
export default function getViewModel({ session } = {}) {
  const { levy, nrlReference } = session?.requestToUse ?? {}
  if (!levy) {
    throw new Error('No levy in the request to use session')
  }

  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    backLinkPath: reviewDetailsPath,
    continuePath: checkYourAnswersPath,
    edpName: EDP_NAME,
    nrlReference,
    provisionalAmount: formatCurrency(levy.provisionalAmount, {
      hideZeroPence: true
    }),
    inflationAdjustedAmount: formatCurrency(levy.inflationAdjustedAmount, {
      hideZeroPence: true
    })
  }
}
