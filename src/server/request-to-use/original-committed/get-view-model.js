import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as variationPath } from '../variation/route-path.js'
import { originalCommittedOptions } from './options.js'

export const pageHeading =
  'Was the original planning permission committed to using the nature restoration levy?'

/**
 * @param {import('../controller-get.js').ViewModelInput} [input]
 * @returns {object} view model for the original committed page
 */
export default function getViewModel({ session } = {}) {
  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    backLinkPath: variationPath,
    originalCommittedOptions,
    formData: {
      originalCommitted: session?.requestToUse?.originalCommitted
    }
  }
}
