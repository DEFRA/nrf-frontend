import { getPageTitle } from '../../common/helpers/page-title.js'
import getBoundaryTypePathFromQuote from '../helpers/get-boundary-type-path-from-quote/index.js'

const title =
  'Development is within the excluded area of this Environmental Delivery Plan (EDP)'

export default function getViewModel(quoteData = {}) {
  const backLinkPath = getBoundaryTypePathFromQuote(quoteData)

  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLinkPath
  }
}
