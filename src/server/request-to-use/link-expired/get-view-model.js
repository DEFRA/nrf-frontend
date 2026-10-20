import { getPageTitle } from '../../common/helpers/page-title.js'

export const pageHeading = 'This link has expired'

/**
 * @param {object} _data - unused: the page renders no saved answers
 * @param {object} [_query] - unused: the parsed request query
 * @returns {object} view model for the link expired page
 */
export default function getViewModel(_data = {}, _query = {}) {
  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading
  }
}
