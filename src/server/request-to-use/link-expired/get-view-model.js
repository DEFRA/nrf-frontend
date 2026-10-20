import { getPageTitle } from '../../common/helpers/page-title.js'

export const pageHeading = 'This link has expired'

/**
 * @returns {object} view model for the link expired page
 */
export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading
  }
}
