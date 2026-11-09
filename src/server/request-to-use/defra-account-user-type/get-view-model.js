import { getPageTitle } from '../../common/helpers/page-title.js'
import { getPreSignInBackLinkPath } from '../helpers/get-pre-sign-in-back-link-path/index.js'
import { defraAccountUserTypeOptions } from './options.js'

export const pageHeading =
  'Who are you requesting to use the nature restoration levy for?'

export default function getViewModel(sessionData) {
  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    backLinkPath: getPreSignInBackLinkPath(sessionData),
    defraAccountUserTypeOptions
  }
}
