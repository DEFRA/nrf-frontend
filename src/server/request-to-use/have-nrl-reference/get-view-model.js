import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as whatWouldYouLikeToDoPath } from '../../manage/what-would-you-like-to-do/route-path.js'
import { hasNrlReferenceOptions } from './options.js'

export const pageHeading = 'Do you have an NRL reference?'

/**
 * @param {import('../controller-get.js').ViewModelInput} [input]
 * @returns {object} view model for the do you have an NRL reference page
 */
export default function getViewModel({ session } = {}) {
  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    backLinkPath: whatWouldYouLikeToDoPath,
    hasNrlReferenceOptions,
    formData: { hasNrlReference: session?.retrieveQuote?.hasNrlReference }
  }
}
