import { getPageTitle } from '../../common/helpers/page-title.js'

export const title = 'Your details have been deleted'

/**
 * @returns {object} view model for the your details have been deleted page
 */
export default function getViewModel() {
  return {
    pageTitle: getPageTitle(title),
    pageHeading: title
  }
}
