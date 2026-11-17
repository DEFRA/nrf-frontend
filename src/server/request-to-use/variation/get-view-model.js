import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as acceptLevyPath } from '../accept-levy/route-path.js'
import { variationOptions } from './options.js'

export const pageHeading =
  'Is the development an amendment to an existing planning permission?'

/**
 * @param {import('../controller-get.js').ViewModelInput} [input]
 * @returns {object} view model for the variation page
 */
export default function getViewModel({ session } = {}) {
  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    backLinkPath: acceptLevyPath,
    variationOptions,
    formData: { variation: session?.requestToUse?.variation }
  }
}
