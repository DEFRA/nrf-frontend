import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as planningTypePath } from '../planning-type/route-path.js'
import { appendChangeParam } from '../helpers/change-mode/index.js'

const pageHeading =
  'Nature restoration levy is not currently available for this planning application type'
const pageTitle = 'Not available for planning type'

/**
 * @param {object} _quoteData - unused: the page renders no cached answers
 * @param {object} [query] - the parsed request query
 * @returns {object} view model for the application-type-not-available page
 */
export default function getViewModel(_quoteData, query = {}) {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: appendChangeParam(planningTypePath, query)
  }
}
