import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as enterEmailPath } from '../enter-email/route-path.js'

export const pageHeading = 'These details do not match our records'

/**
 * @param {object} _data - unused: the page renders no saved answers
 * @param {object} [_query] - unused: the parsed request query
 * @returns {object} view model for the quote not matched page
 */
export default function getViewModel(_data = {}, _query = {}) {
  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    backLinkPath: enterEmailPath
  }
}
