import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as haveNrlReferencePath } from '../have-nrl-reference/route-path.js'

export const pageHeading =
  'You need a quote before you can request to use the nature restoration levy'

/**
 * @param {object} _data - unused: the page renders no saved answers
 * @param {object} [_query] - unused: the parsed request query
 * @returns {object} view model for the no NRL reference page
 */
export default function getViewModel(_data = {}, _query = {}) {
  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    backLinkPath: haveNrlReferencePath
  }
}
