import { getPageTitle } from '../../common/helpers/page-title.js'
import { getPreSignInBackLinkPath } from '../helpers/get-pre-sign-in-back-link-path/index.js'
import { defraAccountUserTypeOptions } from './options.js'

export const pageHeading =
  'Who are you requesting to use the nature restoration levy for?'

/**
 * @param {import('../controller-get.js').ViewModelInput} [input]
 * @returns {object} view model for the who are you requesting to use the levy for page
 */
export default function getViewModel({ session } = {}) {
  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    backLinkPath: getPreSignInBackLinkPath(session?.requestToUse ?? {}),
    defraAccountUserTypeOptions,
    formData: {
      defraAccountUserType: session?.requestToUse?.signin?.intendedUserType
    }
  }
}
