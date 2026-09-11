import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as confirmHousingPath } from '../confirm-housing/route-path.js'
import { appendChangeParam } from '../helpers/change-mode/index.js'

const pageHeading =
  'Nature restoration levy is only available for housing units'
const pageTitle = 'Not housing'

/**
 * @param {object} _quoteData - unused: the page renders no cached answers
 * @param {object} [query] - the parsed request query
 * @returns {object} view model for the not-housing page
 */
export default function getViewModel(_quoteData, query = {}) {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: appendChangeParam(confirmHousingPath, query)
  }
}
