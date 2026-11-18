import { formatCurrency } from '@defra/nrf-library'
import { EDP_NAME } from '../../../shared/edp.js'
import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as reviewQuoteDetailsPath } from '../review-quote-details/route-path.js'
import { acceptLevyOptions } from './options.js'

export const pageHeading = 'Do you accept this nature restoration levy amount?'

/**
 * @param {import('../controller-get.js').ViewModelInput} [input]
 * @returns {object} view model for the do you accept this nature restoration levy amount page
 * @throws {Error} when the session holds no levy: the review page saves it before redirecting here
 */
export default function getViewModel({ session } = {}) {
  const { levy, acceptLevy } = session?.requestToUse ?? {}
  if (!levy) {
    throw new Error('No levy in the request to use session')
  }

  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    backLinkPath: reviewQuoteDetailsPath,
    edpName: EDP_NAME,
    provisionalAmount: formatCurrency(levy.provisionalAmount, {
      hideZeroPence: true
    }),
    inflationAdjustedAmount: formatCurrency(levy.inflationAdjustedAmount, {
      hideZeroPence: true
    }),
    acceptLevyOptions,
    formData: { acceptLevy }
  }
}
