import { getPageTitle } from '../../common/helpers/page-title.js'
import getBoundaryTypePathFromQuote from '../helpers/get-boundary-type-path-from-quote/index.js'

export const title = 'Enter your email address'

export default function getViewModel(quoteData = {}) {
  const backLinkPath = getBoundaryTypePathFromQuote(quoteData)

  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLinkPath
  }
}
